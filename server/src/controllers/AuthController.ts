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
      
      // 1. Normalize the incoming phone number consistently before database lookup.
      const cleanPhone = (phoneNumber || '').trim().replace(/[^\d+]/g, '');

      if (!cleanPhone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // 2. Look up the existing "User" by the normalized unique "phoneNumber"
      let user = await prisma.user.findFirst({
        where: { phoneNumber: cleanPhone }
      });

      let isNew = false;

      if (!user) {
        // 12. Preserve "allowNewRegistrations"
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        isNew = true;

        // 6. For a genuinely new account only:
        // - Create the User.
        // - Use the supplied valid name if available.
        // - Otherwise use the existing new-user fallback.
        const trimmedName = (name && typeof name === 'string') ? name.trim() : '';
        const isDefaultOrEmpty = !trimmedName || trimmedName === 'User' || trimmedName === 'New User' || trimmedName === cleanPhone;
        const initialName = !isDefaultOrEmpty ? trimmedName : cleanPhone;

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
        // 11. Preserve the existing banned-account check.
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        // 3. If the user exists:
        // - NEVER create another User.
        // - NEVER replace a valid existing "user.name" with "User".
        // - NEVER replace a valid existing name with the phone number.
        // - NEVER replace a valid existing name with "New User".
        // - Preserve the existing username/name unless the user is explicitly changing their profile through the profile-edit endpoint.
        // 4. Treat the "name", "about", and "avatarUrl" values sent during authentication as OPTIONAL bootstrap data, not authoritative profile data for an existing account.
        // 5. For an existing account, authentication should primarily update session-related information such as "lastSeen".
        // - DO NOT update name, about, or avatar from authentication request data.
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastSeen: new Date()
          }
        });
      }

      // 9. RequiresProfileSetup must be true ONLY when the existing/new account genuinely has no username/name.
      // 10. Never use "User" as evidence that the account is new.
      const isNewNameEmpty = !user.name || user.name.trim().length === 0 || user.name === user.phoneNumber || user.name === cleanPhone;
      const requiresProfileSetup = isNewNameEmpty;

      // Add server-side logging for development/testing
      console.log(`[PhoneLogin] Authentication identity resolved for phone: ${cleanPhone}`);
      console.log(`[PhoneLogin] Account status: ${isNew ? 'NEW' : 'EXISTING'} account`);
      console.log(`[PhoneLogin] Resolved user ID: ${user.id}`);
      console.log(`[PhoneLogin] Profile setup required: ${requiresProfileSetup}`);

      const token = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber, firebaseVerified: !!firebaseIdToken },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      // 7. Return the complete persisted User object in the authentication response.
      // 8. Add an explicit account state to the response, for example: "isNewUser: true/false" and/or "requiresProfileSetup: true/false".
      res.json({ 
        user, 
        token,
        isNewUser: isNew,
        requiresProfileSetup
      });
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
      let isNewUser = false;

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
        isNewUser = true;
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
          lastSeen: new Date()
        };

        if (verifiedEmail && !user.googleEmail) {
          updateData.googleEmail = verifiedEmail;
          updateData.authProvider = 'GOOGLE';
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }

      const isNewNameEmpty = !user.name || user.name.trim().length === 0 || user.name === user.phoneNumber || user.name === 'User' || user.name === 'New User';
      const isPhoneDummy = user.phoneNumber.startsWith('g_');
      const requiresProfileSetup = isNewNameEmpty || isPhoneDummy;

      console.log(`[GoogleLogin] Authentication identity resolved for email: ${verifiedEmail}`);
      console.log(`[GoogleLogin] Account status: ${isNewUser ? 'NEW' : 'EXISTING'} account`);
      console.log(`[GoogleLogin] Resolved user ID: ${user.id}`);
      console.log(`[GoogleLogin] Profile setup required: ${requiresProfileSetup}`);

      const token = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({ 
        user, 
        token,
        isNewUser,
        requiresProfileSetup
      });
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
