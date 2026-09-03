import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let runtimeDevSecret: string | null = null;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined in production environment.');
  }

  // Consistent runtime fallback for non-production environments
  if (!runtimeDevSecret) {
    runtimeDevSecret = crypto.randomBytes(32).toString('hex');
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  DEVELOPMENT WARNING: Using dynamically generated runtime secret for JWT signing.');
  }
  return runtimeDevSecret;
};

export interface UserTokenPayload {
  id: string;
  phoneNumber?: string;
  googleEmail?: string | null;
  firebaseVerified?: boolean;
}

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export interface DeveloperTokenPayload {
  id: string;
  email: string;
  developerAccountId: string;
  role: string;
  tier?: string;
  sub?: string;
  scope?: string;
}

export const signUserToken = (payload: UserTokenPayload, expiresIn: string = '30d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
};

export const verifyUserToken = (token: string): UserTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as UserTokenPayload;
};

export const signAdminToken = (payload: AdminTokenPayload, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
};

export const signDeveloperToken = (payload: DeveloperTokenPayload, expiresIn: string = '30d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as any);
};

export const verifyDeveloperToken = (token: string): DeveloperTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as DeveloperTokenPayload;
};
