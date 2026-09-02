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
import { checkMaintenanceMode } from './middleware/maintenance';
import { securityHeaders, sanitizeInputs, checkSecretEntropy } from './middleware/security';
import { authRateLimiter, adminRateLimiter } from './middleware/rateLimiter';

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
app.get('/api/developer/auth/me', (req, res) => developer.getDeveloperProfile(req, res));
app.get('/api/developer/keys', (req, res) => developer.getDeveloperProfile(req, res));
app.post('/api/developer/keys', (req, res) => developer.createApiKey(req, res));
app.delete('/api/developer/keys/:id', (req, res) => developer.revokeApiKey(req, res));
app.delete('/api/developer/keys', (req, res) => developer.revokeApiKey(req, res));
app.post('/api/developer/webhooks/verify', (req, res) => developer.verifyWebhook(req, res));
app.post('/api/developer/messages/send', (req, res) => developer.dispatchServerMessage(req, res, io));
app.post('/api/developer/rtc/token', (req, res) => developer.generateRtcToken(req, res));
app.post('/api/developer/oauth/token', (req, res) => developer.issueOAuthToken(req, res));

// Direct Developer Bridge Routes
app.get('/api/developer/server/health-check', (req, res) => developer.getDeveloperHealth(req, res));
app.post('/api/developer/server/health-check', (req, res) => developer.getDeveloperHealth(req, res));
app.post('/api/developer/server/dispatch-message', (req, res) => developer.dispatchServerMessage(req, res, io));
app.post('/api/developer/server/issue-oauth-token', (req, res) => developer.issueOAuthToken(req, res));
app.post('/api/developer/server/rtc-token', (req, res) => developer.generateRtcToken(req, res));
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
app.put('/api/users/profile', authenticate, (req, res) => user.updateProfile(req, res));
app.post('/api/users/change-phone/request', authenticate, (req, res) => user.requestPhoneChange(req, res));
app.post('/api/users/change-phone/verify', authenticate, (req, res) => user.verifyPhoneChange(req, res));
app.get('/api/users/settings', authenticate, (req, res) => user.getSettings(req, res));
app.put('/api/users/settings', authenticate, (req, res) => user.updateSettings(req, res));
app.post('/api/users/report', authenticate, (req, res) => user.reportUser(req, res));

// Chat Routes
app.get('/api/chats', authenticate, (req, res) => chat.getChats(req, res));
app.get('/api/chats/:chatId/messages', authenticate, (req, res) => chat.getMessages(req, res));
app.post('/api/chats/private', authenticate, (req, res) => chat.createOrGetPrivateChat(req, res));
app.post('/api/chats/group', authenticate, (req, res) => chat.createGroupChat(req, res));
app.delete('/api/chats/:chatId', authenticate, (req, res) => chat.deleteChat(req, res));
app.patch('/api/chats/:chatId', authenticate, (req, res) => chat.updateChat(req, res));

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

// Socket.io Real-time Logic
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined room chat_${chatId}`);
  });
 
  socket.on('send_message', async (data) => {
    // data: { id, chatId, senderId, receiverId, content, type, mediaUrl, duration }
    console.log(`Message received from ${data.senderId} for chat ${data.chatId}: ${data.content?.substring(0, 20)}...`);
    try {
      const setting = await prisma.systemSetting.findFirst();
      if (setting?.maintenanceMode) {
        return socket.emit('error', { message: 'System is currently undergoing scheduled maintenance.' });
      }
 
      const message = await prisma.message.create({
        data: {
          id: data.id || undefined, // Use client-provided ID if available for optimistic UI sync
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type || 'TEXT',
          mediaUrl: data.mediaUrl,
          duration: data.duration,
          status: 'SENT'
        },
        include: {
          sender: true
        }
      });
 
      // Broadcast to chat room
      console.log(`Broadcasting message ${message.id} to room chat_${data.chatId}`);
      io.to(`chat_${data.chatId}`).emit('receive_message', message);
      
      // Also notify receiver if it's a private chat for badge updates
      if (data.receiverId) {
        console.log(`Notifying receiver user_${data.receiverId} about new message`);
        io.to(`user_${data.receiverId}`).emit('new_message_notification', {
          chatId: data.chatId,
          message
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', data);
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
        sdp: data.sdp
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

