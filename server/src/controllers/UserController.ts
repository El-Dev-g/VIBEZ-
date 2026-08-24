import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  async searchUsers(req: AuthRequest, res: Response) {
    try {
      const { query } = req.query;
      const currentUserId = req.user?.id;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } },
            {
              OR: [
                { phoneNumber: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        take: 20
      });

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, about, avatarUrl } = req.body;
      const userId = req.user?.id as string;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name, about, avatarUrl }
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  }

  async getSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      let settings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId }
        });
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { 
        statusPrivacyMode, 
        lastSeenPrivacy, 
        profilePhotoPrivacy, 
        aboutPrivacy, 
        readReceipts, 
        notificationsEnabled 
      } = req.body;

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          statusPrivacyMode,
          lastSeenPrivacy,
          profilePhotoPrivacy,
          aboutPrivacy,
          readReceipts,
          notificationsEnabled
        },
        create: {
          userId,
          statusPrivacyMode,
          lastSeenPrivacy,
          profilePhotoPrivacy,
          aboutPrivacy,
          readReceipts,
          notificationsEnabled
        }
      });

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}
