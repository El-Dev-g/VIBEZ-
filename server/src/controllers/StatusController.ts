import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class StatusController {
  async getStatuses(req: AuthRequest, res: Response) {
    try {
      const statuses = await prisma.status.findMany({
        where: {
          expiresAt: { gt: new Date() }
        },
        include: {
          user: true,
          views: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      res.status(500).json({ error: 'Failed to fetch statuses' });
    }
  }

  async createStatus(req: AuthRequest, res: Response) {
    try {
      const { mediaUrl, content, type, backgroundColor, textStyle } = req.body;
      const userId = req.user?.id as string;

      const status = await prisma.status.create({
        data: {
          userId,
          mediaUrl,
          content,
          type: type || 'IMAGE',
          backgroundColor,
          textStyle,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      res.json(status);
    } catch (error) {
      console.error('Error creating status:', error);
      res.status(500).json({ error: 'Failed to create status' });
    }
  }

  async deleteStatus(req: AuthRequest, res: Response) {
    try {
      const { statusId } = req.params;
      const userId = req.user?.id as string;

      await prisma.statusView.deleteMany({
        where: { statusId }
      });

      await prisma.status.deleteMany({
        where: { id: statusId, userId }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting status:', error);
      res.status(500).json({ error: 'Failed to delete status' });
    }
  }

  async viewStatus(req: AuthRequest, res: Response) {
    try {
      const { statusId } = req.params;
      const userId = req.user?.id as string;

      await prisma.statusView.upsert({
        where: {
          userId_statusId: {
            userId,
            statusId
          }
        },
        update: { viewedAt: new Date() },
        create: {
          statusId,
          userId
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error recording view:', error);
      res.status(500).json({ error: 'Failed to record view' });
    }
  }

  async getPrivacy(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const settings = await prisma.userSettings.findUnique({
        where: { userId }
      });
      res.json({
        mode: settings?.statusPrivacyMode || 'MY_CONTACTS',
        excludedUserIds: settings?.excludedStatusUserIds || [],
        includedUserIds: settings?.includedStatusUserIds || []
      });
    } catch (error) {
      console.error('Error fetching privacy:', error);
      res.status(500).json({ error: 'Failed to fetch privacy settings' });
    }
  }

  async updatePrivacy(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { mode, excludedUserIds, includedUserIds } = req.body;

      await prisma.userSettings.upsert({
        where: { userId },
        update: {
          statusPrivacyMode: mode,
          excludedStatusUserIds: excludedUserIds,
          includedStatusUserIds: includedUserIds
        },
        create: {
          userId,
          statusPrivacyMode: mode,
          excludedStatusUserIds: excludedUserIds,
          includedStatusUserIds: includedUserIds
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating privacy:', error);
      res.status(500).json({ error: 'Failed to update privacy settings' });
    }
  }
}
