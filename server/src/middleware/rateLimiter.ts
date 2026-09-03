import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [key: string]: RateLimitStore } = {};

// Automated cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(stores).forEach(storeKey => {
    const store = stores[storeKey];
    Object.keys(store).forEach(ip => {
      if (store[ip].resetTime < now) {
        delete store[ip];
      }
    });
  });
}, 10 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
}) => {
  const { windowMs, max, message, keyPrefix = 'default' } = options;
  if (!stores[keyPrefix]) {
    stores[keyPrefix] = {};
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const store = stores[keyPrefix];
    const clientIp = (
      req.headers['x-forwarded-for'] as string ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();

    const now = Date.now();

    if (!store[clientIp] || store[clientIp].resetTime < now) {
      store[clientIp] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    store[clientIp].count += 1;

    if (store[clientIp].count > max) {
      const retryAfterSeconds = Math.ceil((store[clientIp].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds,
        statusCode: 429
      });
    }

    next();
  };
};

// Rate limiter for authentication attempts (e.g. 50 attempts per 15 minutes per IP)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Security Alert: Too many authentication attempts from this IP address. Please try again in 15 minutes.',
  keyPrefix: 'auth_login'
});

// Rate limiter for general sensitive admin endpoints (e.g. 1000 calls per 15 mins)
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Security Alert: Rate limit exceeded for administrative API. Please throttle your requests.',
  keyPrefix: 'admin_api'
});
