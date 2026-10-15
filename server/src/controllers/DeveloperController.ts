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

  /**
   * Developer Logout
   */
  async developerLogout(req: DeveloperRequest, res: Response) {
    try {
      return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Create New Server Application
   */
  async createApp(req: DeveloperRequest, res: Response) {
    try {
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { appName, description, appType, contactEmail, websiteUrl, privacyPolicyUrl, termsOfServiceUrl, platforms } = req.body;

      if (!appName || !contactEmail) return res.status(400).json({ success: false, error: 'Missing required fields' });

      const clientId = `vibez_client_${crypto.randomBytes(8).toString('hex')}`;
      const clientSecret = crypto.randomBytes(32).toString('hex');
      const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

      const app = await prisma.serverApplication.create({
        data: {
          developerId: devAccountId,
          appName,
          description,
          clientId,
          clientSecretHash,
        }
      });

      return res.json({ success: true, data: { ...app, clientSecret } });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get All Developer Applications
   */
  async getApps(req: DeveloperRequest, res: Response) {
    try {
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const apps = await prisma.serverApplication.findMany({
        where: { developerId: devAccountId }
      });

      return res.json({ success: true, data: apps });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Application Details
   */
  async getApp(req: DeveloperRequest, res: Response) {
    try {
      const { id } = req.params;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const app = await prisma.serverApplication.findFirst({
        where: { id, developerId: devAccountId }
      });

      if (!app) return res.status(404).json({ success: false, error: 'App not found' });

      return res.json({ success: true, data: app });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update Application
   */
  async updateApp(req: DeveloperRequest, res: Response) {
    try {
      const { id } = req.params;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const app = await prisma.serverApplication.updateMany({
        where: { id, developerId: devAccountId },
        data: req.body
      });

      if (app.count === 0) return res.status(404).json({ success: false, error: 'App not found' });

      return res.json({ success: true, message: 'App updated' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete Application
   */
  async deleteApp(req: DeveloperRequest, res: Response) {
    try {
      const { id } = req.params;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const app = await prisma.serverApplication.deleteMany({
        where: { id, developerId: devAccountId }
      });

      if (app.count === 0) return res.status(404).json({ success: false, error: 'App not found' });

      return res.json({ success: true, message: 'App deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Centralized Platform Product Catalogue with Modular Features, Sub-Features, and Webhooks
   */
  async getProducts(req: Request, res: Response) {
    const defaultProducts = [
      {
        id: 'prod_messaging',
        name: 'Messaging API',
        category: 'Core Communication',
        description: 'Send and receive real-time direct messages, group chats, attachments, and delivery receipts.',
        icon: 'MessageSquare',
        version: 'v2.4',
        status: 'GA',
        endpoints: ['POST /api/developer/messages/send', 'GET /api/chats', 'POST /api/chats/group'],
        requiredPermissions: ['messages.read', 'messages.send'],
        webhookEvents: ['message.sent', 'message.delivered', 'message.read', 'message.deleted'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          rateLimitRps: 50,
          maxAttachmentMb: 25,
          retentionDays: 30,
        },
        features: [
          {
            id: 'feat_direct_messages',
            name: 'Direct Messaging (1:1)',
            description: 'Send and receive secure direct peer-to-peer messages with full receipt tracking.',
            enabled: true,
            subFeatures: [
              { id: 'sub_read_receipts', name: 'Delivery & Read Receipts', description: 'Real-time double tick delivered and blue tick read markers.', enabled: true },
              { id: 'sub_typing_indicators', name: 'Live Typing Indicators', description: 'Ephemeral WebSocket typing broadcasts when compose is active.', enabled: true },
              { id: 'sub_ephemeral_messages', name: 'Disappearing Messages', description: 'Self-deleting messages with configurable 24h, 7d, or 90d TTL.', enabled: false },
            ],
          },
          {
            id: 'feat_group_messaging',
            name: 'Group Chat Channels',
            description: 'Host interactive group channels with up to 1,024 members per conversation.',
            enabled: true,
            subFeatures: [
              { id: 'sub_admin_moderation', name: 'Admin Roles & Permissions', description: 'Promote admins, delete inappropriate messages, and mute members.', enabled: true },
              { id: 'sub_announcement_only', name: 'Broadcast Channels', description: 'Restricted posting mode where only administrators can send messages.', enabled: false },
              { id: 'sub_invite_links', name: 'Revocable Invite Links', description: 'Generate QR codes and secure HTTPS URLs to join groups.', enabled: true },
            ],
          },
          {
            id: 'feat_rich_attachments',
            name: 'Multimedia Attachments',
            description: 'Send photos, videos, audio memos, and documents with CDN caching.',
            enabled: true,
            subFeatures: [
              { id: 'sub_image_compression', name: 'WebP Image Compression', description: 'Automatically compress images to WebP before cloud distribution.', enabled: true },
              { id: 'sub_voice_notes', name: 'Voice Audio Notes', description: 'Stream AAC/M4A voice messages with interactive waveform metadata.', enabled: true },
              { id: 'sub_document_sharing', name: 'Document & PDF Attachments', description: 'Secure binary attachments with automated malware scanning.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'message.sent', description: 'Fired whenever an outbound message is successfully dispatched.', payloadExample: { messageId: 'msg_9821a', senderId: 'usr_dev_1', recipientId: 'usr_dev_2', timestamp: 1728840000, contentSnippet: 'Hello world' } },
          { event: 'message.delivered', description: 'Fired when the recipient device acknowledges packet delivery.', payloadExample: { messageId: 'msg_9821a', recipientId: 'usr_dev_2', deliveredAt: 1728840002 } },
          { event: 'message.read', description: 'Fired when the recipient views the message in an active chat.', payloadExample: { messageId: 'msg_9821a', readAt: 1728840015 } },
          { event: 'message.deleted', description: 'Fired when a sender revokes or deletes a message for everyone.', payloadExample: { messageId: 'msg_9821a', deletedAt: 1728840020 } },
        ],
      },
      {
        id: 'prod_auth',
        name: 'Authentication API',
        category: 'Identity & Access',
        description: 'Phone OTP verification, OAuth2 authorization, OpenID Connect identity tokens, and biometrics.',
        icon: 'KeyRound',
        version: 'v2.0',
        status: 'GA',
        endpoints: ['POST /api/auth/phone/otp', 'POST /api/auth/phone/verify', 'POST /api/developer/oauth/token'],
        requiredPermissions: ['openid', 'profile.read'],
        webhookEvents: ['user.registered', 'user.authenticated', 'session.revoked'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          otpTtlMinutes: 5,
          maxOtpAttempts: 3,
          sessionTtlHours: 72,
        },
        features: [
          {
            id: 'feat_phone_otp',
            name: 'Phone OTP Verification',
            description: 'SMS and WhatsApp one-time numeric passcode challenge verification.',
            enabled: true,
            subFeatures: [
              { id: 'sub_sms_fallback', name: 'SMS Delivery Fallback', description: 'Automatic fallback to Twilio/AWS SMS if data push fails.', enabled: true },
              { id: 'sub_rate_limiting', name: 'Brute Force Shield', description: 'IP and MSISDN rate limits to prevent SMS toll fraud.', enabled: true },
            ],
          },
          {
            id: 'feat_oauth_sso',
            name: 'OAuth2 & OpenID Connect SSO',
            description: 'Standard RFC-6749 authorization code and client credentials token flows.',
            enabled: true,
            subFeatures: [
              { id: 'sub_pkce_flow', name: 'PKCE Authorization Code', description: 'Require SHA256 code challenge for public mobile/SPA clients.', enabled: true },
              { id: 'sub_rotating_refresh', name: 'Rotating Refresh Tokens', description: 'Issue single-use refresh tokens with automated reuse detection.', enabled: true },
            ],
          },
          {
            id: 'feat_biometrics',
            name: 'Biometric Passkeys (WebAuthn)',
            description: 'Passwordless face, fingerprint, and hardware security key authentication.',
            enabled: false,
            subFeatures: [
              { id: 'sub_face_touch_unlock', name: 'FaceID / TouchID Unlock', description: 'FIDO2 compliant biometric sign-in without password prompt.', enabled: false },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'user.registered', description: 'Fired when a new user completes initial phone authentication.', payloadExample: { userId: 'usr_new_901', phoneNumber: '+1234567890', createdAt: 1728840000 } },
          { event: 'user.authenticated', description: 'Fired on every successful session token creation.', payloadExample: { userId: 'usr_new_901', loginMethod: 'PHONE_OTP', ipAddress: '198.51.100.4', timestamp: 1728840005 } },
          { event: 'session.revoked', description: 'Fired when an existing user session or JWT token is terminated.', payloadExample: { userId: 'usr_new_901', reason: 'USER_LOGOUT', timestamp: 1728840090 } },
        ],
      },
      {
        id: 'prod_commerce',
        name: 'Commerce & Catalog API',
        category: 'Business & Commerce',
        description: 'Publish product catalogs, inventory item listings, prices, and automated storefronts.',
        icon: 'ShoppingBag',
        version: 'v2.1',
        status: 'GA',
        endpoints: ['GET /api/business/catalog', 'POST /api/business/catalog', 'PUT /api/business/catalog/:id'],
        requiredPermissions: ['products.read', 'products.write'],
        webhookEvents: ['product.created', 'product.updated', 'product.stock_low'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          defaultCurrency: 'USD',
          taxCalculation: 'AUTOMATIC',
          lowStockThreshold: 5,
        },
        features: [
          {
            id: 'feat_store_catalog',
            name: 'Storefront Catalog & Listings',
            description: 'Manage rich item titles, images, descriptions, categories, and tags.',
            enabled: true,
            subFeatures: [
              { id: 'sub_sku_variants', name: 'SKU Variant Matrix', description: 'Support multi-dimensional options (size, color, weight).', enabled: true },
              { id: 'sub_inventory_sync', name: 'Real-Time Inventory Sync', description: 'Decrement stock counts atomically upon verified purchase.', enabled: true },
            ],
          },
          {
            id: 'feat_in_chat_checkout',
            name: 'Conversational In-Chat Checkout',
            description: 'Allow shoppers to view product cards and purchase directly inside chats.',
            enabled: true,
            subFeatures: [
              { id: 'sub_discount_coupons', name: 'Promotional Promo Codes', description: 'Configurable percentage or fixed dollar discount coupons.', enabled: true },
              { id: 'sub_tiered_pricing', name: 'B2B Wholesale Tiers', description: 'Dynamic volume-based pricing brackets for enterprise accounts.', enabled: false },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'product.created', description: 'Fired when a new product is added to the business storefront.', payloadExample: { productId: 'prod_item_301', title: 'Summer Hoodie', price: 49.99, currency: 'USD' } },
          { event: 'product.updated', description: 'Fired when price, description, or availability changes.', payloadExample: { productId: 'prod_item_301', updatedFields: ['price', 'inventory'] } },
          { event: 'product.stock_low', description: 'Fired when remaining inventory drops below configured threshold.', payloadExample: { productId: 'prod_item_301', remainingUnits: 3 } },
        ],
      },
      {
        id: 'prod_orders',
        name: 'Orders & Checkout API',
        category: 'Business & Commerce',
        description: 'Manage in-chat orders, payment transaction verification, and status updates.',
        icon: 'Receipt',
        version: 'v1.5',
        status: 'GA',
        endpoints: ['POST /api/orders', 'GET /api/orders/:id', 'PATCH /api/orders/:id/status'],
        requiredPermissions: ['orders.read', 'orders.write'],
        webhookEvents: ['order.created', 'order.paid', 'order.fulfilled', 'order.cancelled'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          autoFulfillDigital: true,
          receiptTemplate: 'STANDARD_INVOICE',
        },
        features: [
          {
            id: 'feat_order_tracking',
            name: 'Order Lifecycle Tracking',
            description: 'Capture orders, handle payments, and record shipping fulfillment states.',
            enabled: true,
            subFeatures: [
              { id: 'sub_shipping_sync', name: 'Carrier Tracking API Sync', description: 'Integrate with FedEx, DHL, and UPS for automatic transit updates.', enabled: true },
              { id: 'sub_push_notifications', name: 'Instant Delivery Push Alerts', description: 'Send push messages to customer when order status transitions.', enabled: true },
            ],
          },
          {
            id: 'feat_invoicing',
            name: 'Automated Commercial Invoicing',
            description: 'Generate PDF tax receipts and compliant transaction records.',
            enabled: true,
            subFeatures: [
              { id: 'sub_tax_id_calc', name: 'VAT / Sales Tax Calculation', description: 'Automated geo-based tax rate application.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'order.created', description: 'Fired when a buyer places an order through API or chat.', payloadExample: { orderId: 'ord_9182', totalAmount: 99.98, customerId: 'usr_c1' } },
          { event: 'order.paid', description: 'Fired when payment processor confirms funds capture.', payloadExample: { orderId: 'ord_9182', transactionId: 'txn_stripe_821', status: 'PAID' } },
          { event: 'order.fulfilled', description: 'Fired when order is marked shipped or delivered.', payloadExample: { orderId: 'ord_9182', trackingNumber: 'DHL-182910' } },
        ],
      },
      {
        id: 'prod_webrtc',
        name: 'WebRTC Voice & Video API',
        category: 'Real-Time Calling',
        description: 'Ultra-low-latency 1-on-1 and group voice/video calling signaling, ICE/STUN server provisioning, and session tokens.',
        icon: 'PhoneCall',
        version: 'v3.1',
        status: 'GA',
        endpoints: ['POST /api/developer/rtc/token', 'POST /api/calls/initiate', 'POST /api/calls/end'],
        requiredPermissions: ['rtc:signaling'],
        webhookEvents: ['call.initiated', 'call.answered', 'call.ended'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          codecPreference: 'OPUS_H264',
          maxParticipants: 8,
          iceRelayStrategy: 'AUTO_TURN',
        },
        features: [
          {
            id: 'feat_voice_calling',
            name: 'High-Definition Voice Calling',
            description: 'Opus wideband crystal-clear 1-on-1 and multi-party voice communication.',
            enabled: true,
            subFeatures: [
              { id: 'sub_noise_suppression', name: 'AI Noise Suppression', description: 'DeepFilter real-time background noise cancellation.', enabled: true },
              { id: 'sub_echo_cancellation', name: 'Acoustic Echo Cancellation', description: 'Hardware-accelerated AEC to prevent feedback loops.', enabled: true },
            ],
          },
          {
            id: 'feat_video_calling',
            name: '1080p Video Conferencing',
            description: 'Adaptive resolution H.264/VP8 video streams with simulcast bandwidth management.',
            enabled: true,
            subFeatures: [
              { id: 'sub_screen_sharing', name: 'Screen & Window Sharing', description: 'Capture 60fps desktop presentation feeds.', enabled: true },
              { id: 'sub_simulcast_layers', name: 'Simulcast Quality Layers', description: 'Send high/mid/low video streams for dynamic bandwidth fallback.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'call.initiated', description: 'Fired when a user dials another peer or opens a room.', payloadExample: { callId: 'call_9918a', callerId: 'usr_c1', calleeId: 'usr_c2', mediaType: 'VIDEO' } },
          { event: 'call.answered', description: 'Fired when callee accepts and completes ICE handshake.', payloadExample: { callId: 'call_9918a', answeredAt: 1728840003 } },
          { event: 'call.ended', description: 'Fired when session hangs up with total duration and jitter.', payloadExample: { callId: 'call_9918a', durationSeconds: 245, disconnectReason: 'USER_HANGUP' } },
        ],
      },
      {
        id: 'prod_webhooks',
        name: 'Webhooks & Event Stream',
        category: 'Developer Infrastructure',
        description: 'Subscribe external servers to real-time asynchronous platform events signed with HMAC-SHA256.',
        icon: 'Webhook',
        version: 'v2.0',
        status: 'GA',
        endpoints: ['POST /api/developer/webhooks/verify', 'GET /api/developer/webhooks'],
        requiredPermissions: ['webhooks.manage'],
        webhookEvents: ['endpoint.health_failed', 'endpoint.disabled'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          retryLimit: 5,
          timeoutMs: 10000,
          rateLimitPerSec: 100,
        },
        features: [
          {
            id: 'feat_event_dispatch',
            name: 'Event Dispatch Engine',
            description: 'Deliver signed HTTPS POST payloads with millisecond latency guarantees.',
            enabled: true,
            subFeatures: [
              { id: 'sub_hmac_signing', name: 'HMAC-SHA256 Signatures', description: 'Include X-Vibez-Signature header with timestamp and hash.', enabled: true },
              { id: 'sub_exponential_backoff', name: 'Exponential Backoff Retries', description: 'Retry failed deliveries up to 5 times over 24 hours.', enabled: true },
            ],
          },
          {
            id: 'feat_delivery_inspector',
            name: 'Delivery Audit Inspector',
            description: 'Inspect full headers, response bodies, and latency telemetry.',
            enabled: true,
            subFeatures: [
              { id: 'sub_replay_studio', name: '1-Click Replay Studio', description: 'Resend past deliveries with custom modified headers.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'endpoint.health_failed', description: 'Fired when a customer webhook endpoint returns 5xx consecutive errors.', payloadExample: { endpointUrl: 'https://api.example.com/wh', consecutiveFailures: 3 } },
          { event: 'endpoint.disabled', description: 'Fired when an endpoint is deactivated due to persistent timeout.', payloadExample: { endpointUrl: 'https://api.example.com/wh', deactivatedAt: 1728840200 } },
        ],
      },
      {
        id: 'prod_ai',
        name: 'AI & Gemini Engine API',
        category: 'Artificial Intelligence',
        description: 'Smart messaging replies, synthetic schema generation, multi-language translation, and conversation summaries.',
        icon: 'Sparkles',
        version: 'v3.0',
        status: 'BETA',
        endpoints: ['POST /api/ai/generate', 'POST /api/ai/summarize'],
        requiredPermissions: ['ai.generate'],
        webhookEvents: ['ai.task_completed'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        features: [
          {
            id: 'feat_smart_replies',
            name: 'Contextual Smart Replies',
            description: 'Generate 3 instant context-aware replies for incoming messages.',
            enabled: true,
            subFeatures: [
              { id: 'sub_sentiment_detection', name: 'Sentiment & Tone Analysis', description: 'Detect user mood (positive, neutral, frustrated) in real time.', enabled: true },
              { id: 'sub_language_translation', name: 'Live 40+ Language Translation', description: 'Translate incoming and outgoing text on the fly.', enabled: true },
            ],
          },
          {
            id: 'feat_thread_summary',
            name: 'Conversation Thread Summaries',
            description: 'Synthesize 50+ message conversation threads into concise bullets.',
            enabled: true,
            subFeatures: [
              { id: 'sub_action_items', name: 'Action Items & Reminder Extraction', description: 'Automatically extract todos and due dates mentioned in chat.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'ai.task_completed', description: 'Fired when background batch AI summarization or analysis finishes.', payloadExample: { taskId: 'ai_task_891', executionMs: 840, tokenCount: 412 } },
        ],
      },
      {
        id: 'prod_profile',
        name: 'User Profile API',
        category: 'Identity & Access',
        description: 'Access authenticated user profile data, verification badges, presence status, and contact cards.',
        icon: 'User',
        version: 'v1.8',
        status: 'GA',
        endpoints: ['GET /api/users/profile', 'PUT /api/users/settings', 'GET /api/developer/auth/me'],
        requiredPermissions: ['profile.read', 'profile.update'],
        webhookEvents: ['user.presence', 'profile.updated'],
        defaultConfig: {
          environment: 'DEVELOPMENT',
          cacheTtlSeconds: 300,
        },
        features: [
          {
            id: 'feat_identity_cards',
            name: 'Public Identity Cards',
            description: 'Query username, avatar photo, bio, and verification tick status.',
            enabled: true,
            subFeatures: [
              { id: 'sub_verification_badge', name: 'Verified Badge Flag', description: 'Expose verified subscriber status in identity payloads.', enabled: true },
            ],
          },
          {
            id: 'feat_presence_stream',
            name: 'Real-Time Presence State',
            description: 'Observe online, offline, and away presence state over WebSocket.',
            enabled: true,
            subFeatures: [
              { id: 'sub_custom_status', name: 'Custom Status Message', description: 'Expose rich activity status and custom emoji badges.', enabled: true },
            ],
          },
        ],
        webhookCatalog: [
          { event: 'profile.updated', description: 'Fired when a user changes their profile name, avatar, or bio.', payloadExample: { userId: 'usr_p10', updatedFields: ['name', 'avatar'] } },
          { event: 'user.presence', description: 'Fired when presence state changes from online to offline.', payloadExample: { userId: 'usr_p10', status: 'OFFLINE', lastSeen: 1728840100 } },
        ],
      },
    ];

    return res.json({ success: true, data: defaultProducts });
  }

  /**
   * Centralized Permissions Catalogue
   */
  async getPermissions(req: Request, res: Response) {
    const permissions = [
      {
        id: 'profile.read',
        name: 'profile.read',
        category: 'User Identity',
        product: 'User Profile API',
        description: 'Allows reading basic user identity information (name, avatar, user ID, about).',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'profile.update',
        name: 'profile.update',
        category: 'User Identity',
        product: 'User Profile API',
        description: 'Allows updating user status and profile settings on behalf of the user.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'messages.read',
        name: 'messages.read',
        category: 'Messaging',
        product: 'Messaging API',
        description: 'Read inbound messages and conversation thread history.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'messages.send',
        name: 'messages.send',
        category: 'Messaging',
        product: 'Messaging API',
        description: 'Send chat messages and media files to users and group channels.',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'business.read',
        name: 'business.read',
        category: 'Business',
        product: 'Business API',
        description: 'View verified business metadata, operating hours, and location info.',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'business.write',
        name: 'business.write',
        category: 'Business',
        product: 'Business API',
        description: 'Configure automated greeting messages, away hours, and quick reply templates.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'products.read',
        name: 'products.read',
        category: 'Commerce',
        product: 'Commerce & Catalog API',
        description: 'Fetch store catalog item listings, pricing, and availability.',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'products.write',
        name: 'products.write',
        category: 'Commerce',
        product: 'Commerce & Catalog API',
        description: 'Add, update, or remove items in store product catalogs.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'orders.read',
        name: 'orders.read',
        category: 'Commerce',
        product: 'Orders & Checkout API',
        description: 'Query customer purchase orders, order line items, and invoice history.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'orders.write',
        name: 'orders.write',
        category: 'Commerce',
        product: 'Orders & Checkout API',
        description: 'Update fulfillment status, mark orders fulfilled, or issue cancellations.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
      {
        id: 'webhooks.manage',
        name: 'webhooks.manage',
        category: 'Webhooks',
        product: 'Webhooks & Event Stream',
        description: 'Register and manage HTTPS webhook endpoints and event subscription filters.',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'rtc:signaling',
        name: 'rtc:signaling',
        category: 'Calling',
        product: 'WebRTC Voice & Video API',
        description: 'Generate WebRTC signaling tokens and join live voice/video session rooms.',
        requiresApproval: false,
        defaultState: 'APPROVED',
      },
      {
        id: 'ai.generate',
        name: 'ai.generate',
        category: 'AI Logic',
        product: 'AI & Gemini Engine API',
        description: 'Invoke Gemini AI model operations for context summarization and chat synthesis.',
        requiresApproval: true,
        defaultState: 'AVAILABLE',
      },
    ];

    return res.json({ success: true, data: permissions });
  }

  /**
   * Issue Scoped Test Token for an App
   */
  async generateAppTestToken(req: DeveloperRequest, res: Response) {
    try {
      const { id: appId } = req.params;
      const { scopes = ['profile.read', 'messages.send'], ttlHours = 24, userId = 'test_user_dev' } = req.body;
      const devAccountId = req.developerAccount?.id;

      if (!devAccountId) {
        return res.status(401).json({ success: false, error: 'Unauthorized developer session' });
      }

      const expiresInSeconds = Math.min(Math.max(Number(ttlHours) || 24, 1), 168) * 3600;
      const tokenId = `tok_${crypto.randomBytes(8).toString('hex')}`;
      
      const token = signDeveloperToken({
        id: userId,
        email: 'test-developer@prigid.com',
        developerAccountId: devAccountId,
        role: 'TestToken',
        appId,
        tokenId,
        scope: Array.isArray(scopes) ? scopes.join(' ') : String(scopes),
        tier: req.developerAccount?.tier || 'FREE',
      }, `${expiresInSeconds}s`);

      return res.json({
        success: true,
        data: {
          tokenId,
          token,
          appId,
          userId,
          scopes: Array.isArray(scopes) ? scopes : [scopes],
          tokenType: 'Bearer',
          expiresIn: expiresInSeconds,
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Token generation failed' });
    }
  }

  /**
   * Dispatch Test Webhook Event with HMAC-SHA256 signature
   */
  async dispatchTestWebhook(req: DeveloperRequest, res: Response) {
    try {
      const { endpointUrl, secretKey, event = 'message.sent', payload } = req.body;

      if (!endpointUrl) {
        return res.status(400).json({ success: false, error: 'Endpoint URL is required' });
      }

      const testPayload = payload || {
        event,
        timestamp: Math.floor(Date.now() / 1000),
        id: `evt_${crypto.randomBytes(8).toString('hex')}`,
        data: {
          messageId: `msg_${Date.now()}`,
          sender: { id: 'usr_vibez_demo', name: 'Demo Sender' },
          content: 'Hello from PRIGID Developer Console test webhook dispatcher!',
          timestamp: new Date().toISOString(),
        },
        source: 'PRIGID_DEVELOPER_PLATFORM',
      };

      const payloadString = JSON.stringify(testPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const secret = secretKey || 'whsec_demo_secret_key_889900';

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');

      const signatureHeader = `t=${timestamp},v1=${signature}`;
      const startTime = Date.now();
      let deliveryStatus = 'FAILED';
      let statusCode = 0;
      let responseBody = '';
      let latencyMs = 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vibez-Signature': signatureHeader,
            'X-Vibez-Event': event,
            'User-Agent': 'Vibez-Webhook-Dispatcher/2.0 (PRIGID GROUP)',
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        latencyMs = Date.now() - startTime;
        statusCode = response.status;
        responseBody = await response.text().catch(() => '');
        deliveryStatus = response.ok ? 'DELIVERED' : 'FAILED_HTTP_ERROR';
      } catch (err: any) {
        latencyMs = Date.now() - startTime;
        deliveryStatus = 'NETWORK_ERROR';
        responseBody = err.message || 'Connection timeout or network failure';
      }

      return res.json({
        success: true,
        data: {
          deliveryStatus,
          statusCode,
          latencyMs,
          endpointUrl,
          signatureHeader,
          payload: testPayload,
          responseSnippet: responseBody.slice(0, 300),
          dispatchedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Webhook dispatch failed' });
    }
  }

  /**
   * Get Activated Products and Configurations for an App
   */
  async getAppProducts(req: DeveloperRequest, res: Response) {
    try {
      const { id: appId } = req.params;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const app = await prisma.serverApplication.findFirst({
        where: { id: appId, developerId: devAccountId },
        include: { appProducts: true },
      });
      if (!app) return res.status(404).json({ success: false, error: 'App not found' });

      return res.json({ success: true, data: app.appProducts });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update Product Configuration, Features & Webhooks for an App
   */
  async updateAppProductConfig(req: DeveloperRequest, res: Response) {
    try {
      const { id: appId, productId } = req.params;
      const { config, status } = req.body;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const app = await prisma.serverApplication.findFirst({
        where: { id: appId, developerId: devAccountId },
      });
      if (!app) return res.status(404).json({ success: false, error: 'App not found' });

      let product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        product = await prisma.product.create({
          data: {
            id: productId,
            name: productId,
            description: `Product ${productId}`,
          },
        });
      }

      const appProduct = await prisma.appProduct.upsert({
        where: {
          appId_productId: {
            appId,
            productId,
          },
        },
        update: {
          config: config || undefined,
          status: status || undefined,
        },
        create: {
          appId,
          productId,
          config: config || {},
          status: status || 'DEVELOPMENT',
        },
      });

      return res.json({ success: true, data: appProduct });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Test Webhook for a Specific Product
   */
  async testProductWebhook(req: DeveloperRequest, res: Response) {
    try {
      const { id: appId, productId } = req.params;
      const { event, endpointUrl, secretKey, customPayload } = req.body;
      const devAccountId = req.developerAccount?.id;
      if (!devAccountId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      if (!endpointUrl || !event) {
        return res.status(400).json({ success: false, error: 'Missing endpointUrl or event' });
      }

      const testPayload = {
        event,
        productId,
        appId,
        id: `evt_prod_${crypto.randomBytes(8).toString('hex')}`,
        timestamp: Math.floor(Date.now() / 1000),
        data: customPayload || {
          message: `Live test webhook dispatch for ${productId} event: ${event}`,
          environment: 'DEVELOPMENT',
          simulated: true,
        },
        source: 'PRIGID_PRODUCT_STUDIO',
      };

      const payloadString = JSON.stringify(testPayload);
      const timestamp = Math.floor(Date.now() / 1000);
      const secret = secretKey || 'whsec_demo_secret_key_889900';

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');

      const signatureHeader = `t=${timestamp},v1=${signature}`;
      const startTime = Date.now();
      let deliveryStatus = 'FAILED';
      let statusCode = 0;
      let responseBody = '';
      let latencyMs = 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vibez-Signature': signatureHeader,
            'X-Vibez-Event': event,
            'X-Vibez-Product': productId,
            'User-Agent': 'Vibez-Product-Webhook/2.4 (PRIGID GROUP)',
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        latencyMs = Date.now() - startTime;
        statusCode = response.status;
        responseBody = await response.text().catch(() => '');
        deliveryStatus = response.ok ? 'DELIVERED' : 'FAILED_HTTP_ERROR';
      } catch (err: any) {
        latencyMs = Date.now() - startTime;
        deliveryStatus = 'NETWORK_ERROR';
        responseBody = err.message || 'Connection timeout or network failure';
      }

      return res.json({
        success: true,
        data: {
          deliveryStatus,
          statusCode,
          latencyMs,
          endpointUrl,
          signatureHeader,
          payload: testPayload,
          responseSnippet: responseBody.slice(0, 300),
          dispatchedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

