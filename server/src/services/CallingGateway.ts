import { Server, Socket } from 'socket.io';
import prisma from '../lib/prisma';
import { normalizePhone, extractDigits } from '../utils/phoneUtils';
import { extractPureChatId } from '../utils/socketHelpers';

export interface UserSessionData {
  userId: string;
  phoneNumber?: string;
  cleanPhone?: string;
  accountType: 'CONSUMER' | 'BUSINESS';
  businessProfileId?: string;
  name: string;
  businessName?: string;
  avatarUrl?: string;
  connectedAt: Date;
}

export interface ResolvedRecipient {
  userId: string;
  phoneNumber?: string;
  cleanPhone?: string;
  accountType: 'CONSUMER' | 'BUSINESS';
  businessProfileId?: string;
  name: string;
  businessName?: string;
  avatarUrl?: string;
  socketIds: string[];
}

export class CallingGateway {
  private static instance: CallingGateway;

  // Track active socket sessions: socketId -> UserSessionData
  private activeSockets = new Map<string, UserSessionData>();

  // Multi-index maps for O(1) cross-platform lookups
  private userToSockets = new Map<string, Set<string>>();
  private phoneToSockets = new Map<string, Set<string>>();
  private businessToSockets = new Map<string, Set<string>>();

  private constructor() {}

  public static getInstance(): CallingGateway {
    if (!CallingGateway.instance) {
      CallingGateway.instance = new CallingGateway();
    }
    return CallingGateway.instance;
  }

