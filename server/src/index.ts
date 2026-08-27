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
import { authenticate, authenticateAdmin } from './middleware/auth';
import { checkMaintenanceMode } from './middleware/maintenance';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Maintenance Mode Enforcement Middleware for all /api requests
app.use('/api', checkMaintenanceMode);

// Public System Status & App Config Routes
app.get('/api/system/status', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findFirst();
    res.json({
      status: setting?.maintenanceMode ? 'maintenance' : 'online',
      maintenanceMode: setting?.maintenanceMode || false,
      allowNewRegistrations: setting?.allowNewRegistrations ?? true,
      badgePrice: setting?.verificationBadgePrice ?? 3.00,
      appDownloadUrl: setting?.appDownloadUrl || '',
      appVersion: setting?.appVersion || '1.0.0',
      appName: setting?.appName || 'VIBEZ'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', maintenanceMode: false });
  }
});
app.get('/api/config/public', (req, res) => admin.getPublicAppConfig(req, res));
app.get('/api/app/download-info', (req, res) => admin.getPublicAppConfig(req, res));
app.post('/api/contact', (req, res) => admin.submitContactInquiry(req, res));
app.get('/api/admin/inquiries', authenticateAdmin, (req, res) => admin.getContactInquiries(req, res));

const storage = new StorageController();
const auth = new AuthController();
const chat = new ChatController();
const user = new UserController();
const status = new StatusController();
const community = new CommunityController();
const call = new CallController();
const admin = new AdminController();
const payment = new PaymentController();

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

// Chat Routes
app.get('/api/chats', authenticate, (req, res) => chat.getChats(req, res));
app.get('/api/chats/:chatId/messages', authenticate, (req, res) => chat.getMessages(req, res));
app.post('/api/chats/private', authenticate, (req, res) => chat.createOrGetPrivateChat(req, res));

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
app.get('/api/payments/badge-price', (req, res) => payment.getBadgePrice(req, res));
app.get('/api/badge/price', (req, res) => payment.getBadgePrice(req, res));
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
app.post('/api/admin/communities/:communityId/posts', authenticateAdmin, (req, res) => admin.createOfficialPost(req, res));
app.get('/api/admin/storage', authenticateAdmin, (req, res) => admin.getStorageStats(req, res));
app.post('/api/admin/storage/purge', authenticateAdmin, (req, res) => admin.purgeStorageCache(req, res));
app.get('/api/admin/analytics', authenticateAdmin, (req, res) => admin.getAnalytics(req, res));

// Admin Routes
app.post('/api/admin/login', (req, res) => admin.login(req, res));
app.get('/api/admin/metrics', authenticateAdmin, (req, res) => admin.getMetrics(req, res));
app.get('/api/admin/users', authenticateAdmin, (req, res) => admin.getUsers(req, res));
app.get('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.getUserById(req, res));
app.get('/api/admin/reports', authenticateAdmin, (req, res) => admin.getReports(req, res));
app.get('/api/admin/logs', authenticateAdmin, (req, res) => admin.getAuditLogs(req, res));
app.get('/api/admin/settings', authenticateAdmin, (req, res) => admin.getSettings(req, res));
app.patch('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));
app.put('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));
app.post('/api/admin/settings', authenticateAdmin, (req, res) => admin.updateSettings(req, res));
app.post('/api/admin/users/:userId/ban', authenticateAdmin, (req, res) => admin.banUser(req, res));
app.post('/api/admin/users/:userId/unban', authenticateAdmin, (req, res) => admin.unbanUser(req, res));
app.delete('/api/admin/users/:userId', authenticateAdmin, (req, res) => admin.deleteUser(req, res));

// Admin Profile, Password & Sessions Routes
app.get('/api/admin/profile', authenticateAdmin, (req, res) => admin.getProfile(req, res));
app.put('/api/admin/profile', authenticateAdmin, (req, res) => admin.updateProfile(req, res));
app.post('/api/admin/change-password', authenticateAdmin, (req, res) => admin.changePassword(req, res));
app.get('/api/admin/sessions', authenticateAdmin, (req, res) => admin.getSessions(req, res));
app.delete('/api/admin/sessions/:sessionId', authenticateAdmin, (req, res) => admin.revokeSession(req, res));

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
  });

  socket.on('send_message', async (data) => {
    // data: { chatId, senderId, receiverId, content, type, mediaUrl, duration }
    try {
      const setting = await prisma.systemSetting.findFirst();
      if (setting?.maintenanceMode) {
        return socket.emit('error', { message: 'System is currently undergoing scheduled maintenance.' });
      }

      const message = await prisma.message.create({
        data: {
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
      io.to(`chat_${data.chatId}`).emit('receive_message', message);
      
      // Also notify receiver if it's a private chat for badge updates
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit('new_message_notification', {
          chatId: data.chatId,
          message
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', data);
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

