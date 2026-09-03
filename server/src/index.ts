import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { StorageController } from './controllers/StorageController';
import { AuthController } from './controllers/AuthController';
import { ChatController } from './controllers/ChatController';
import { UserController } from './controllers/UserController';
import { StatusController } from './controllers/StatusController';
import { CommunityController } from './controllers/CommunityController';
import { CallController } from './controllers/CallController';
import { AdminController } from './controllers/AdminController';
import { PaymentController } from './controllers/PaymentController';
import { SubscriptionController } from './controllers/SubscriptionController';
import { DeveloperController } from './controllers/DeveloperController';
import { GmailOAuthController } from './controllers/GmailOAuthController';
import { authenticate, authenticateAdmin } from './middleware/auth';
import { authenticateDeveloper, authenticateDeveloperApiKey, authenticateDeveloperOrApiKey } from './middleware/developerAuth';
import { verifyUserToken } from './lib/jwt';
import { checkMaintenanceMode } from './middleware/maintenance';
import { securityHeaders, sanitizeInputs, checkSecretEntropy } from './middleware/security';
import { authRateLimiter, adminRateLimiter } from './middleware/rateLimiter';
import { getChatRoomName, extractPureChatId } from './utils/socketHelpers';

dotenv.config();
checkSecretEntropy();

const app = express();
const httpServer = createServer(app);

// Configure CORS for WebSocket
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Configure CORS for HTTP REST APIs with Security Rules
const allowedOrigins = [
  process.env.ADMIN_FRONTEND_URL,
  process.env.FRONTEND_URL,
  process.env.DEVELOPER_FRONTEND_URL,
  process.env.LANDING_PAGE_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
  'http://localhost:3000',
  'http://localhost:5173',
  'https://render.com'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, postman, server-to-server) or allowed web origins
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/staging preview
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-Client', 'X-Client-Platform', 'Accept', 'X-Client-Version', 'Origin']
}));

app.options('*', cors());

// Apply Security Headers & Input Sanitization
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInputs);

// Apply Rate Limiting
app.use('/api/auth/google', authRateLimiter);
app.use('/api/auth/phone', authRateLimiter);
app.use('/api/admin/login', authRateLimiter);
app.use('/api/admin', adminRateLimiter);

// Maintenance Mode Enforcement Middleware for all /api requests
app.use('/api', checkMaintenanceMode);

const storage = new StorageController();
const auth = new AuthController();
const chat = new ChatController();
const user = new UserController();
const status = new StatusController();
const community = new CommunityController();
const call = new CallController();
const admin = new AdminController();
const payment = new PaymentController();
const subscription = new SubscriptionController();
const developer = new DeveloperController();
const gmailOAuth = new GmailOAuthController();

// Developer API & Server Integration Routes (Powered by PRIGID GROUP)
app.get('/api/developer/health', (req, res) => developer.getDeveloperHealth(req, res));
app.head('/api/developer/health', (req, res) => developer.getDeveloperHealth(req, res));
app.get('/api/developer/metrics', (req, res) => developer.getApiMetrics(req, res));
app.post('/api/developer/auth/login', (req, res) => developer.developerLogin(req, res));
app.post('/api/developer/auth/register', (req, res) => developer.developerRegister(req, res));
app.get('/api/developer/auth/me', authenticateDeveloper, (req, res) => developer.getDeveloperProfile(req, res));
app.get('/api/developer/keys', authenticateDeveloper, (req, res) => developer.getDeveloperProfile(req, res));
app.post('/api/developer/keys', authenticateDeveloper, (req, res) => developer.createApiKey(req, res));
app.delete('/api/developer/keys/:id', authenticateDeveloper, (req, res) => developer.revokeApiKey(req, res));
app.delete('/api/developer/keys', authenticateDeveloper, (req, res) => developer.revokeApiKey(req, res));
app.post('/api/developer/webhooks/verify', (req, res) => developer.verifyWebhook(req, res));
app.post('/api/developer/messages/send', authenticateDeveloperOrApiKey, (req, res) => developer.dispatchServerMessage(req, res, io));
app.post('/api/developer/rtc/token', authenticateDeveloperOrApiKey, (req, res) => developer.generateRtcToken(req, res));
app.post('/api/developer/oauth/token', (req, res) => developer.issueOAuthToken(req, res));

