import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { verifyDeveloperToken, DeveloperTokenPayload } from '../lib/jwt';

export interface DeveloperRequest extends Request {
  developerAccount?: {
    id: string;
    userId: string;
    tier: string;
    status: string;
    organizationName?: string | null;
  };
  apiKey?: {
    id: string;
    name: string;
    scopes: string[];
    rateLimitRpm: number;
  };
  developerUser?: DeveloperTokenPayload;
}

/**
 * Authenticate Developer via API Key (X-API-Key or Bearer vbz_...)
 */
export const authenticateDeveloperApiKey = async (req: DeveloperRequest, res: Response, next: NextFunction) => {
  try {
    const rawApiKeyHeader = (req.headers['x-api-key'] as string) || '';
    const authHeader = req.headers.authorization || '';
    
    let rawKey = rawApiKeyHeader.trim();
    if (!rawKey && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1].trim();
      if (token.startsWith('vbz_')) {
        rawKey = token;
      }
    }

    if (!rawKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing developer API key. Provide key in X-API-Key header or Authorization: Bearer <key>.'
      });
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        developer: true
      }
    });

    if (!apiKey || !apiKey.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or deactivated API key.'
      });
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: API key has expired.'
      });
    }

    if (apiKey.developer.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Developer account is suspended or pending verification.'
      });
    }

    // Update last used timestamp asynchronously
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    req.developerAccount = {
      id: apiKey.developer.id,
      userId: apiKey.developer.userId,
      tier: apiKey.developer.tier,
      status: apiKey.developer.status,
      organizationName: apiKey.developer.organizationName
    };

    req.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
      rateLimitRpm: apiKey.rateLimitRpm
    };

    next();
  } catch (error) {
    console.error('[DeveloperAuth] Error verifying API Key:', error);
    return res.status(500).json({ success: false, error: 'Internal error during developer API key authentication.' });
  }
};

/**
 * Authenticate Developer Session (Portal JWT or API Key)
 */
export const authenticateDeveloper = async (req: DeveloperRequest, res: Response, next: NextFunction) => {
  const rawApiKeyHeader = (req.headers['x-api-key'] as string) || '';
  const authHeader = req.headers.authorization || '';

  // If X-API-Key is present or Bearer starts with vbz_, use API Key validation
  if (rawApiKeyHeader || (authHeader.startsWith('Bearer ') && authHeader.split(' ')[1].startsWith('vbz_'))) {
    return authenticateDeveloperApiKey(req, res, next);
  }

  // Otherwise validate developer JWT token
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Developer authentication required.'
    });
  }

  const token = authHeader.split(' ')[1].trim();
  try {
    const decoded = verifyDeveloperToken(token);
    req.developerUser = decoded;
    req.developerAccount = {
      id: decoded.developerAccountId,
      userId: decoded.id,
      tier: decoded.tier || 'FREE',
      status: 'ACTIVE',
      organizationName: null
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired developer session token.'
    });
  }
};

/**
 * Require specific scope for developer endpoints
 */
export const requireScope = (scope: string) => {
  return (req: DeveloperRequest, res: Response, next: NextFunction) => {
    if (req.apiKey) {
      if (!req.apiKey.scopes.includes(scope) && !req.apiKey.scopes.includes('*')) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: API key lacks the required '${scope}' scope.`
        });
      }
    }
    next();
  };
};
