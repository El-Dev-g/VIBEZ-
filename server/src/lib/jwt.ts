import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let runtimeDevSecret: string | null = null;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  return 'vibez_secret_jwt_key_2026_production_safe';
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
