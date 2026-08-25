import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  const url = req.originalUrl || req.path;
  // Always bypass maintenance check for Admin APIs, health check, and system status endpoint
  if (
    url.startsWith('/api/admin') ||
    url.includes('/admin/') ||
    url === '/health' ||
    url.includes('/system/status') ||
    req.path.startsWith('/admin') ||
    req.path === '/system/status'
  ) {
    return next();
  }

  try {
    const settings = await prisma.systemSetting.findFirst();
    if (settings?.maintenanceMode) {
      return res.status(503).json({
        error: 'System is currently undergoing scheduled maintenance. Please try again later.',
        maintenanceMode: true
      });
    }
  } catch (error) {
    console.error('Maintenance check error:', error);
  }

  next();
};