  /**
   * Register an incoming socket connection from either VIBEZ Consumer or Business app
   */
  public async registerSocket(io: Server, socket: Socket, rawUserId: string): Promise<UserSessionData | null> {
    if (!rawUserId) return null;

    const cleanUserId = extractPureChatId(rawUserId);

    try {
      // Find user and any associated business profile
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: cleanUserId },
            { id: rawUserId },
            { phoneNumber: rawUserId },
            { phoneNumber: normalizePhone(rawUserId) }
          ]
        },
        include: {
          businessProfile: true
        }
      });

      if (!user) {
        console.warn(`[CallingGateway] Connected user ID '${rawUserId}' not found in database.`);
        // Fallback session
        const fallbackSession: UserSessionData = {
          userId: cleanUserId,
          accountType: 'CONSUMER',
          name: 'User',
          connectedAt: new Date()
        };
        this.storeSession(socket.id, fallbackSession);
        socket.join(`user_${cleanUserId}`);
        socket.join(cleanUserId);
        return fallbackSession;
      }

      const cleanPhone = normalizePhone(user.phoneNumber || '');
      const digitsPhone = extractDigits(user.phoneNumber || '');
      const isBusiness = user.accountType === 'BUSINESS' || !!user.businessProfile;
      const businessProfileId = user.businessProfile?.id;
      const businessName = user.businessProfile?.businessName;

      const sessionData: UserSessionData = {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        cleanPhone,
        accountType: isBusiness ? 'BUSINESS' : 'CONSUMER',
        businessProfileId,
        name: user.name || businessName || 'User',
        businessName,
        avatarUrl: user.avatarUrl || user.businessProfile?.coverImageUrl || undefined,
        connectedAt: new Date()
      };

      this.storeSession(socket.id, sessionData);

      // Join standard signaling rooms
      socket.join(`user_${user.id}`);
      socket.join(user.id);
      if (rawUserId !== user.id) {
        socket.join(`user_${rawUserId}`);
        socket.join(rawUserId);
      }

      if (cleanPhone) {
        socket.join(`phone_${cleanPhone}`);
        socket.join(`user_${cleanPhone}`);
      }
      if (digitsPhone) {
        socket.join(`phone_${digitsPhone}`);
      }

      // If business, join business gateway rooms
      if (businessProfileId) {
        socket.join(`biz_${businessProfileId}`);
        socket.join(`user_${businessProfileId}`);
      }

      socket.join(`app_${sessionData.accountType.toLowerCase()}`);

      console.log(
        `[CallingGateway] Socket ${socket.id} registered for ${sessionData.accountType} ` +
        `'${sessionData.name}' (User: ${user.id}, Phone: ${user.phoneNumber || 'N/A'}, Biz: ${businessProfileId || 'None'})`
      );

      return sessionData;
    } catch (error) {
      console.error('[CallingGateway] Error registering socket:', error);
      return null;
    }
  }

  /**
   * Unregister a socket upon disconnect
   */
  public unregisterSocket(socketId: string): void {
    const session = this.activeSockets.get(socketId);
    if (!session) return;

    this.activeSockets.delete(socketId);

    // Clean user sockets
    const userSet = this.userToSockets.get(session.userId);
    if (userSet) {
      userSet.delete(socketId);
      if (userSet.size === 0) this.userToSockets.delete(session.userId);
    }

    // Clean phone sockets
    if (session.cleanPhone) {
      const phoneSet = this.phoneToSockets.get(session.cleanPhone);
      if (phoneSet) {
        phoneSet.delete(socketId);
        if (phoneSet.size === 0) this.phoneToSockets.delete(session.cleanPhone);
      }
    }

    // Clean business sockets
    if (session.businessProfileId) {
      const bizSet = this.businessToSockets.get(session.businessProfileId);
      if (bizSet) {
        bizSet.delete(socketId);
        if (bizSet.size === 0) this.businessToSockets.delete(session.businessProfileId);
      }
    }

    console.log(`[CallingGateway] Socket ${socketId} unregistered (${session.name})`);
  }

  private storeSession(socketId: string, session: UserSessionData) {
    this.activeSockets.set(socketId, session);

    // Map user
    if (!this.userToSockets.has(session.userId)) {
      this.userToSockets.set(session.userId, new Set());
    }
    this.userToSockets.get(session.userId)!.add(socketId);

    // Map phone
    if (session.cleanPhone) {
      if (!this.phoneToSockets.has(session.cleanPhone)) {
        this.phoneToSockets.set(session.cleanPhone, new Set());
      }
      this.phoneToSockets.get(session.cleanPhone)!.add(socketId);
    }

    // Map business
    if (session.businessProfileId) {
      if (!this.businessToSockets.has(session.businessProfileId)) {
        this.businessToSockets.set(session.businessProfileId, new Set());
      }
      this.businessToSockets.get(session.businessProfileId)!.add(socketId);
    }
  }

  /**
   * Resolves a recipient from any identifier:
   * User UUID, Phone Number, Business Profile ID, or Chat ID
   */
  public async resolveRecipient(targetIdentifier: string, callerUserId?: string): Promise<ResolvedRecipient | null> {
    if (!targetIdentifier) return null;

    let cleanTarget = targetIdentifier.trim();
    if (cleanTarget.startsWith('user_')) cleanTarget = cleanTarget.substring(5);
    if (cleanTarget.startsWith('biz_')) cleanTarget = cleanTarget.substring(4);
    if (cleanTarget.startsWith('phone_')) cleanTarget = cleanTarget.substring(6);
    cleanTarget = extractPureChatId(cleanTarget);

    const normPhone = normalizePhone(cleanTarget);

    // 1. Check in-memory active sockets first
    if (this.userToSockets.has(cleanTarget)) {
      const socketIds = Array.from(this.userToSockets.get(cleanTarget)!);
      const firstSession = this.activeSockets.get(socketIds[0]);
      if (firstSession) {
        return {
          userId: firstSession.userId,
          phoneNumber: firstSession.phoneNumber,
          cleanPhone: firstSession.cleanPhone,
          accountType: firstSession.accountType,
          businessProfileId: firstSession.businessProfileId,
          name: firstSession.name,
          businessName: firstSession.businessName,
          avatarUrl: firstSession.avatarUrl,
          socketIds
        };
      }
    }

    if (normPhone && this.phoneToSockets.has(normPhone)) {
      const socketIds = Array.from(this.phoneToSockets.get(normPhone)!);
      const firstSession = this.activeSockets.get(socketIds[0]);
      if (firstSession) {
        return {
          userId: firstSession.userId,
          phoneNumber: firstSession.phoneNumber,
          cleanPhone: firstSession.cleanPhone,
          accountType: firstSession.accountType,
          businessProfileId: firstSession.businessProfileId,
          name: firstSession.name,
          businessName: firstSession.businessName,
          avatarUrl: firstSession.avatarUrl,
          socketIds
        };
      }
    }

    if (this.businessToSockets.has(cleanTarget)) {
      const socketIds = Array.from(this.businessToSockets.get(cleanTarget)!);
      const firstSession = this.activeSockets.get(socketIds[0]);
      if (firstSession) {
        return {
          userId: firstSession.userId,
          phoneNumber: firstSession.phoneNumber,
          cleanPhone: firstSession.cleanPhone,
          accountType: firstSession.accountType,
          businessProfileId: firstSession.businessProfileId,
          name: firstSession.name,
          businessName: firstSession.businessName,
          avatarUrl: firstSession.avatarUrl,
          socketIds
        };
      }
    }

    // 2. Query Prisma database to resolve cross-platform user
    try {
      // Check User ID directly
      let user = await prisma.user.findUnique({
        where: { id: cleanTarget },
        include: { businessProfile: true }
      });

      // Check Business Profile ID
      if (!user) {
        const biz = await prisma.businessProfile.findUnique({
          where: { id: cleanTarget },
          include: { user: { include: { businessProfile: true } } }
        });
        if (biz && biz.user) {
          user = biz.user;
        }
      }

      // Check Phone Number
      if (!user && normPhone) {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: normPhone },
              { phoneNumber: cleanTarget },
              { phoneNumber: { contains: extractDigits(normPhone).slice(-10) } }
            ]
          },
          include: { businessProfile: true }
        });
      }

      // Check Chat ID (resolve peer recipient)
      if (!user && callerUserId) {
        const chatMember = await prisma.chatMember.findFirst({
          where: {
            chatId: cleanTarget,
            userId: { not: callerUserId }
          },
          include: {
            user: { include: { businessProfile: true } }
          }
        });
        if (chatMember?.user) {
          user = chatMember.user;
        }
      }

      if (user) {
        const cleanPhone = normalizePhone(user.phoneNumber || '');
        const isBusiness = user.accountType === 'BUSINESS' || !!user.businessProfile;
        const businessProfileId = user.businessProfile?.id;
        const businessName = user.businessProfile?.businessName;

        // Gather all currently active sockets for this user across user ID, phone, or business ID
        const activeSocketSet = new Set<string>();
        if (this.userToSockets.has(user.id)) {
          this.userToSockets.get(user.id)!.forEach(s => activeSocketSet.add(s));
        }
        if (cleanPhone && this.phoneToSockets.has(cleanPhone)) {
          this.phoneToSockets.get(cleanPhone)!.forEach(s => activeSocketSet.add(s));
        }
        if (businessProfileId && this.businessToSockets.has(businessProfileId)) {
          this.businessToSockets.get(businessProfileId)!.forEach(s => activeSocketSet.add(s));
        }

        return {
          userId: user.id,
          phoneNumber: user.phoneNumber,
          cleanPhone,
          accountType: isBusiness ? 'BUSINESS' : 'CONSUMER',
          businessProfileId,
          name: user.name || businessName || 'User',
          businessName,
          avatarUrl: user.avatarUrl || user.businessProfile?.coverImageUrl || undefined,
          socketIds: Array.from(activeSocketSet)
        };
      }
    } catch (e) {
      console.error('[CallingGateway] Database lookup error during recipient resolution:', e);
    }

    return null;
  }

  /**
   * Cross-platform WebRTC call dispatch:
   * Enriches payload, routes across rooms, and emits to all target sockets.
   */
  public async routeCallSignaling(
    io: Server,
    socket: Socket,
    event: 'call_offer' | 'incoming_call' | 'call_answer' | 'ice_candidate' | 'end_call' | 'call_ended' | 'call_ringing' | 'call_busy' | 'call_rejected',
    data: any
  ): Promise<boolean> {
    if (!data || !data.targetUserId) {
      console.warn(`[CallingGateway] Cannot route event '${event}': missing data.targetUserId`);
      return false;
    }

    const callerSocketData = this.activeSockets.get(socket.id);
    const callerUserId = callerSocketData?.userId || (socket.data?.userId as string) || (socket.handshake?.query?.userId as string);

    // Resolve target recipient across Consumer and Business apps
    const recipient = await this.resolveRecipient(data.targetUserId, callerUserId);

    // Resolve caller identity details to enrich signal
    let callerName = callerSocketData?.name || 'Vibez User';
    let callerAvatar = callerSocketData?.avatarUrl;
    let callerAccountType = callerSocketData?.accountType || 'CONSUMER';
    let businessName = callerSocketData?.businessName;

    if (!callerSocketData && callerUserId) {
      try {
        const callerDb = await prisma.user.findUnique({
          where: { id: callerUserId },
          include: { businessProfile: true }
        });
        if (callerDb) {
          callerName = callerDb.name || callerDb.businessProfile?.businessName || 'Vibez User';
          callerAvatar = callerDb.avatarUrl || callerDb.businessProfile?.coverImageUrl || undefined;
          callerAccountType = (callerDb.accountType === 'BUSINESS' || !!callerDb.businessProfile) ? 'BUSINESS' : 'CONSUMER';
          businessName = callerDb.businessProfile?.businessName;
        }
      } catch (e) {}
    }

    const isVideo = data.isVideo ?? true;
    const resolvedTargetUserId = recipient ? recipient.userId : extractPureChatId(data.targetUserId);

    // Build standard cross-platform payload
    const payload: any = {
      ...data,
      callerId: callerUserId,
      callerName,
      callerAvatar,
      callerAccountType,
      businessName,
      targetUserId: resolvedTargetUserId,
      isVideo,
      type: isVideo ? 'VIDEO' : 'VOICE',
      timestamp: Date.now()
    };

    console.log(
      `[CallingGateway] Routing '${event}' from ${callerAccountType} '${callerName}' (${callerUserId}) ` +
      `to ${recipient ? recipient.accountType : 'Recipient'} (${resolvedTargetUserId})`
    );

    // 1. Emit to room names
    io.to(`user_${resolvedTargetUserId}`).emit(event, payload);
    io.to(resolvedTargetUserId).emit(event, payload);

    if (recipient?.cleanPhone) {
      io.to(`phone_${recipient.cleanPhone}`).emit(event, payload);
      io.to(`user_${recipient.cleanPhone}`).emit(event, payload);
    }

    if (recipient?.businessProfileId) {
      io.to(`biz_${recipient.businessProfileId}`).emit(event, payload);
      io.to(`user_${recipient.businessProfileId}`).emit(event, payload);
    }

    // 2. Direct socket emissions
    const directSockets = recipient ? recipient.socketIds : [];
    let directEmits = 0;
    directSockets.forEach(sId => {
      const s = io.sockets.sockets.get(sId);
      if (s && s.id !== socket.id) {
        s.emit(event, payload);
        directEmits++;
      }
    });

    // Also scan any connected sockets with matching userId just in case
    for (const [sId, s] of io.sockets.sockets.entries()) {
      if (s.id !== socket.id) {
        const sUserId = s.data?.userId || (s.handshake?.query?.userId as string);
        if (sUserId === resolvedTargetUserId || sUserId === data.targetUserId) {
          s.emit(event, payload);
          directEmits++;
        }
      }
    }

    // If it's a call offer, also emit the 'incoming_call' alias event so both client patterns receive it
    if (event === 'call_offer') {
      io.to(`user_${resolvedTargetUserId}`).emit('incoming_call', payload);
      if (recipient?.businessProfileId) {
        io.to(`biz_${recipient.businessProfileId}`).emit('incoming_call', payload);
      }
    }

    console.log(`[CallingGateway] Dispatched '${event}' to ${directEmits} direct active sockets.`);
    return true;
  }

  /**
   * Returns standardized STUN/TURN configuration for peer connection NAT traversal
   */
  public getIceServers() {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];
  }

  /**
   * Check if target user/business is currently online and available to receive calls
   */
  public async getTargetAvailability(targetId: string, callerUserId?: string) {
    const recipient = await this.resolveRecipient(targetId, callerUserId);
    if (!recipient) {
      return {
        isAvailable: false,
        isOnline: false,
        accountType: 'UNKNOWN',
        name: 'Unknown'
      };
    }

    const isOnline = recipient.socketIds.length > 0;
    return {
      isAvailable: isOnline,
      isOnline,
      userId: recipient.userId,
      accountType: recipient.accountType,
      businessProfileId: recipient.businessProfileId,
      name: recipient.name,
      businessName: recipient.businessName,
      avatarUrl: recipient.avatarUrl
    };
  }
}
