import { Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

interface PhoneChangeRequestItem {
  userId: string;
  currentPhone: string;
  newPhone: string;
  verificationCode: string;
  expiresAt: number;
}

const pendingPhoneChanges = new Map<string, PhoneChangeRequestItem>();

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
      const { about, avatarUrl } = req.body;
      const userId = req.user?.id as string;

      // Notice: Name and PhoneNumber are immutable through basic profile edit.
      // Phone number must be changed via dedicated verification request flow.
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          about: about !== undefined ? about : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined
        }
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  }

  async requestPhoneChange(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { currentPhone, newPhone } = req.body;

      if (!currentPhone || !newPhone) {
        return res.status(400).json({ error: 'Current and new phone numbers are required' });
      }

      const cleanCurrentPhone = currentPhone.trim();
      const cleanNewPhone = newPhone.trim();

      if (cleanCurrentPhone === cleanNewPhone) {
        return res.status(400).json({ error: 'New phone number must be different from current phone number' });
      }

      // 1. Verify that current user's actual phone number matches currentPhone
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.phoneNumber !== cleanCurrentPhone) {
        return res.status(400).json({ error: 'Current phone number does not match your registered identity' });
      }

      // 2. Check if new phone is already registered to another user
      const existingNewUser = await prisma.user.findUnique({
        where: { phoneNumber: cleanNewPhone }
      });

      if (existingNewUser && existingNewUser.id !== userId) {
        return res.status(409).json({ error: 'This new phone number is already registered to another VIBEZ account' });
      }

      // 3. Generate 6-digit verification security code & request ID
      const requestId = `pcr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      pendingPhoneChanges.set(requestId, {
        userId,
        currentPhone: cleanCurrentPhone,
        newPhone: cleanNewPhone,
        verificationCode,
        expiresAt
      });

      // Cleanup expired requests periodically
      for (const [key, item] of pendingPhoneChanges.entries()) {
        if (item.expiresAt < Date.now()) {
          pendingPhoneChanges.delete(key);
        }
      }

      res.json({
        success: true,
        requestId,
        newPhone: cleanNewPhone,
        message: 'Security challenge generated. Verify your code to complete number transfer.',
        verificationCode, // Provided for user verification flow
        expiresInSeconds: 600
      });
    } catch (error) {
      console.error('Request phone change error:', error);
      res.status(500).json({ error: 'Failed to initiate phone number change request' });
    }
  }

  async verifyPhoneChange(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { requestId, verificationCode } = req.body;

      if (!requestId || !verificationCode) {
        return res.status(400).json({ error: 'Request ID and verification code are required' });
      }

      const pending = pendingPhoneChanges.get(requestId);
      if (!pending) {
        return res.status(404).json({ error: 'Phone change request not found or has expired. Please initiate a new request.' });
      }

      if (pending.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized request verification' });
      }

      if (pending.expiresAt < Date.now()) {
        pendingPhoneChanges.delete(requestId);
        return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      }

      if (pending.verificationCode !== verificationCode.trim()) {
        return res.status(400).json({ error: 'Invalid 6-digit verification code' });
      }

      // Re-verify that newPhone is not already taken
      const existing = await prisma.user.findUnique({
        where: { phoneNumber: pending.newPhone }
      });
      if (existing && existing.id !== userId) {
        pendingPhoneChanges.delete(requestId);
        return res.status(409).json({ error: 'New phone number was claimed by another account in the meantime' });
      }

      // Update phone number in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: pending.newPhone,
          lastSeen: new Date()
        }
      });

      // Generate refreshed JWT token with updated phone number
      const token = jwt.sign(
        { id: updatedUser.id, phoneNumber: updatedUser.phoneNumber },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      pendingPhoneChanges.delete(requestId);

      res.json({
        success: true,
        user: updatedUser,
        token,
        message: 'Phone number updated successfully across the VIBEZ network'
      });
    } catch (error) {
      console.error('Verify phone change error:', error);
      res.status(500).json({ error: 'Failed to verify and update phone number' });
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

  async reportUser(req: AuthRequest, res: Response) {
    try {
      const reporterId = req.user?.id as string;
      const { reportedUserId, reason } = req.body;

      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: 'Reported user ID and reason are required.' });
      }

      const report = await prisma.report.create({
        data: {
          reporterId,
          reportedUserId,
          reason: String(reason).trim(),
          status: 'PENDING'
        }
      });

      res.json({ success: true, report });
    } catch (error) {
      console.error('Failed to create user report:', error);
      res.status(500).json({ error: 'Failed to file user report' });
    }
  }
}
