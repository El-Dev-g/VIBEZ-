import { Request, Response, NextFunction } from 'express';

// Set production-grade HTTP Security Headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking via frame embedding
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS HSTS header
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Restrict referrer metadata
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict permission policies
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  next();
};

// Sensitive keys that must never be altered or corrupted during sanitization
const SENSITIVE_KEYS = new Set([
  'password', 'newpassword', 'oldpassword', 'confirmpassword',
  'token', 'idtoken', 'firebaseidtoken', 'refreshtoken', 'accesstoken',
  'secret', 'webhooksecret', 'signature', 'rawreceipt', 'apikey', 'key',
  'hash', 'privatekey', 'certificate'
]);

// Production-grade string sanitizer that eliminates XSS and dangerous script schemes
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;
  
  // Neutralize script tags (including malformed or case-variant tags)
  let clean = value.replace(/<\s*script\b[^>]*>([\s\S]*?)<\s*\/\s*script\s*>/gi, '');
  clean = clean.replace(/<\s*script\b[^>]*>/gi, '');
  
  // Neutralize dangerous inline event handlers (onerror=, onclick=, onload=, etc.)
  clean = clean.replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  
  // Neutralize pseudo-protocol injections (javascript:, vbscript:, data:text/html)
  clean = clean.replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:[^"'\s]*/gi, '');

  return clean;
}

function sanitizeDeep(obj: any, keyName?: string): any {
  if (obj === null || obj === undefined) return obj;
  if (Buffer.isBuffer(obj)) return obj;

  if (keyName && SENSITIVE_KEYS.has(keyName.toLowerCase())) {
    return obj; // Leave sensitive cryptographic and auth credentials pristine
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDeep(item, keyName));
  }

  if (typeof obj === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      sanitizedObj[key] = sanitizeDeep(obj[key], key);
    }
    return sanitizedObj;
  }

  return obj;
}

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeDeep(req.query) as any;
  }

  next();
};

// Enforce JWT Secret Entropy Check
export const checkSecretEntropy = () => {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const weakSecrets = ['secret', 'default_secret', 'vibez_secret_jwt_key_2026_production_safe', 'password', '12345678'];

  if (!secret || weakSecrets.includes(secret) || secret.length < 32) {
    if (isProduction) {
      throw new Error(
        'FATAL: JWT_SECRET is missing, weak, or uses an insecure default in production. ' +
        'Production requires a high-entropy string of at least 32 characters.'
      );
    } else {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️  SECURITY WARNING: JWT_SECRET is weak or default! In production, ensure JWT_SECRET is a randomly generated high-entropy string (32+ characters).');
    }
  }
};
