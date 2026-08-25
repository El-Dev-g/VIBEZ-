import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class CommunityController {
  async getCommunities(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const communities = await prisma.community.findMany({
        where: {
          OR: [
            { members: { some: { userId } } },
            { isOfficial: true }
          ]
        },
        include: {
          _count: {
            select: { members: true }
          }
        }
      });

      const formatted = communities.map(c => ({
        ...c,
        membersCount: (c as any)._count?.members || 0
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching communities:', error);
      res.status(500).json({ error: 'Failed to fetch communities' });
    }
  }

  async createCommunity(req: AuthRequest, res: Response) {
    try {
      const { name, description, avatarUrl } = req.body;
      const userId = req.user?.id as string;

      const community = await prisma.community.create({
        data: {
          name,
          description,
          avatarUrl,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'ADMIN'
            }
          }
        },
        include: {
          _count: {
            select: { members: true }
          }
        }
      });

      res.json({
        ...community,
        membersCount: (community as any)._count?.members || 1
      });
    } catch (error) {
      console.error('Error creating community:', error);
      res.status(500).json({ error: 'Failed to create community' });
    }
  }

  async getCommunityDetails(req: AuthRequest, res: Response) {
    try {
      const { communityId } = req.params;
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: {
          members: {
            include: {
              user: true
            }
          },
          channels: true,
          _count: {
            select: { members: true }
          }
        }
      });

      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      res.json({
        ...community,
        membersCount: (community as any)._count?.members || community.members.length
      });
    } catch (error) {
      console.error('Error fetching community details:', error);
      res.status(500).json({ error: 'Failed to fetch community details' });
    }
  }

  async getCommunityChannels(req: AuthRequest, res: Response) {
    try {
      const { communityId } = req.params;
      const channels = await prisma.chat.findMany({
        where: { communityId, isGroup: true }
      });
      res.json(channels);
    } catch (error) {
      console.error('Error fetching community channels:', error);
      res.status(500).json({ error: 'Failed to fetch community channels' });
    }
  }
}
