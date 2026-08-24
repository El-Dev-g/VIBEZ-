import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class CommunityController {
  async getCommunities(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const communities = await prisma.community.findMany({
        where: {
          members: {
            some: { userId }
          }
        },
        include: {
          members: true,
          channels: true
        }
      });
      res.json(communities);
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
        }
      });

      res.json(community);
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
          channels: true
        }
      });
      res.json(community);
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
