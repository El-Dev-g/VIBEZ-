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
          community: true,
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
      const mappedChats = chats.map(chat => {
        const isCommunityOfficial = chat.community?.isOfficial || false;
        return {
          ...chat,
          isOfficial: isCommunityOfficial || (chat as any).isOfficial || false,
          isVerified: isCommunityOfficial || (chat as any).isVerified || false
        };
      });
      res.json(mappedChats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  }

  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const currentUserId = req.user?.id as string;
      if (!chatId) return res.status(400).json({ error: 'Chat ID required' });

      const cleanId = chatId.startsWith('chat_') ? chatId.replace(/^chat_+/, '') : chatId;

      // Try finding by direct chat ID first
      let chat = await prisma.chat.findUnique({ where: { id: cleanId } });

      // If not found, check if cleanId is a target User ID and find the private 1-on-1 chat
      if (!chat && currentUserId) {
        const targetUser = await prisma.user.findUnique({ where: { id: cleanId } });
        if (targetUser) {
          chat = await prisma.chat.findFirst({
            where: {
              isGroup: false,
              AND: [
                { members: { some: { userId: currentUserId } } },
                { members: { some: { userId: cleanId } } }
              ]
            }
          });
        }
      }

      const effectiveChatId = chat ? chat.id : cleanId;

      const messages = await prisma.message.findMany({
        where: { chatId: effectiveChatId },
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
      const currentUserId = req.user?.id as string;

      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required' });
      }

      // First verify chat existence
      const existing = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Verify user membership or admin status
      const isMember = existing.members.some(m => m.userId === currentUserId);
      if (!isMember && !req.user?.isAdmin) {
        return res.status(403).json({ error: 'Access denied: not a member of this chat' });
      }

      const updated = await prisma.chat.update({
        where: { id: chatId },
        data: {
          ...(name !== undefined && { name }),
          ...(avatarUrl !== undefined && { avatarUrl })
        }
      });

      res.json(updated);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Chat not found' });
      }
      console.error('Failed to update chat:', error);
      res.status(500).json({ error: 'Failed to update chat' });
    }
  }

  async toggleGroupVerifyPerk(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id as string;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.isVerified) {
        return res.status(403).json({ error: 'Green Verification Badge required to verify group chats.' });
      }

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true }
      });

      if (!chat || !chat.isGroup) {
        return res.status(404).json({ error: 'Group chat not found' });
      }

      const isMember = chat.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: 'You must be a member of this group chat.' });
      }

      const newStatus = !((chat as any).isVerified || (chat as any).isOfficial);

      if (newStatus) {
        const existingGroup = await prisma.chat.findFirst({
          where: {
            isGroup: true,
            isVerified: true,
            id: { not: chatId },
            members: { some: { userId } }
          }
        });
        if (existingGroup) {
          return res.status(400).json({ error: `Verified subscribers can verify up to 1 official group. Unverify "${existingGroup.name || 'Group'}" first.` });
        }
      }

      const updated = await prisma.chat.update({
        where: { id: chatId },
        data: {
          isVerified: newStatus,
          isOfficial: newStatus
        },
        include: {
          members: { include: { user: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });

      res.json({
        ...updated,
        isOfficial: newStatus,
        isVerified: newStatus
      });
    } catch (error) {
      console.error('Error toggling group verify perk:', error);
      res.status(500).json({ error: 'Failed to update group verification badge' });
    }
  }
}

