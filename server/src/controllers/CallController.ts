import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class CallController {
  async getCallLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const calls = await prisma.call.findMany({
        where: {
          OR: [
            { callerId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          caller: true,
          receiver: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(calls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ error: 'Failed to fetch call logs' });
    }
  }

  async createCallLog(req: AuthRequest, res: Response) {
    try {
      const { receiverId, type, status, duration } = req.body;
      const callerId = req.user?.id as string;

      const call = await prisma.call.create({
        data: {
          callerId,
          receiverId,
          type: type || 'VOICE',
          status: status || 'COMPLETED',
          duration
        },
        include: {
          caller: true,
          receiver: true
        }
      });

      res.json(call);
    } catch (error) {
      console.error('Error creating call:', error);
      res.status(500).json({ error: 'Failed to create call log' });
    }
  }

  async deleteCallLog(req: AuthRequest, res: Response) {
    try {
      const { callId } = req.params;
      const userId = req.user?.id as string;

      await prisma.call.delete({
        where: {
          id: callId,
          OR: [
            { callerId: userId },
            { receiverId: userId }
          ]
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting call:', error);
      res.status(500).json({ error: 'Failed to delete call log' });
    }
  }

  async clearCallLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;

      await prisma.call.deleteMany({
        where: {
          OR: [
            { callerId: userId },
            { receiverId: userId }
          ]
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing calls:', error);
      res.status(500).json({ error: 'Failed to clear call logs' });
    }
  }
}
