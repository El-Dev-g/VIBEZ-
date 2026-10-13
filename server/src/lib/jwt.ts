import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';

let runtimeDevSecret: string | null = null;
let runtimeAdminSecret: string | null = null;
let runtimeDeveloperSecret: string | null = null;

const INSECURE_FALLBACKS = new Set([
  'vibez_secret_jwt_key_2026_production_safe',
  'secret',
  'default_secret',
  '12345678',
  'password'
]);

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (secret && secret.length >= 32 && !INSECURE_FALLBACKS.has(secret)) {
    return secret;
  }

  if (isProduction) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing, too short (<32 chars), or uses an insecure default. ' +
      'In production, JWT_SECRET must be set to a cryptographically strong random string of at least 32 characters.'
    );
  }

  // In non-production development/test: generate a process-scoped cryptographically random secret
  if (!runtimeDevSecret) {
    runtimeDevSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️  [JWT Warning] JWT_SECRET was not provided or is weak. Generated an ephemeral in-memory 256-bit secret for local development/testing.'
    );
  }
  return runtimeDevSecret;
};

export const getAdminJwtSecret = (): string => {
  const adminSecret = process.env.ADMIN_JWT_SECRET?.trim();
  if (adminSecret && adminSecret.length >= 32 && !INSECURE_FALLBACKS.has(adminSecret)) {
    return adminSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    // If ADMIN_JWT_SECRET is not separately configured, use the validated main JWT_SECRET
    return getJwtSecret();
  }
  if (!runtimeAdminSecret) {
    runtimeAdminSecret = crypto.randomBytes(32).toString('hex');
  }
  return runtimeAdminSecret;
};

export const getDeveloperJwtSecret = (): string => {
  const devSecret = process.env.DEVELOPER_JWT_SECRET?.trim();
  if (devSecret && devSecret.length >= 32 && !INSECURE_FALLBACKS.has(devSecret)) {
    return devSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    return getJwtSecret();
  }
  if (!runtimeDeveloperSecret) {
    runtimeDeveloperSecret = crypto.randomBytes(32).toString('hex');
  }
  return runtimeDeveloperSecret;
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
  appId?: string;
  tokenId?: string;
}


const JWT_ISSUER = 'vibez-api';
const JWT_AUDIENCE = 'vibez-client';

export const signUserToken = (payload: UserTokenPayload, expiresIn: string = '30d'): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const verifyUserToken = (token: string): UserTokenPayload => {
  const options: VerifyOptions = {
    algorithms: ['HS256']
  };
  const decoded = jwt.verify(token, getJwtSecret(), options) as any;
  return decoded as UserTokenPayload;
};

export const signAdminToken = (payload: AdminTokenPayload, expiresIn: string = '7d'): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: 'vibez-admin'
  };
  return jwt.sign(payload, getAdminJwtSecret(), options);
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  const options: VerifyOptions = {
    algorithms: ['HS256']
  };
  return jwt.verify(token, getAdminJwtSecret(), options) as AdminTokenPayload;
};

export const signDeveloperToken = (payload: DeveloperTokenPayload, expiresIn: string = '30d'): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: 'vibez-developer'
  };
  return jwt.sign(payload, getDeveloperJwtSecret(), options);
};

export const verifyDeveloperToken = (token: string): DeveloperTokenPayload => {
  const options: VerifyOptions = {
    algorithms: ['HS256']
  };
  return jwt.verify(token, getDeveloperJwtSecret(), options) as DeveloperTokenPayload;
};
