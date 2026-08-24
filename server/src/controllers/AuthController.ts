import { Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  async googleLogin(req: AuthRequest, res: Response) {
    try {
      const { email, name, avatarUrl, phoneNumber, idToken } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // In a real app, we would verify the idToken with Google
      // For this implementation, we trust the client (simplified)
      
      let user = await prisma.user.findFirst({
        where: { 
          OR: [
            { googleEmail: email },
            { phoneNumber: phoneNumber }
          ]
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            googleEmail: email,
            name: name || 'New User',
            avatarUrl,
            phoneNumber: phoneNumber || '',
            authProvider: 'GOOGLE'
          }
        });
      } else {
        // Update user if they were previously a phone user but now linked Google
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleEmail: email,
            authProvider: 'GOOGLE',
            avatarUrl: avatarUrl || user.avatarUrl
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
