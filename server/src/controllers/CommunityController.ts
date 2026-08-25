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
        id: c.id,
        name: c.name,
        description: c.description,
        avatarUrl: (c as any).avatarUrl,
        isOfficial: (c as any).isOfficial,
        allowComments: (c as any).allowComments,
        allowReactions: (c as any).allowReactions,
        createdAt: c.createdAt,
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
          },
          channels: {
            create: {
              name: 'Announcements',
              isGroup: true
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
        id: community.id,
        name: community.name,
        description: community.description,
        avatarUrl: (community as any).avatarUrl,
        isOfficial: (community as any).isOfficial,
        allowComments: (community as any).allowComments,
        allowReactions: (community as any).allowReactions,
        createdAt: community.createdAt,
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
        id: community.id,
        name: community.name,
        description: community.description,
        avatarUrl: (community as any).avatarUrl,
        isOfficial: (community as any).isOfficial,
        allowComments: (community as any).allowComments,
        allowReactions: (community as any).allowReactions,
        createdAt: community.createdAt,
        membersCount: (community as any)._count?.members || community.members.length,
        members: community.members,
        channels: community.channels
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
