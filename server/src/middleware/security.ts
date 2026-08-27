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

// Sanitize string inputs to prevent XSS and script injection attacks
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;
  // Remove dangerous script tags and inline event handlers
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });
  }

  next();
};

// Enforce JWT Secret Entropy Check
export const checkSecretEntropy = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'secret' || secret === 'default_secret' || secret.length < 16) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  SECURITY WARNING: JWT_SECRET is weak or default! In production, ensure JWT_SECRET is a randomly generated high-entropy string (32+ characters).');
  }
};
