import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyUserToken, verifyAdminToken } from '../lib/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phoneNumber?: string;
    email?: string;
    role?: string;
    isAdmin?: boolean;
    firebaseVerified?: boolean;
  };
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

// Authenticate regular app users
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyUserToken(token);
    req.user = decoded as any;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

// Strictly authenticate Administrator users - Normal users are denied
export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAdminToken(token);
    
    // Normal users do not have an admin role
    if (!decoded.id || !decoded.role) {
      return res.status(403).json({ 
        error: 'Forbidden: Access denied. Normal users are not authorized to access administrator systems.' 
      });
    }

    // Verify against Admin database table
    const adminUser = await prisma.admin.findUnique({
      where: { id: decoded.id }
    });

    if (!adminUser) {
      return res.status(403).json({ 
        error: 'Forbidden: Access denied. No valid administrator credentials associated with this account.' 
      });
    }

    req.admin = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    };
    req.user = {
      id: adminUser.id,
      phoneNumber: '',
      email: adminUser.email,
      role: adminUser.role,
      isAdmin: true
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired administrator token.' });
  }
};

