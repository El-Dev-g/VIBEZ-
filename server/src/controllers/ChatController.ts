import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class ChatController {
  async getChats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const chats = await prisma.chat.findMany({
        where: {
          members: {
            some: { userId }
          }
        },
        include: {
          members: {
            include: {
              user: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  }

  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: true
        }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  async createOrGetPrivateChat(req: AuthRequest, res: Response) {
    try {
      const { targetUserId } = req.body;
      const currentUserId = req.user?.id as string;

      // Find existing private chat
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: targetUserId } } }
          ]
        }
      });

      if (existingChat) {
        return res.json(existingChat);
      }

      // Create new chat
      const newChat = await prisma.chat.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: currentUserId },
              { userId: targetUserId }
            ]
          }
        }
      });

      res.json(newChat);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create chat' });
    }
  }

  async createGroupChat(req: AuthRequest, res: Response) {
    try {
      const { name, memberIds, avatarUrl } = req.body;
      const currentUserId = req.user?.id as string;
      const allMembers = Array.from(new Set([currentUserId, ...(memberIds || [])]));

      const newGroup = await prisma.chat.create({
        data: {
          isGroup: true,
          name: name || 'New Group',
          avatarUrl: avatarUrl || null,
          members: {
            create: allMembers.map(uid => ({ userId: uid }))
          }
        },
        include: {
          members: {
            include: { user: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      res.json(newGroup);
    } catch (error) {
      console.error('Failed to create group chat:', error);
      res.status(500).json({ error: 'Failed to create group chat' });
    }
  }

  async deleteChat(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const currentUserId = req.user?.id as string;

      // Verify the user is a member of this chat
      const member = await prisma.chatMember.findFirst({
        where: { chatId, userId: currentUserId }
      });

      if (!member) {
        return res.status(404).json({ error: 'Chat not found or access denied' });
      }

      // Check if it's a private 1-on-1 chat or group
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true }
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Delete the messages, members, and chat
      await prisma.message.deleteMany({ where: { chatId } });
      await prisma.chatMember.deleteMany({ where: { chatId } });
      await prisma.chat.delete({ where: { id: chatId } });

      res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  }

  async updateChat(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const { name, avatarUrl } = req.body;

      const updated = await prisma.chat.update({
        where: { id: chatId },
        data: {
          ...(name !== undefined && { name }),
          ...(avatarUrl !== undefined && { avatarUrl })
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Failed to update chat:', error);
      res.status(500).json({ error: 'Failed to update chat' });
    }
  }
}

