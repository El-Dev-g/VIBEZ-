import { Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  async googleLogin(req: AuthRequest, res: Response) {
    try {
      const { email, name, avatarUrl, phoneNumber, idToken } = req.body;

      let verifiedEmail = email;
      let verifiedName = name;
      let verifiedAvatar = avatarUrl;

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
      } else if (process.env.NODE_ENV === 'production') {
        // In production, force ID Token verification
        return res.status(400).json({ error: 'ID Token is required in production' });
      }

      if (!verifiedEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      let user = await prisma.user.findFirst({
        where: { 
          OR: [
            { googleEmail: verifiedEmail },
            { phoneNumber: phoneNumber || '' }
          ]
        }
      });

      if (!user) {
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        user = await prisma.user.create({
          data: {
            googleEmail: verifiedEmail,
            name: verifiedName || 'New User',
            avatarUrl: verifiedAvatar,
            phoneNumber: phoneNumber || '',
            authProvider: 'GOOGLE'
          }
        });
      } else {
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleEmail: verifiedEmail,
            authProvider: 'GOOGLE',
            avatarUrl: verifiedAvatar || user.avatarUrl,
            name: verifiedName || user.name
          }
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
