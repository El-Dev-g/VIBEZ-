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
        ownerId: c.ownerId,
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
              isGroup: true,
              allowComments: false,
              members: {
                create: {
                  userId
                }
              }
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
        ownerId: community.ownerId,
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

      const isCommunityOfficial = (community as any).isOfficial || false;
      const mappedChannels = (community.channels || []).map((channel: any) => ({
        ...channel,
        isOfficial: isCommunityOfficial || channel.isOfficial || false,
        isVerified: isCommunityOfficial || channel.isVerified || false
      }));

      res.json({
        id: community.id,
        name: community.name,
        description: community.description,
        avatarUrl: (community as any).avatarUrl,
        ownerId: community.ownerId,
        isOfficial: isCommunityOfficial,
        allowComments: (community as any).allowComments,
        allowReactions: (community as any).allowReactions,
        createdAt: community.createdAt,
        membersCount: (community as any)._count?.members || community.members.length,
        members: community.members,
        channels: mappedChannels
      });
    } catch (error) {
      console.error('Error fetching community details:', error);
      res.status(500).json({ error: 'Failed to fetch community details' });
    }
  }

  async getCommunityChannels(req: AuthRequest, res: Response) {
    try {
      const { communityId } = req.params;
      const userId = req.user?.id as string;

      // Ensure the user is registered as a member of the community itself
      const existingCommunityMember = await prisma.communityMember.findFirst({
        where: { communityId, userId }
      });

      if (!existingCommunityMember) {
        await prisma.communityMember.create({
          data: {
            communityId,
            userId,
            role: 'MEMBER'
          }
        }).catch(() => {});
      }

      const community = await prisma.community.findUnique({
        where: { id: communityId }
      });
      const isCommunityOfficial = community?.isOfficial || false;

      let channels = await prisma.chat.findMany({
        where: { communityId, isGroup: true },
        include: {
          members: {
            include: { user: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (channels.length === 0) {
        // Automatically create an "Announcements" channel on the fly so it is immediately functional
        const newChannel = await prisma.chat.create({
          data: {
            name: 'Announcements',
            isGroup: true,
            allowComments: false,
            communityId,
            members: {
              create: {
                userId
              }
            }
          },
          include: {
            members: {
              include: { user: true }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        });
        channels = [newChannel];
      } else {
        // Ensure the user is a member of every channel in this community so they can view and receive messages
        for (const channel of channels) {
          const isMember = channel.members.some(m => m.userId === userId);
          if (!isMember) {
            await prisma.chatMember.create({
              data: {
                chatId: channel.id,
                userId
              }
            }).catch(() => {});
            
            // Append the new member object to our response so the client receives it instantly
            const userObj = await prisma.user.findUnique({ where: { id: userId } });
            if (userObj) {
              channel.members.push({
                chatId: channel.id,
                userId,
                user: userObj
              } as any);
            }
          }
        }
      }

      const mappedChannels = channels.map(channel => ({
        ...channel,
        isOfficial: isCommunityOfficial || (channel as any).isOfficial || false,
        isVerified: isCommunityOfficial || (channel as any).isVerified || false
      }));

      res.json(mappedChannels);
    } catch (error) {
      console.error('Error fetching community channels:', error);
      res.status(500).json({ error: 'Failed to fetch community channels' });
    }
  }

  async joinCommunity(req: AuthRequest, res: Response) {
    try {
      const { communityId } = req.params;
      const userId = req.user?.id as string;

      // Check if already a member
      const existingMember = await prisma.communityMember.findFirst({
        where: { communityId, userId }
      });

      if (existingMember) {
        return res.json({ message: 'Already a member' });
      }

      // Add to community
      await prisma.communityMember.create({
        data: {
          communityId,
          userId,
          role: 'MEMBER'
        }
      });

      // Also add to all public channels in the community
      const channels = await prisma.chat.findMany({
        where: { communityId, isGroup: true }
      });

      for (const channel of channels) {
        await prisma.chatMember.create({
          data: {
            chatId: channel.id,
            userId
          }
        }).catch(() => {}); // Ignore if already a member of channel
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error joining community:', error);
      res.status(500).json({ error: 'Failed to join community' });
    }
  }
}
