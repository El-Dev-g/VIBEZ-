import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  async phoneLogin(req: Request, res: Response) {
    try {
      const { phoneNumber, name, about, avatarUrl, firebaseIdToken } = req.body;
      const cleanPhone = (phoneNumber || '').trim();

      if (!cleanPhone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      let user = await prisma.user.findFirst({
        where: { phoneNumber: cleanPhone }
      });

      if (!user) {
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        const initialName = (name && typeof name === 'string' && name.trim().length > 0 && name.trim() !== cleanPhone)
          ? name.trim()
          : cleanPhone;

        user = await prisma.user.create({
          data: {
            phoneNumber: cleanPhone,
            name: initialName,
            about: about?.trim() || 'Hey there! I am using VIBEZ.',
            avatarUrl: avatarUrl || null,
            authProvider: 'PHONE',
            googleEmail: null
          }
        });
      } else {
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        // Preserve existing user name if client provides empty string, phone number, or placeholder
        let updatedName = user.name;
        if (name && typeof name === 'string') {
          const trimmed = name.trim();
          const isDefaultOrEmpty = !trimmed || trimmed === 'User' || trimmed === 'New User' || trimmed === cleanPhone || trimmed === user.phoneNumber;
          const hasValidExistingName = user.name && user.name.trim().length > 0 && user.name !== 'User' && user.name !== 'New User' && user.name !== user.phoneNumber;

          if (!isDefaultOrEmpty) {
            updatedName = trimmed;
          } else if (hasValidExistingName) {
            updatedName = user.name;
          }
        }

        // Preserve existing about if client sends default placeholder and user already had customized about
        let updatedAbout = user.about;
        if (about && typeof about === 'string') {
          const trimmedAbout = about.trim();
          if (trimmedAbout.length > 0) {
            if (user.about && user.about !== 'Hey there! I am using VIBEZ.' && trimmedAbout === 'Hey there! I am using VIBEZ.') {
              updatedAbout = user.about;
            } else {
              updatedAbout = trimmedAbout;
            }
          }
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastSeen: new Date(),
            name: updatedName,
            about: updatedAbout || 'Hey there! I am using VIBEZ.',
            avatarUrl: avatarUrl || user.avatarUrl
          }
        });
      }

      const token = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber, firebaseVerified: !!firebaseIdToken },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({ user, token });
    } catch (error) {
      console.error('Phone login error:', error);
      res.status(500).json({ error: 'Phone authentication failed' });
    }
  }

  async googleLogin(req: AuthRequest, res: Response) {
    try {
      const { email, name, avatarUrl, phoneNumber, idToken } = req.body;

      let verifiedEmail = email?.trim();
      let verifiedName = name?.trim();
      let verifiedAvatar = avatarUrl;
      const cleanPhone = (phoneNumber || '').trim();

      // If email is dummy or user@vibez.app and phone is provided, redirect to phone auth flow
      if ((!verifiedEmail || verifiedEmail.endsWith('@vibez.app')) && cleanPhone) {
        return this.phoneLogin(req, res);
      }

      // Verify the idToken if provided
      if (idToken) {
        try {
          const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (payload) {
            verifiedEmail = payload.email || email;
            verifiedName = payload.name || name;
            verifiedAvatar = payload.picture || avatarUrl;
          }
        } catch (verificationError) {
          console.error('ID Token verification failed:', verificationError);
          return res.status(401).json({ error: 'Invalid Google ID Token' });
        }
      } else if (process.env.NODE_ENV === 'production' && !cleanPhone) {
        return res.status(400).json({ error: 'ID Token is required in production' });
      }

      if (!verifiedEmail && !cleanPhone) {
        return res.status(400).json({ error: 'Email or phone number is required' });
      }

      let user = null;

      // 1. Search by verified Google email if present
      if (verifiedEmail) {
        user = await prisma.user.findFirst({
          where: { googleEmail: verifiedEmail }
        });
      }

      // 2. If not found by email but phone provided, search by phone number
      if (!user && cleanPhone) {
        user = await prisma.user.findFirst({
          where: { phoneNumber: cleanPhone }
        });
      }

      if (!user) {
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        const finalPhone = cleanPhone && cleanPhone.length > 0
          ? cleanPhone
          : `g_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

        user = await prisma.user.create({
          data: {
            googleEmail: verifiedEmail || null,
            name: verifiedName || 'New User',
            avatarUrl: verifiedAvatar,
            phoneNumber: finalPhone,
            authProvider: verifiedEmail ? 'GOOGLE' : 'PHONE'
          }
        });
      } else {
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        const updateData: any = {
          lastSeen: new Date(),
          avatarUrl: verifiedAvatar || user.avatarUrl
        };

        const trimmedVerifiedName = verifiedName ? verifiedName.trim() : '';
        const isDefaultOrEmpty = !trimmedVerifiedName || trimmedVerifiedName === 'User' || trimmedVerifiedName === 'New User' || trimmedVerifiedName === cleanPhone || trimmedVerifiedName === user.phoneNumber;
        const hasValidExistingName = user.name && user.name.trim().length > 0 && user.name !== 'User' && user.name !== 'New User' && user.name !== user.phoneNumber;

        if (!isDefaultOrEmpty) {
          updateData.name = trimmedVerifiedName;
        } else if (hasValidExistingName) {
          updateData.name = user.name;
        } else {
          updateData.name = user.name || 'New User';
        }

        if (verifiedEmail) {
          updateData.googleEmail = verifiedEmail;
          updateData.authProvider = 'GOOGLE';
        }
        if (cleanPhone) {
          updateData.phoneNumber = cleanPhone;
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }

      const token = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({ user, token });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id }
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
}
