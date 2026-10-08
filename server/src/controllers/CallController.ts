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

  async getTurnCredentials(req: AuthRequest, res: Response) {
    try {
      const { CallingGateway } = await import('../services/CallingGateway');
      const iceServers = CallingGateway.getInstance().getIceServers();
      res.json({ iceServers });
    } catch (error) {
      console.error('Error getting TURN credentials:', error);
      res.status(500).json({ error: 'Failed to get ICE servers' });
    }
  }

  async getGatewayStatus(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const callerUserId = req.user?.id;
      const { CallingGateway } = await import('../services/CallingGateway');
      const status = await CallingGateway.getInstance().getTargetAvailability(targetId, callerUserId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching gateway status:', error);
      res.status(500).json({ error: 'Failed to fetch gateway status' });
    }
  }

  async initiateCall(req: AuthRequest, res: Response) {
    try {
      const { targetId, isVideo } = req.body;
      const callerUserId = req.user?.id as string;
      const { CallingGateway } = await import('../services/CallingGateway');
      const recipient = await CallingGateway.getInstance().resolveRecipient(targetId, callerUserId);

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient could not be found' });
      }

      // Log the initiated call
      const call = await prisma.call.create({
        data: {
          callerId: callerUserId,
          receiverId: recipient.userId,
          type: isVideo ? 'VIDEO' : 'VOICE',
          status: 'INITIATED',
          duration: 0
        }
      });

      res.json({
        callId: call.id,
        recipient: {
          userId: recipient.userId,
          name: recipient.name,
          accountType: recipient.accountType,
          businessProfileId: recipient.businessProfileId,
          isOnline: recipient.socketIds.length > 0
        }
      });
    } catch (error) {
      console.error('Error initiating gateway call:', error);
      res.status(500).json({ error: 'Failed to initiate gateway call' });
    }
  }
}
