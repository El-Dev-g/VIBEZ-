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
import { authenticate } from './middleware/auth';

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

const storage = new StorageController();
const auth = new AuthController();
const chat = new ChatController();
const user = new UserController();
const status = new StatusController();
const community = new CommunityController();
const call = new CallController();
const admin = new AdminController();

// Auth Routes
app.post('/api/auth/google', (req, res) => auth.googleLogin(req, res));
app.get('/api/auth/profile', authenticate, (req, res) => auth.getProfile(req, res));

// User Routes
app.get('/api/users/search', authenticate, (req, res) => user.searchUsers(req, res));
app.put('/api/users/profile', authenticate, (req, res) => user.updateProfile(req, res));
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
app.get('/api/communities/:communityId/chats', authenticate, (req, res) => community.getCommunityChannels(req, res));

// Call Routes
app.get('/api/calls', authenticate, (req, res) => call.getCallLogs(req, res));
app.post('/api/calls', authenticate, (req, res) => call.createCallLog(req, res));
app.delete('/api/calls/:callId', authenticate, (req, res) => call.deleteCallLog(req, res));
app.delete('/api/calls', authenticate, (req, res) => call.clearCallLogs(req, res));

// Admin Routes
app.post('/api/admin/login', (req, res) => admin.login(req, res));
app.get('/api/admin/metrics', (req, res) => admin.getMetrics(req, res));
app.get('/api/admin/users', (req, res) => admin.getUsers(req, res));
app.get('/api/admin/reports', (req, res) => admin.getReports(req, res));
app.get('/api/admin/logs', (req, res) => admin.getAuditLogs(req, res));
app.get('/api/admin/settings', (req, res) => admin.getSettings(req, res));
app.patch('/api/admin/settings', (req, res) => admin.updateSettings(req, res));
app.post('/api/admin/users/:userId/ban', (req, res) => admin.banUser(req, res));

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

