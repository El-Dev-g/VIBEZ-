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
}
