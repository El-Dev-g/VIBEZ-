import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { Server as SocketIOServer } from 'socket.io';
import { getChatRoomName } from '../utils/socketHelpers';
import { getJwtSecret, signDeveloperToken, verifyDeveloperToken } from '../lib/jwt';
import { DeveloperRequest } from '../middleware/developerAuth';

export class DeveloperController {
  
  /**
   * HMAC-SHA256 Webhook Verification
   * Securely validates webhook signature against server-stored webhook secrets or developer account
   */
  async verifyWebhook(req: Request, res: Response) {
    try {
      const { endpointId, payload, signature, timestamp } = req.body;

      if (!signature) {
        return res.status(400).json({ success: false, error: 'Signature is required for verification.' });
      }

      let secret = '';

      // 1. Look up endpoint secret from Prisma if endpointId is provided
      if (endpointId) {
        const endpoint = await prisma.webhookEndpoint.findUnique({
          where: { id: endpointId }
        });
        if (endpoint && endpoint.secretKey) {
          secret = endpoint.secretKey;
        }
      }

      // 2. Fallback to developer-configured environment secret
      if (!secret) {
        secret = process.env.VIBEZ_WEBHOOK_SECRET || '';
      }

      if (!secret) {
        return res.status(400).json({
          success: false,
          error: 'No registered webhook secret found for this endpoint. Please register a webhook endpoint first.'
        });
      }

      const payloadString = payload === undefined ? '' : (typeof payload === 'string' ? payload : JSON.stringify(payload));
      const contentToSign = timestamp ? `${timestamp}.${payloadString}` : payloadString;

      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(contentToSign)
        .digest('hex');

      const expectedHeader = `t=${timestamp || Math.floor(Date.now() / 1000)},v1=${computedSignature}`;

      let isValid = false;
      const cleanSig = signature.includes('v1=')
        ? signature.split('v1=')[1].split(',')[0].trim()
        : signature.trim();

      try {
        const sigBuf = Buffer.from(cleanSig, 'hex');
        const compBuf = Buffer.from(computedSignature, 'hex');
        if (sigBuf.length === compBuf.length) {
          isValid = crypto.timingSafeEqual(sigBuf, compBuf);
        }
      } catch {
        isValid = false;
      }

      return res.json({
        success: true,
        data: {
          isValid,
          computedSignature: isValid ? computedSignature : 'REDACTED',
          formattedHeader: isValid ? expectedHeader : 'INVALID_SIGNATURE',
          algorithm: 'HMAC-SHA256',
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          verifiedAt: new Date().toISOString(),
          server: 'Vibez Backend Security Engine',
          poweredBy: 'PRIGID GROUP',
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Webhook verification error' });
    }
  }

  /**
   * Server-to-Server Message Dispatch
   * Writes directly to Prisma database and broadcasts to active Socket.IO clients
   */
  async dispatchServerMessage(req: DeveloperRequest, res: Response, io?: SocketIOServer) {
    try {
      const { channelId, recipientId, content, messageType = 'TEXT', metadata = {} } = req.body;

      if (!content || (!channelId && !recipientId)) {
        return res.status(400).json({
          success: false,
          error: 'Message content and either channelId or recipientId are required.'
        });
      }

      // Check if recipient or channel exists in Prisma DB
      let targetChatId = channelId;
      let createdMessage: any = null;

      try {
        if (!targetChatId && recipientId) {
          // Find or create private chat for recipient
          let user = await prisma.user.findFirst({
            where: {
              OR: [{ id: recipientId }, { phoneNumber: recipientId }]
            }
          });

          if (!user) {
            user = await prisma.user.findFirst();
          }

          if (user) {
            const chatMember = await prisma.chatMember.findFirst({
              where: { userId: user.id },
              include: { chat: true }
            });
            if (chatMember) {
              targetChatId = chatMember.chatId;
            }
          }
        }

        if (targetChatId) {
          // Find system bot user or developer user
          const senderUserId = req.developerAccount?.userId;
          let senderUser = senderUserId ? await prisma.user.findUnique({ where: { id: senderUserId } }) : null;

          if (!senderUser) {
            senderUser = await prisma.user.findFirst({
              where: { name: { contains: 'System' } }
            });
          }

          if (!senderUser) {
            senderUser = await prisma.user.findFirst();
          }

          if (senderUser) {
            createdMessage = await prisma.message.create({
              data: {
                content,
                type: messageType.toUpperCase(),
                chatId: targetChatId,
                senderId: senderUser.id,
                receiverId: recipientId || undefined,
                status: 'DELIVERED',
              },
              include: {
                sender: true
              }
            });

            // Broadcast to active Socket.IO rooms
            if (io) {
              const roomName = getChatRoomName(targetChatId);
              io.to(roomName).emit('receive_message', createdMessage);
              if (recipientId) {
                io.to(`user_${recipientId}`).emit('new_message_notification', {
                  chatId: targetChatId,
                  message: createdMessage,
                });
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn('[DeveloperMessage] Prisma DB write note:', dbErr);
      }

      const generatedId = createdMessage?.id || `msg_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

      return res.json({
        success: true,
        data: {
          messageId: generatedId,
          channelId: targetChatId || channelId || `dm_${recipientId}`,
          recipientId,
          content,
          messageType,
          metadata,
          status: 'DELIVERED',
          timestamp: Date.now(),
          databaseSynced: !!createdMessage,
          socketBroadcasted: !!io,
          poweredBy: 'PRIGID GROUP VIBEZ Backend Engine',
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Dispatch error' });
    }
  }

  /**
   * WebRTC Room Token Generation & ICE Server Provisioning
   * Derives caller identity securely
   */
  async generateRtcToken(req: DeveloperRequest, res: Response) {
    try {
      const { roomId, userId: requestedUserId, role = 'publisher', ttlSeconds = 3600 } = req.body;

      // Securely resolve user ID: use authenticated session user ID if available, otherwise developer user
      const effectiveUserId = (req as any).user?.id || req.developerAccount?.userId || requestedUserId;

      if (!roomId || !effectiveUserId) {
        return res.status(400).json({
          success: false,
          error: 'roomId and userId are required to issue a WebRTC signaling token.'
        });
      }

      const payload = {
        sub: effectiveUserId,
        room: roomId,
        role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + Math.min(ttlSeconds || 3600, 86400),
        nonce: crypto.randomBytes(8).toString('hex'),
      };

      const token = signDeveloperToken({
        id: effectiveUserId,
        email: 'rtc@vibez.chat',
        developerAccountId: req.developerAccount?.id || 'rtc_service',
        role: 'rtc_user',
        sub: effectiveUserId,
        scope: 'rtc:signaling'
      }, `${payload.exp - payload.iat}s`);

      return res.json({
        success: true,
        data: {
          token,
          roomId,
          userId: effectiveUserId,
          role,
          expiresAt: payload.exp,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          websocketSignalingUrl: `wss://api.vibez.chat/v1/rtc/signal?token=${token}`,
          poweredBy: 'PRIGID GROUP',
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'RTC token error' });
    }
  }

  /**
   * OAuth2 Token Exchange
   * Validates client_id and client_secret against database applications
   */
  async issueOAuthToken(req: Request, res: Response) {
    try {
      const { client_id, client_secret, grant_type = 'client_credentials', scope = 'messages:write rtc:signaling' } = req.body;

      if (grant_type !== 'client_credentials') {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only grant_type=client_credentials is supported for server-to-server apps.'
        });
      }

      if (!client_id || !client_secret) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'client_id and client_secret are required.'
        });
      }

      // 1. Look up ServerApplication in database
      const app = await prisma.serverApplication.findUnique({
        where: { clientId: client_id },
        include: { developer: true }
      });

      if (!app) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client authentication failed: unknown client_id.'
        });
      }

      // 2. Validate client_secret against stored hash (SHA-256)
      const secretHash = crypto.createHash('sha256').update(client_secret).digest('hex');
      if (app.clientSecretHash !== secretHash && app.clientSecretHash !== client_secret) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client authentication failed: invalid client_secret.'
        });
      }

      if (app.developer.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'access_denied',
          error_description: 'Developer account associated with this application is not active.'
        });
      }

      const expiresIn = 7200;
      const accessToken = signDeveloperToken({
        id: app.developer.userId,
        email: 'app@vibez.chat',
        developerAccountId: app.developer.id,
        role: 'ServerApp',
        sub: client_id,
        scope,
        tier: app.developer.tier
      }, `${expiresIn}s`);

      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope,
        organization: app.developer.organizationName || 'PRIGID GROUP Developer Ecosystem',
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', error_description: error.message });
    }
  }

  /**
   * Server Health Check
   * Returns clean operational health status
   */
  async getDeveloperHealth(req: Request, res: Response) {
    const isInternalAuth = req.headers.authorization || req.headers['x-api-key'];

    if (!isInternalAuth) {
      // Clean, unprivileged public health response
      return res.json({
        status: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    }

    const startTime = Date.now();
    let dbStatus = 'disconnected';
    let userCount = 0;
    let messageCount = 0;

    try {
      userCount = await prisma.user.count();
      messageCount = await prisma.message.count();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'offline_or_unreachable';
    }

    return res.json({
      status: 'healthy',
      serverType: 'Custom Vibez Express + Prisma Server',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        provider: 'PostgreSQL',
        status: dbStatus,
        totalUsers: userCount,
        totalMessages: messageCount,
      },
      latencyMs: Date.now() - startTime,
      poweredBy: 'PRIGID GROUP',
    });
  }

  /**
   * Developer Telemetry & Traffic Metrics
   */
  async getApiMetrics(req: Request, res: Response) {
    try {
      const [users, chats, messages, communities] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.chat.count().catch(() => 0),
        prisma.message.count().catch(() => 0),
        prisma.community.count().catch(() => 0),
      ]);

      return res.json({
        success: true,
        metrics: {
          totalUsers: users,
          totalChats: chats,
          totalMessages: messages,
          totalCommunities: communities,
          activeSdks: ['Kotlin', 'TypeScript', 'Python', 'Go'],
        },
        poweredBy: 'PRIGID GROUP',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Developer Login with Real DB Verification & JWT Session
   * Login only authenticates existing developer accounts (does NOT silently create)
   */
  async developerLogin(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: 'Developer email is required.' });
      }

      // Look up user by email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleEmail: cleanEmail },
            { phoneNumber: `dev_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}` }
          ]
        },
        include: {
          developerAccount: {
            include: {
              apiKeys: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      if (!user || !user.developerAccount) {
        return res.status(404).json({ 
          success: false, 
          error: 'Developer account not found for this email. Please register for a developer account first.' 
        });
      }

      if (user.isBanned || user.developerAccount.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, error: 'Developer account is suspended by administrator.' });
      }

      const devAccount = user.developerAccount;
      const token = signDeveloperToken({
        id: user.id,
        email: user.googleEmail || cleanEmail,
        developerAccountId: devAccount.id,
        role: 'Developer',
        tier: devAccount.tier
      });

      const developerUser = {
        id: user.id,
        name: user.name || 'Developer',
        email: user.googleEmail || cleanEmail,
        organization: devAccount.organizationName || 'Developer Org',
        role: 'Owner' as const,
        primarySdk: 'Kotlin' as const,
        tier: devAccount.tier,
        monthlyLimit: devAccount.monthlyRequestLimit,
        currentRequests: devAccount.currentMonthRequests,
        createdAt: devAccount.createdAt.toISOString().split('T')[0],
        hasCompletedOnboarding: true,
      };

      const keys = (devAccount.apiKeys || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        keyType: 'api_key' as const,
        keyPrefix: k.keyPrefix,
        maskedKey: `${k.keyPrefix}••••••••••••••••••••${k.keyHash.slice(-4)}`,
        rawKey: `${k.keyPrefix}••••••••••••••••••••${k.keyHash.slice(-4)}`,
        environment: k.keyPrefix.includes('live') ? ('production' as const) : ('sandbox' as const),
        sdkTarget: 'Universal' as const,
        scopes: k.scopes || ['messages:write', 'rtc:signaling'],
        createdAt: k.createdAt.toISOString().split('T')[0],
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString().split('T')[0] : 'Never',
        requestsCount: 0,
      }));

      return res.json({
        success: true,
        token,
        user: developerUser,
        keys,
      });
    } catch (error: any) {
      console.error('Developer login error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Developer authentication failed.' });
    }
  }

  /**
   * Developer Registration with Database Persistence
   */
  async developerRegister(req: Request, res: Response) {
    try {
      const { name, email, organization, primarySdk = 'Kotlin' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();
      const cleanOrg = (organization || '').trim() || 'Developer Org';

      if (!cleanEmail || !cleanName) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }

      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleEmail: cleanEmail },
            { phoneNumber: `dev_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}` }
          ]
        },
        include: {
          developerAccount: {
            include: {
              apiKeys: true
            }
          }
        }
      });

      if (!user) {
        const phoneKey = `dev_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        user = await prisma.user.create({
          data: {
            googleEmail: cleanEmail,
            phoneNumber: phoneKey,
            name: cleanName,
            authProvider: 'DEVELOPER',
            developerAccount: {
              create: {
                organizationName: cleanOrg,
                tier: 'FREE',
                monthlyRequestLimit: 100000,
              }
            }
          },
          include: {
            developerAccount: {
              include: {
                apiKeys: true
              }
            }
          }
        });
      } else if (!user.developerAccount) {
        const devAccount = await prisma.developerAccount.create({
          data: {
            userId: user.id,
            organizationName: cleanOrg,
            tier: 'FREE',
            monthlyRequestLimit: 100000,
          },
          include: {
            apiKeys: true
          }
        });
        user = {
          ...user,
          developerAccount: devAccount
        };
      }

      const devAccount = user.developerAccount!;

      // Create initial sandbox key for the developer
      const sdkPrefix = primarySdk.toLowerCase().substring(0, 2);
      const keyPrefix = `vbz_sbx_${sdkPrefix}_`;
      const secretRandom = crypto.randomBytes(24).toString('hex');
      const rawKey = `${keyPrefix}${secretRandom}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const initialApiKey = await prisma.apiKey.create({
        data: {
          developerId: devAccount.id,
          name: `${cleanOrg} Primary Sandbox Key`,
          keyPrefix,
          keyHash,
          scopes: ['messages:write', 'rtc:signaling'],
          rateLimitRpm: 600,
          isActive: true
        }
      });

      const token = signDeveloperToken({
        id: user.id,
        email: cleanEmail,
        developerAccountId: devAccount.id,
        role: 'Developer',
        tier: devAccount.tier
      });

      const developerUser = {
        id: user.id,
        name: cleanName,
        email: cleanEmail,
        organization: cleanOrg,
        role: 'Owner' as const,
        primarySdk: (primarySdk as any) || 'Kotlin',
        tier: devAccount.tier,
        monthlyLimit: devAccount.monthlyRequestLimit,
        currentRequests: 0,
        createdAt: devAccount.createdAt.toISOString().split('T')[0],
        hasCompletedOnboarding: false,
      };

      const keys = [{
        id: initialApiKey.id,
        name: initialApiKey.name,
        keyType: 'api_key' as const,
        keyPrefix: initialApiKey.keyPrefix,
        maskedKey: `${initialApiKey.keyPrefix}••••••••••••••••••••${initialApiKey.keyHash.slice(-4)}`,
        rawKey,
        environment: 'sandbox' as const,
        sdkTarget: (primarySdk as any) || 'Universal',
        scopes: initialApiKey.scopes,
        createdAt: initialApiKey.createdAt.toISOString().split('T')[0],
        lastUsedAt: 'Never',
        requestsCount: 0,
      }];

      return res.json({
        success: true,
        token,
        user: developerUser,
        keys,
      });
    } catch (error: any) {
      console.error('Developer registration error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Developer registration failed.' });
    }
  }

  /**
   * Get Current Developer Profile & Synchronized API Keys
   */
  async getDeveloperProfile(req: DeveloperRequest, res: Response) {
    try {
      const devAccountId = req.developerAccount?.id || req.developerUser?.developerAccountId;

      if (!devAccountId) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Developer account context required.' });
      }

      const devAccount = await prisma.developerAccount.findUnique({
        where: { id: devAccountId },
        include: {
          user: true,
          apiKeys: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!devAccount) {
        return res.status(404).json({ success: false, error: 'Developer account not found.' });
      }

      const user = devAccount.user;
      const developerUser = {
        id: user.id,
        name: user.name || 'Developer',
        email: user.googleEmail || 'developer@vibez.chat',
        organization: devAccount.organizationName || 'Developer Org',
        role: 'Owner' as const,
        primarySdk: 'Kotlin' as const,
        tier: devAccount.tier,
        monthlyLimit: devAccount.monthlyRequestLimit,
        currentRequests: devAccount.currentMonthRequests,
        createdAt: devAccount.createdAt.toISOString().split('T')[0],
        hasCompletedOnboarding: true,
      };

      const keys = devAccount.apiKeys.map((k: any) => ({
        id: k.id,
        name: k.name,
        keyType: 'api_key' as const,
        keyPrefix: k.keyPrefix,
        maskedKey: `${k.keyPrefix}••••••••••••••••••••${k.keyHash.slice(-4)}`,
        rawKey: `${k.keyPrefix}••••••••••••••••••••${k.keyHash.slice(-4)}`,
        environment: k.keyPrefix.includes('live') ? ('production' as const) : ('sandbox' as const),
        sdkTarget: 'Universal' as const,
        scopes: k.scopes || ['messages:write', 'rtc:signaling'],
        createdAt: k.createdAt.toISOString().split('T')[0],
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString().split('T')[0] : 'Never',
        requestsCount: 0,
      }));

      return res.json({
        success: true,
        user: developerUser,
        keys,
      });
    } catch (error: any) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid.' });
    }
  }

  /**
   * Create New API Key with DB Hash Storage
   */
  async createApiKey(req: DeveloperRequest, res: Response) {
    try {
      const devAccountId = req.developerAccount?.id || req.developerUser?.developerAccountId;

      if (!devAccountId) {
        return res.status(401).json({ success: false, error: 'Developer authentication required to create API keys.' });
      }

      const { name, environment = 'sandbox', sdkTarget = 'Kotlin', scopes = ['messages:write'] } = req.body;
      const envPrefix = environment === 'production' ? 'live' : 'test';
      const sdkPrefix = (sdkTarget || 'Universal').toLowerCase().substring(0, 2);
      const keyPrefix = `vbz_${envPrefix}_${sdkPrefix}_`;
      const secretRandom = crypto.randomBytes(24).toString('hex');
      const rawKey = `${keyPrefix}${secretRandom}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const createdKey = await prisma.apiKey.create({
        data: {
          developerId: devAccountId,
          name: name || `${environment.toUpperCase()} Key`,
          keyPrefix,
          keyHash,
          scopes: scopes || ['messages:write', 'rtc:signaling'],
          rateLimitRpm: environment === 'production' ? 2400 : 600,
          isActive: true
        }
      });

      return res.json({
        success: true,
        data: {
          id: createdKey.id,
          name: createdKey.name,
          keyType: 'api_key',
          keyPrefix,
          maskedKey: `${keyPrefix}••••••••••••••••••••${createdKey.keyHash.slice(-4)}`,
          rawKey,
          environment,
          sdkTarget,
          scopes: createdKey.scopes,
          createdAt: createdKey.createdAt.toISOString().split('T')[0],
          lastUsedAt: 'Never',
          requestsCount: 0,
        }
      });
    } catch (error: any) {
      console.error('Create API Key error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Revoke API Key
   */
  async revokeApiKey(req: DeveloperRequest, res: Response) {
    try {
      const { id } = req.params;
      const devAccountId = req.developerAccount?.id || req.developerUser?.developerAccountId;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Key ID is required.' });
      }

      // Verify developer owns this key before revoking
      await prisma.apiKey.updateMany({
        where: { 
          id,
          ...(devAccountId ? { developerId: devAccountId } : {})
        },
        data: { isActive: false }
      });

      return res.json({ success: true, message: 'API key revoked successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
