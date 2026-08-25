import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

export class AdminController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const cleanPassword = password ? password.trim() : '';

      const admin = await prisma.admin.findFirst({
        where: {
          email: {
            equals: cleanEmail,
            mode: 'insensitive'
          }
        }
      });
      
      if (!admin || admin.password !== cleanPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.json({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        token
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getMetrics(req: Request, res: Response) {
    try {
      const activeUsers = await prisma.user.count();
      const totalChats = await prisma.chat.count();
      const totalMessages = await prisma.message.count();
      const totalReports = await prisma.report.count({ where: { status: 'PENDING' } });
      
      res.json({
        activeUsers,
        totalChats,
        totalMessages,
        pendingReports: totalReports,
        systemStatus: 'Healthy',
        latencyMs: 12 // Real measurement would go here
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          isBanned: true,
          isVerified: true,
          verifiedAt: true,
          createdAt: true,
        }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getReports(req: Request, res: Response) {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // Enhance with names for the dashboard
      const enhancedReports = await Promise.all(reports.map(async (report) => {
        const reporter = await prisma.user.findUnique({ where: { id: report.reporterId }, select: { name: true } });
        const reported = await prisma.user.findUnique({ where: { id: report.reportedUserId }, select: { name: true } });
        
        return {
          ...report,
          reporterName: reporter?.name || 'Unknown',
          reportedUserName: reported?.name || 'Unknown'
        };
      }));

      res.json(enhancedReports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          about: true,
          avatarUrl: true,
          isBanned: true,
          isVerified: true,
          verifiedAt: true,
          createdAt: true,
          lastSeen: true,
          _count: {
            select: {
              sentMessages: true,
              chats: true,
              reportsReceived: true,
            }
          }
        }
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async unbanUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { adminEmail } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false }
      });

      await prisma.auditLog.create({
        data: {
          adminEmail: adminEmail || 'system',
          action: 'UNBAN_USER',
          target: userId
        }
      });

      res.json({ success: true, message: `User ${userId} unbanned` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unban user' });
    }
  }

  async banUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { adminEmail } = req.body;

      // Update user in DB
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          adminEmail: adminEmail || 'system',
          action: 'BAN_USER',
          target: userId
        }
      });

      res.json({ success: true, message: `User ${userId} banned` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to ban user' });
    }
  }

  async getAuditLogs(req: Request, res: Response) {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      let settings = await prisma.systemSetting.findFirst();
      if (!settings) {
        settings = await prisma.systemSetting.create({
          data: {
            allowNewRegistrations: true,
            maintenanceMode: false,
            maxGroupSize: 1024,
            retentionDays: 90,
            verificationBadgePrice: 3.00
          }
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { id, ...data } = req.body;
      let target = await prisma.systemSetting.findFirst();
      
      const allowNewRegistrations = data.allowNewRegistrations !== undefined ? Boolean(data.allowNewRegistrations) : undefined;
      const maintenanceMode = data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : undefined;
      const maxGroupSize = data.maxGroupSize !== undefined && !isNaN(Number(data.maxGroupSize)) ? Number(data.maxGroupSize) : undefined;
      const retentionDays = data.retentionDays !== undefined && !isNaN(Number(data.retentionDays)) ? Number(data.retentionDays) : undefined;
      
      const rawPrice = data.verificationBadgePrice !== undefined ? data.verificationBadgePrice : data.badgePrice;
      const verificationBadgePrice = rawPrice !== undefined && rawPrice !== null && !isNaN(parseFloat(String(rawPrice))) ? parseFloat(String(rawPrice)) : undefined;

      if (!target) {
        target = await prisma.systemSetting.create({
          data: {
            allowNewRegistrations: allowNewRegistrations ?? true,
            maintenanceMode: maintenanceMode ?? false,
            maxGroupSize: maxGroupSize ?? 1024,
            retentionDays: retentionDays ?? 90,
            verificationBadgePrice: verificationBadgePrice ?? 3.00
          }
        });
        return res.json(target);
      }

      const updatePayload: any = {};
      if (allowNewRegistrations !== undefined) updatePayload.allowNewRegistrations = allowNewRegistrations;
      if (maintenanceMode !== undefined) updatePayload.maintenanceMode = maintenanceMode;
      if (maxGroupSize !== undefined) updatePayload.maxGroupSize = maxGroupSize;
      if (retentionDays !== undefined) updatePayload.retentionDays = retentionDays;
      if (verificationBadgePrice !== undefined) updatePayload.verificationBadgePrice = verificationBadgePrice;

      const updated = await prisma.systemSetting.update({
        where: { id: target.id },
        data: updatePayload
      });
      res.json(updated);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}
