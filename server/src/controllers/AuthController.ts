import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';
import { signUserToken } from '../lib/jwt';

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

      let isFirebaseVerified = false;

      // 2. Cryptographically verify Firebase ID token if provided
      if (firebaseIdToken && typeof firebaseIdToken === 'string') {
        try {
          const ticket = await client.verifyIdToken({
            idToken: firebaseIdToken,
            audience: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLIENT_ID,
          }).catch(async () => {
            // Also attempt un-audienced token payload verification
            const loginTicket = await client.verifySignedJwtWithCertsAsync(
              firebaseIdToken,
              {},
              ['https://securetoken.google.com/' + (process.env.FIREBASE_PROJECT_ID || '')]
            );
            return loginTicket;
          });

          const payload = ticket?.getPayload();
          if (payload) {
            const tokenPhone = (payload as any).phone_number ? (payload as any).phone_number.replace(/[^\d+]/g, '') : '';
            if (tokenPhone && tokenPhone !== cleanPhone) {
              return res.status(401).json({ error: 'Phone number in verification token does not match provided phone number' });
            }
            isFirebaseVerified = true;
          }
        } catch (tokenErr) {
          console.warn('[PhoneLogin] Firebase token verification note:', (tokenErr as any)?.message || tokenErr);
          // In strict production mode with Firebase enabled, require successful cryptographic verification
          if (process.env.REQUIRE_FIREBASE_VERIFICATION === 'true') {
            return res.status(401).json({ error: 'Firebase phone verification token is invalid or expired.' });
          }
        }
      }

      // 3. Look up the existing "User" by the normalized unique "phoneNumber"
      let user = await prisma.user.findFirst({
        where: { phoneNumber: cleanPhone }
      });

      let isNew = false;

      if (!user) {
        // Preserve "allowNewRegistrations"
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        isNew = true;

        // For a genuinely new account only:
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
        // Preserve the existing banned-account check.
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        // For an existing account, update lastSeen session info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastSeen: new Date()
          }
        });
      }

      const isNewNameEmpty = !user.name || user.name.trim().length === 0 || user.name === user.phoneNumber || user.name === cleanPhone;
      const requiresProfileSetup = isNewNameEmpty;

      console.log(`[PhoneLogin] Authentication identity resolved for phone: ${cleanPhone}`);
      console.log(`[PhoneLogin] Account status: ${isNew ? 'NEW' : 'EXISTING'} account`);
      console.log(`[PhoneLogin] Resolved user ID: ${user.id}`);
      console.log(`[PhoneLogin] Profile setup required: ${requiresProfileSetup}`);

      const token = signUserToken({
        id: user.id,
        phoneNumber: user.phoneNumber,
        googleEmail: user.googleEmail,
        firebaseVerified: isFirebaseVerified
      });

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
            // Strictly use verified Google claims rather than unverified client values
            verifiedEmail = payload.email || verifiedEmail;
            verifiedName = payload.name || verifiedName;
            verifiedAvatar = payload.picture || verifiedAvatar;
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

      const token = signUserToken({
        id: user.id,
        phoneNumber: user.phoneNumber,
        googleEmail: user.googleEmail
      });

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
