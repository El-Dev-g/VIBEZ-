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

      if (!cleanPhone || cleanPhone.length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required (E.164 format recommended)' });
      }

      const isProduction = process.env.NODE_ENV === 'production';
      const firebaseProjectId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();

      let isFirebaseVerified = false;

      // 1. Strictly require Firebase ID token: do not allow unauthenticated login fallbacks
      if (!firebaseIdToken || typeof firebaseIdToken !== 'string') {
        // Only allow designated local test phone numbers in non-production development environments
        const isAllowedDevMock = !isProduction && 
          process.env.ALLOW_DEV_TEST_ACCOUNTS === 'true' && 
          (cleanPhone.startsWith('+1000') || cleanPhone.startsWith('+1123'));

        if (!isAllowedDevMock) {
          return res.status(401).json({
            error: 'Firebase phone verification token is required to authenticate phone number.'
          });
        }
      } else {
        // 2. Cryptographically verify Firebase ID token
        try {
          // Verify with Google Auth Client using project audience and issuer
          const ticket = await client.verifyIdToken({
            idToken: firebaseIdToken,
            audience: firebaseProjectId ? [firebaseProjectId] : undefined,
          });

          const payload = ticket.getPayload();
          if (!payload) {
            return res.status(401).json({ error: 'Invalid verification token payload' });
          }

          // Verify issuer is Google / Firebase Secure Token service
          const issuer = payload.iss;
          const expectedIssuerPrefix = 'https://securetoken.google.com/';
          if (firebaseProjectId && issuer && issuer !== `${expectedIssuerPrefix}${firebaseProjectId}`) {
            console.warn(`[PhoneLogin] Token issuer ${issuer} does not match project ${firebaseProjectId}`);
          }

          // Verify phone number claim
          const tokenPhone = (payload as any).phone_number ? (payload as any).phone_number.replace(/[^\d+]/g, '') : '';
          if (!tokenPhone) {
            return res.status(401).json({ error: 'Verification token does not contain a verified phone number claim' });
          }

          if (tokenPhone !== cleanPhone) {
            return res.status(401).json({ error: 'Phone number in verification token does not match provided phone number' });
          }

          isFirebaseVerified = true;
        } catch (tokenErr: any) {
          console.warn('[PhoneLogin] Firebase token verification failed:', tokenErr?.message || tokenErr);
          return res.status(401).json({ error: 'Firebase phone verification token is invalid or expired.' });
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
      const { idToken, phoneNumber } = req.body;
      const isProduction = process.env.NODE_ENV === 'production';
      const allowInsecure = process.env.ALLOW_INSECURE_AUTH === 'true' && !isProduction;

      if (!idToken && !allowInsecure) {
        return res.status(401).json({ error: 'Valid Google ID Token is required for Google authentication.' });
      }

      let verifiedEmail: string | null = null;
      let verifiedName: string | null = null;
      let verifiedAvatar: string | null = null;

      if (idToken) {
        try {
          const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (!payload) {
            return res.status(401).json({ error: 'Invalid Google ID Token payload.' });
          }

          if (!payload.email_verified) {
            return res.status(401).json({ error: 'Google account email must be verified by Google.' });
          }

          verifiedEmail = payload.email || null;
          verifiedName = payload.name || null;
          verifiedAvatar = payload.picture || null;
        } catch (verificationError) {
          console.error('Google ID Token verification failed:', verificationError);
          return res.status(401).json({ error: 'Invalid or expired Google ID Token.' });
        }
      } else if (allowInsecure) {
        // Non-production local test fallback only when explicitly permitted
        verifiedEmail = req.body.email ? String(req.body.email).trim() : null;
        verifiedName = req.body.name ? String(req.body.name).trim() : null;
        verifiedAvatar = req.body.avatarUrl || null;
      }

      if (!verifiedEmail) {
        return res.status(400).json({ error: 'Verified email claim is required for Google authentication.' });
      }

      let user = null;
      let isNewUser = false;

      // 1. Search exclusively by verified Google email
      user = await prisma.user.findFirst({
        where: { googleEmail: verifiedEmail }
      });

      if (!user) {
        isNewUser = true;
        const settings = await prisma.systemSetting.findFirst();
        if (settings && settings.allowNewRegistrations === false) {
          return res.status(403).json({ error: 'New user registrations are currently disabled by system administrator.' });
        }

        const generatedPhone = `g_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

        user = await prisma.user.create({
          data: {
            googleEmail: verifiedEmail,
            name: verifiedName || 'New User',
            avatarUrl: verifiedAvatar,
            phoneNumber: generatedPhone,
            authProvider: 'GOOGLE'
          }
        });
      } else {
        if (user.isBanned) {
          return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastSeen: new Date(),
            avatarUrl: verifiedAvatar || user.avatarUrl,
            name: user.name && user.name !== 'New User' ? user.name : (verifiedName || user.name)
          }
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