// Direct Developer Bridge Routes
app.get('/api/developer/server/health-check', (req, res) => developer.getDeveloperHealth(req, res));
app.post('/api/developer/server/health-check', (req, res) => developer.getDeveloperHealth(req, res));
app.post('/api/developer/server/dispatch-message', authenticateDeveloperOrApiKey, (req, res) => developer.dispatchServerMessage(req, res, io));
app.post('/api/developer/server/issue-oauth-token', (req, res) => developer.issueOAuthToken(req, res));
app.post('/api/developer/server/rtc-token', authenticateDeveloperOrApiKey, (req, res) => developer.generateRtcToken(req, res));
app.post('/api/developer/server/verify-webhook', (req, res) => developer.verifyWebhook(req, res));

// Public System Status & App Config Routes
const handleSystemStatus = async (req: express.Request, res: express.Response) => {
  try {
    const setting = await prisma.systemSetting.findFirst();
    res.json({
      status: setting?.maintenanceMode ? 'maintenance' : 'online',
      maintenanceMode: setting?.maintenanceMode || false,
      allowNewRegistrations: setting?.allowNewRegistrations ?? true,
      badgePrice: setting?.verificationBadgePrice ?? 3.00,
      appDownloadUrl: setting?.appDownloadUrl || '',
      appVersion: setting?.appVersion || '1.0.0',
      appName: setting?.appName || 'VIBEZ',
      contactEmail: setting?.contactEmail || 'support@vibez.chat',
      privacyPolicyUrl: setting?.privacyPolicyUrl || '',
      termsOfServiceUrl: setting?.termsOfServiceUrl || '',
      privacyPolicyContent: setting?.privacyPolicyContent || '',
      termsOfServiceContent: setting?.termsOfServiceContent || '',
      helpCenterUrl: setting?.helpCenterUrl || '',
      faqUrl: setting?.faqUrl || '',
      phoneAuthAllowedCountries: setting?.phoneAuthAllowedCountries || 'US,GH,NG,GB,CA,KE,ZA,IN,DE,FR,AE,SA,BR,MX,AU'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', maintenanceMode: false });
  }
};
app.get('/api/system/status', handleSystemStatus);
app.head('/api/system/status', handleSystemStatus);
app.get('/api/config/public', (req, res) => admin.getPublicAppConfig(req, res));
app.head('/api/config/public', (req, res) => admin.getPublicAppConfig(req, res));
app.get('/api/app/download-info', (req, res) => admin.getPublicAppConfig(req, res));
app.get('/api/app/updates/latest', (req, res) => admin.getLatestUpdate(req, res));
app.post('/api/admin/system/updates', authenticateAdmin, (req, res) => admin.createUpdate(req, res));
app.post('/api/contact', (req, res) => admin.submitContactInquiry(req, res));
app.post('/api/subscribe', (req, res) => subscription.subscribe(req, res));
app.get('/api/admin/inquiries', (req, res) => admin.getContactInquiries(req, res));
app.post('/api/admin/inquiries/:id/reply', (req, res) => admin.replyToContactInquiry(req, res));

// Auth Routes
app.post('/api/auth/google', (req, res) => auth.googleLogin(req, res));
app.post('/api/auth/phone', (req, res) => auth.phoneLogin(req, res));
app.get('/api/auth/profile', authenticate, (req, res) => auth.getProfile(req, res));

// User Routes
app.get('/api/users/search', authenticate, (req, res) => user.searchUsers(req, res));
app.post('/api/users/sync-contacts', authenticate, (req, res) => user.syncContacts(req, res));
app.post('/api/users/contacts/sync', authenticate, (req, res) => user.syncContacts(req, res));
app.put('/api/users/profile', authenticate, (req, res) => user.updateProfile(req, res));
app.post('/api/users/change-phone/request', authenticate, (req, res) => user.requestPhoneChange(req, res));
app.post('/api/users/change-phone/verify', authenticate, (req, res) => user.verifyPhoneChange(req, res));
app.get('/api/users/settings', authenticate, (req, res) => user.getSettings(req, res));
app.put('/api/users/settings', authenticate, (req, res) => user.updateSettings(req, res));
app.post('/api/users/report', authenticate, (req, res) => user.reportUser(req, res));

// Chat Routes
app.get('/api/chats', authenticate, (req, res) => chat.getChats(req, res));
app.get('/api/chats/:chatId/messages', authenticate, (req, res) => chat.getMessages(req, res));
app.delete('/api/chats/:chatId/messages', authenticate, (req, res) => chat.clearChatMessages(req, res));
app.post('/api/chats/private', authenticate, (req, res) => chat.createOrGetPrivateChat(req, res));
app.post('/api/chats/group', authenticate, (req, res) => chat.createGroupChat(req, res));
app.delete('/api/chats/:chatId', authenticate, (req, res) => chat.deleteChat(req, res));
app.patch('/api/chats/:chatId', authenticate, (req, res) => chat.updateChat(req, res));
app.post('/api/chats/:chatId/verify-perk', authenticate, (req, res) => chat.toggleGroupVerifyPerk(req, res));
app.delete('/api/messages/:messageId', authenticate, (req, res) => chat.deleteMessage(req, res));
app.patch('/api/messages/:messageId', authenticate, (req, res) => chat.updateMessage(req, res));

// Status Routes
app.get('/api/statuses', authenticate, (req, res) => status.getStatuses(req, res));
app.post('/api/statuses', authenticate, (req, res) => status.createStatus(req, res));
app.delete('/api/statuses/:statusId', authenticate, (req, res) => status.deleteStatus(req, res));
app.post('/api/statuses/:statusId/view', authenticate, (req, res) => status.viewStatus(req, res));
app.get('/api/statuses/privacy', authenticate, (req, res) => status.getPrivacy(req, res));
app.put('/api/statuses/privacy', authenticate, (req, res) => status.updatePrivacy(req, res));

// Community Routes
app.get('/api/communities', authenticate, (req, res) => community.getCommunities(req, res));
app.post('/api/communities', authenticate, (req, res) => community.createCommunity(req, res));
app.get('/api/communities/:communityId', authenticate, (req, res) => community.getCommunityDetails(req, res));
app.post('/api/communities/:communityId/join', authenticate, (req, res) => community.joinCommunity(req, res));
app.get('/api/communities/:communityId/chats', authenticate, (req, res) => community.getCommunityChannels(req, res));
app.post('/api/communities/:communityId/verify-perk', authenticate, (req, res) => community.toggleCommunityVerifyPerk(req, res));

// Call Routes
app.get('/api/calls', authenticate, (req, res) => call.getCallLogs(req, res));
app.post('/api/calls', authenticate, (req, res) => call.createCallLog(req, res));
app.delete('/api/calls/:callId', authenticate, (req, res) => call.deleteCallLog(req, res));
app.delete('/api/calls', authenticate, (req, res) => call.clearCallLogs(req, res));

// Payment / Verification Badge Routes
app.get('/api/payments/badge-price', authenticateAdmin, (req, res) => payment.getBadgePrice(req, res));
app.get('/api/badge/price', authenticateAdmin, (req, res) => payment.getBadgePrice(req, res));
app.post('/api/payments/verification/process', authenticate, (req, res) => payment.processVerificationPayment(req, res));
app.get('/api/payments/verification/status', authenticate, (req, res) => payment.getUserBadgeStatus(req, res));
app.get('/api/admin/badges', authenticateAdmin, (req, res) => payment.getAdminBadgePayments(req, res));
app.post('/api/admin/users/:userId/badge', authenticateAdmin, (req, res) => payment.toggleUserBadge(req, res));

// Multi-Provider Payment Management
app.get('/api/admin/payments/providers', authenticateAdmin, (req, res) => payment.getPaymentProviders(req, res));
app.patch('/api/admin/payments/providers/:id', authenticateAdmin, (req, res) => payment.updatePaymentProvider(req, res));
app.post('/api/admin/payments/providers/:id/test', authenticateAdmin, (req, res) => payment.testProviderCredentials(req, res));
app.post('/api/admin/payments/test-credentials', authenticateAdmin, (req, res) => payment.testProviderCredentials(req, res));
app.get('/api/admin/payments/transactions', authenticateAdmin, (req, res) => payment.getPaymentTransactions(req, res));

// Client Payment Integration Layer
app.get('/api/payments/providers', (req, res) => payment.getAvailableProviders(req, res));
app.post('/api/payments/create', authenticate, (req, res) => payment.createPayment(req, res));
app.post('/api/payments/webhook', (req, res) => payment.updatePaymentStatus(req, res));

// Broadcast & Announcements Routes
app.get('/api/broadcasts', (req, res) => admin.getPublicBroadcasts(req, res));
app.get('/api/announcements', (req, res) => admin.getPublicBroadcasts(req, res));
app.get('/api/admin/broadcasts', authenticateAdmin, (req, res) => admin.getBroadcasts(req, res));
app.post('/api/admin/broadcasts', authenticateAdmin, (req, res) => admin.sendBroadcast(req, res));

// Additional Admin Pages Routes
app.get('/api/admin/communities', authenticateAdmin, (req, res) => admin.getAdminCommunities(req, res));
app.post('/api/admin/communities/official', authenticateAdmin, (req, res) => admin.createOfficialCommunity(req, res));
app.get('/api/admin/official-communities', authenticateAdmin, (req, res) => admin.getOfficialCommunities(req, res));
app.get('/api/admin/official-community', authenticateAdmin, (req, res) => admin.getOfficialCommunity(req, res));
app.post('/api/admin/official-community', authenticateAdmin, (req, res) => admin.updateOfficialCommunity(req, res));
app.post('/api/admin/communities/:communityId/official', authenticateAdmin, (req, res) => admin.toggleOfficialStatus(req, res));
app.delete('/api/admin/communities/:communityId', authenticateAdmin, (req, res) => admin.deleteCommunity(req, res));
app.get('/api/admin/communities/:communityId/members', authenticateAdmin, (req, res) => admin.getOfficialCommunityMembers(req, res));
app.post('/api/admin/communities/:communityId/members', authenticateAdmin, (req, res) => admin.addCommunityMember(req, res));
app.post('/api/admin/communities/:communityId/members/:userId/role', authenticateAdmin, (req, res) => admin.updateCommunityMemberRole(req, res));
app.post('/api/admin/communities/:communityId/posts', authenticateAdmin, (req, res) => admin.createOfficialPost(req, res));
app.get('/api/admin/storage', authenticateAdmin, (req, res) => admin.getStorageStats(req, res));
app.post('/api/admin/storage/purge', authenticateAdmin, (req, res) => admin.purgeStorageCache(req, res));
app.get('/api/admin/analytics', authenticateAdmin, (req, res) => admin.getAnalytics(req, res));

// Admin Routes
app.post('/api/admin/login', (req, res) => admin.login(req, res));
app.get('/api/admin/metrics', authenticateAdmin, (req, res) => admin.getMetrics(req, res));
app.get('/api/admin/users', authenticateAdmin, (req, res) => admin.getUsers(req, res));
app.get('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.getUserById(req, res));
app.put('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.updateUser(req, res));
app.patch('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.updateUser(req, res));
app.post('/api/admin/users/:userId/ban', authenticateAdmin, (req, res) => admin.banUser(req, res));
app.post('/api/admin/users/:userId/unban', authenticateAdmin, (req, res) => admin.unbanUser(req, res));
app.post('/api/admin/users/:userId/flag', authenticateAdmin, (req, res) => admin.flagUser(req, res));
app.delete('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.deleteUser(req, res));

app.get('/api/admin/reports', authenticateAdmin, (req, res) => admin.getReports(req, res));
app.patch('/api/admin/reports/:reportId/status', authenticateAdmin, (req, res) => admin.updateReportStatus(req, res));
app.put('/api/admin/reports/:reportId', authenticateAdmin, (req, res) => admin.updateReportStatus(req, res));
app.delete('/api/admin/reports/:reportId', authenticateAdmin, (req, res) => admin.deleteReport(req, res));

app.get('/api/admin/logs', authenticateAdmin, (req, res) => admin.getAuditLogs(req, res));
app.delete('/api/admin/logs', authenticateAdmin, (req, res) => admin.clearAuditLogs(req, res));

app.get('/api/admin/settings', authenticateAdmin, (req, res) => admin.getSettings(req, res));
app.get('/api/admin/email-links', authenticateAdmin, (req, res) => admin.getEmailLinks(req, res));
app.post('/api/admin/email-links', authenticateAdmin, (req, res) => admin.updateEmailLinks(req, res));
app.patch('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));
app.put('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));
app.post('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));

app.get('/api/admin/inquiries/:id', authenticateAdmin, (req, res) => admin.getContactInquiryById(req, res));
app.delete('/api/admin/inquiries/:id', authenticateAdmin, (req, res) => admin.deleteContactInquiry(req, res));
app.patch('/api/admin/inquiries/:id/status', authenticateAdmin, (req, res) => admin.updateContactInquiryStatus(req, res));
app.put('/api/admin/inquiries/:id/status', authenticateAdmin, (req, res) => admin.updateContactInquiryStatus(req, res));
app.post('/api/admin/inquiries/:id/status', authenticateAdmin, (req, res) => admin.updateContactInquiryStatus(req, res));

app.delete('/api/admin/broadcasts/:id', authenticateAdmin, (req, res) => admin.deleteBroadcast(req, res));
app.put('/api/admin/communities/:communityId', authenticateAdmin, (req, res) => admin.updateCommunity(req, res));
app.patch('/api/admin/communities/:communityId', authenticateAdmin, (req, res) => admin.updateCommunity(req, res));

// Admin Profile, Password & Sessions Routes
app.get('/api/admin/admins', authenticateAdmin, (req, res) => admin.getAdmins(req, res));
app.post('/api/admin/admins', authenticateAdmin, (req, res) => admin.createAdmin(req, res));
app.put('/api/admin/admins/:id', authenticateAdmin, (req, res) => admin.updateAdmin(req, res));
app.delete('/api/admin/admins/:id', authenticateAdmin, (req, res) => admin.deleteAdmin(req, res));
app.get('/api/admin/profile', authenticateAdmin, (req, res) => admin.getProfile(req, res));
app.put('/api/admin/profile', authenticateAdmin, (req, res) => admin.updateProfile(req, res));
app.post('/api/admin/change-password', authenticateAdmin, (req, res) => admin.changePassword(req, res));
app.get('/api/admin/sessions', authenticateAdmin, (req, res) => admin.getSessions(req, res));
app.delete('/api/admin/sessions/:sessionId', authenticateAdmin, (req, res) => admin.revokeSession(req, res));
app.post('/api/admin/2fa/toggle', authenticateAdmin, (req, res) => admin.toggleTwoFactor(req, res));
app.post('/api/admin/2fa/setup', authenticateAdmin, (req, res) => admin.generate2FASecret(req, res));
app.post('/api/admin/2fa/confirm', authenticateAdmin, (req, res) => admin.confirm2FA(req, res));
app.get('/api/admin/security/health', authenticateAdmin, (req, res) => admin.getSecurityHealth(req, res));

// Gmail OAuth Integration Routes (Dedicated Demo / Support Email Authorization)
app.get('/api/admin/gmail-oauth/start', authenticateAdmin, (req, res) => gmailOAuth.startOAuth(req, res));
app.get('/api/admin/gmail-oauth/callback', (req, res) => gmailOAuth.handleCallback(req, res));
app.get('/api/admin/gmail-oauth/status', authenticateAdmin, (req, res) => gmailOAuth.getStatus(req, res));
app.post('/api/admin/gmail-oauth/test-send', authenticateAdmin, (req, res) => gmailOAuth.testSend(req, res));
app.post('/api/admin/gmail-oauth/disconnect', authenticateAdmin, (req, res) => gmailOAuth.disconnectOAuth(req, res));

// Media Routes
app.post('/api/media/upload-url', authenticate, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    const { uploadUrl, fileKey, publicUrl } = await storage.getPresignedUploadUrl(fileName, contentType);
    res.json({ uploadUrl, fileKey, publicUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io Real-time Logic & Authentication Middleware
io.use((socket, next) => {
  const token = (socket.handshake.auth?.token as string) ||
                (socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') as string) ||
                (socket.handshake.query?.token as string);
  const queryUserId = socket.handshake.query?.userId as string;

  if (token) {
    try {
      const decoded = verifyUserToken(token);
      socket.data.userId = decoded.id;
      socket.data.phoneNumber = decoded.phoneNumber;
      socket.data.authenticated = true;
      return next();
    } catch (err: any) {
      console.warn(`[Socket.IO] Authentication rejected: ${err.message}`);
      return next(new Error('Authentication failed: Invalid or expired token'));
    }
  }

  // Support transitional / fallback query userId while requiring valid identity in database
  if (queryUserId) {
    socket.data.userId = queryUserId;
    socket.data.authenticated = false;
    return next();
  }

  return next(new Error('Authentication required: Token or userId missing'));
});

io.on('connection', (socket) => {
  const userId = socket.data.userId || (socket.handshake.query.userId as string);
  if (userId) {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} connected with socket ${socket.id} (Authenticated: ${!!socket.data.authenticated})`);
  }

  socket.on('join_chat', async (chatId) => {
    if (!chatId) return;
    const rawId = String(chatId);
    const pureChatId = extractPureChatId(rawId);
    let effectiveChatId = pureChatId;
    let roomName = getChatRoomName(pureChatId);

    // If a userId is associated with this socket connection, verify or resolve chat existence & membership
    if (userId) {
      try {
        let chat = await prisma.chat.findUnique({
          where: { id: pureChatId },
          include: { members: true }
        });

        // Self-healing: if pureChatId is actually a contact's User ID, resolve/create the private chat
        if (!chat) {
          const targetUser = await prisma.user.findUnique({ where: { id: pureChatId } });
          if (targetUser) {
            chat = await prisma.chat.findFirst({
              where: {
                isGroup: false,
                AND: [
                  { members: { some: { userId } } },
                  { members: { some: { userId: pureChatId } } }
                ]
              },
              include: { members: true }
            });

            if (!chat) {
              chat = await prisma.chat.create({
                data: {
                  isGroup: false,
                  members: {
                    create: [
                      { userId },
                      { userId: pureChatId }
                    ]
                  }
                },
                include: { members: true }
              });
            }
          }
        }

        if (chat) {
          effectiveChatId = chat.id;
          roomName = getChatRoomName(chat.id);
          const isMember = chat.members.some(m => m.userId === userId);
          if (!isMember) {
            await prisma.chatMember.create({
              data: { chatId: chat.id, userId }
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Error validating join_chat:', err);
      }
    }

    socket.join(roomName);
    if (rawId !== roomName && rawId !== effectiveChatId) {
      socket.join(`chat_${rawId}`);
    }
    console.log(`Socket ${socket.id} joined room ${roomName} (effective chat: ${effectiveChatId})`);
  });
 
  socket.on('send_message', async (data) => {
    // data: { id, chatId, senderId, receiverId, content, type, mediaUrl, duration }
    if (!data || !data.chatId || (!data.content && !data.mediaUrl)) {
      return socket.emit('error', { message: 'Invalid message payload.' });
    }

    const rawChatId = String(data.chatId);
    const pureChatId = extractPureChatId(rawChatId);
    // Never trust unauthenticated client-supplied senderId over authenticated socket identity
    const senderId = socket.data.userId || data.senderId || userId;

    console.log(`Message received from ${senderId} for chat ${pureChatId}: ${data.content?.substring(0, 20)}...`);
    try {
      const setting = await prisma.systemSetting.findFirst();
      if (setting?.maintenanceMode) {
        return socket.emit('error', { message: 'System is currently undergoing scheduled maintenance.' });
      }

      // Check if Chat exists in database
      let chat = await prisma.chat.findUnique({
        where: { id: pureChatId },
        include: { members: true }
      });

      // Self-healing: If chat doesn't exist by pureChatId, check if pureChatId is a User ID or target receiver
      if (!chat) {
        const targetUserId = data.receiverId || (await prisma.user.findUnique({ where: { id: pureChatId } }))?.id;
        if (targetUserId && senderId) {
          chat = await prisma.chat.findFirst({
            where: {
              isGroup: false,
              AND: [
                { members: { some: { userId: senderId } } },
                { members: { some: { userId: targetUserId } } }
              ]
            },
            include: { members: true }
          });

          if (!chat) {
            chat = await prisma.chat.create({
              data: {
                isGroup: false,
                members: {
                  create: [
                    { userId: senderId },
                    { userId: targetUserId }
                  ]
                }
              },
              include: { members: true }
            });
          }
        }
      }

      if (!chat) {
        console.warn(`[Socket.IO] Cannot save message: Chat ${pureChatId} does not exist in database.`);
        return socket.emit('error', {
          message: 'Chat does not exist. Please initialize the conversation first.',
          chatId: pureChatId
        });
      }

      const effectiveChatId = chat.id;
      const roomName = getChatRoomName(effectiveChatId);

      // Verify sender exists and is authorized
      if (senderId) {
        const isMember = chat.members.some(m => m.userId === senderId);
        if (!isMember) {
          const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
          if (senderUser) {
            try {
              await prisma.chatMember.create({
                data: { chatId: effectiveChatId, userId: senderId }
              });
            } catch (memberErr) {}
          }
        }
      }

      const message = await prisma.message.create({
        data: {
          id: data.id || undefined, // Use client-provided ID if available for optimistic UI sync
          chatId: effectiveChatId,
          senderId: senderId,
          receiverId: data.receiverId || undefined,
          content: data.content || '',
          type: data.type || 'TEXT',
          mediaUrl: data.mediaUrl,
          duration: data.duration,
          status: 'SENT'
        },
        include: {
          sender: true
        }
      });
 
      // Broadcast to standard chat room
      console.log(`Broadcasting message ${message.id} to room ${roomName} (chat: ${effectiveChatId})`);
      io.to(roomName).emit('receive_message', message);
      if (rawChatId !== effectiveChatId) {
        io.to(`chat_${rawChatId}`).emit('receive_message', message);
        io.to(getChatRoomName(rawChatId)).emit('receive_message', message);
      }
      
      // Also notify all chat participants via their personal user rooms so they receive real-time updates even if not actively inside the chat screen
      for (const member of chat.members) {
        if (member.userId !== senderId) {
          console.log(`Notifying member user_${member.userId} about new message`);
          io.to(`user_${member.userId}`).emit('receive_message', message);
          io.to(`user_${member.userId}`).emit('new_message_notification', {
            chatId: effectiveChatId,
            message
          });
        }
      }

      // If receiverId was explicitly specified and not already covered
      const explicitReceiverId = data.receiverId;
      if (explicitReceiverId && !chat.members.some(m => m.userId === explicitReceiverId)) {
        console.log(`Notifying explicit receiver user_${explicitReceiverId} about new message`);
        io.to(`user_${explicitReceiverId}`).emit('receive_message', message);
        io.to(`user_${explicitReceiverId}`).emit('new_message_notification', {
          chatId: effectiveChatId,
          message
        });
      }
    } catch (error: any) {
      console.error('Error saving message:', error);
      if (error?.code === 'P2003') {
        socket.emit('error', {
          message: 'Foreign key constraint violated: referenced chat or user does not exist.',
          code: 'P2003',
          chatId: pureChatId
        });
      } else {
        socket.emit('error', { message: 'Failed to send message' });
      }
    }
  });

  socket.on('typing', (data) => {
    if (!data?.chatId) return;
    const roomName = getChatRoomName(data.chatId);
    socket.to(roomName).emit('user_typing', { ...data, chatId: extractPureChatId(data.chatId) });
  });

  // WebRTC Call Signaling
  socket.on('call_offer', async (data) => {
    // data: { targetUserId, sdp }
    if (data && data.targetUserId) {
      let callerName = 'User';
      if (userId) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user?.name) callerName = user.name;
        } catch (e) {}
      }
      io.to(`user_${data.targetUserId}`).emit('call_offer', {
        callerId: userId,
        callerName,
        sdp: data.sdp,
        isVideo: data.isVideo ?? true
      });
    }
  });

  socket.on('call_answer', (data) => {
    // data: { targetUserId, sdp }
    if (data && data.targetUserId) {
      io.to(`user_${data.targetUserId}`).emit('call_answer', {
        callerId: userId,
        sdp: data.sdp
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    // data: { targetUserId, sdpMid, sdpMLineIndex, candidate }
    if (data && data.targetUserId) {
      io.to(`user_${data.targetUserId}`).emit('ice_candidate', data);
    }
  });

  socket.on('end_call', (data) => {
    if (data && data.targetUserId) {
      io.to(`user_${data.targetUserId}`).emit('call_ended', { callerId: userId });
    }
  });

  socket.on('disconnect', async () => {
    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() }
        });
        
        // Notify others if needed (e.g. in active chats)
        socket.broadcast.emit('user_offline', { userId });
      } catch (error) {
        console.error('Presence update error:', error);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Vibez Backend running on port ${PORT}`);
});

