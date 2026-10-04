import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class BusinessController {
  // Get Business Profile for authenticated user or specific business
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const targetUserId = (req.query.userId as string) || req.user?.id;
      if (!targetUserId) {
        return res.status(401).json({ error: 'User ID is required' });
      }

      let profile = await prisma.businessProfile.findUnique({
        where: { userId: targetUserId },
        include: {
          catalogItems: {
            where: { isAvailable: true },
            orderBy: { createdAt: 'desc' }
          },
          user: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!profile && req.user?.id === targetUserId) {
        // Create initial default business profile
        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        profile = await prisma.businessProfile.create({
          data: {
            userId: targetUserId,
            businessName: user?.name ? `${user.name} Business` : 'My Business',
            category: 'Retail & Shopping',
            description: 'Welcome to our official Vibez Business page!',
            businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
            email: user?.phoneNumber ? `${user.phoneNumber}@vibez.app` : 'business@vibez.app'
          },
          include: {
            catalogItems: true,
            user: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                avatarUrl: true
              }
            }
          }
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      res.status(500).json({ error: 'Failed to fetch business profile' });
    }
  }

  // Update Business Profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const {
        businessName,
        category,
        description,
        address,
        businessHours,
        website,
        email
      } = req.body;

      const profile = await prisma.businessProfile.upsert({
        where: { userId },
        update: {
          businessName,
          category,
          description,
          address,
          businessHours,
          website,
          email
        },
        create: {
          userId,
          businessName: businessName || 'My Business',
          category: category || 'General Business',
          description,
          address,
          businessHours,
          website,
          email
        }
      });

      res.json(profile);
    } catch (error) {
      console.error('Error updating business profile:', error);
      res.status(500).json({ error: 'Failed to update business profile' });
    }
  }

  // Catalog Item Management
  async getCatalog(req: AuthRequest, res: Response) {
    try {
      const businessUserId = (req.query.userId as string) || req.user?.id;
      if (!businessUserId) return res.status(400).json({ error: 'User ID required' });

      const profile = await prisma.businessProfile.findUnique({
        where: { userId: businessUserId }
      });

      if (!profile) return res.json([]);

      const items = await prisma.catalogItem.findMany({
        where: { businessId: profile.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json(items);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      res.status(500).json({ error: 'Failed to fetch catalog' });
    }
  }

  async addCatalogItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let profile = await prisma.businessProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        profile = await prisma.businessProfile.create({
          data: {
            userId,
            businessName: 'My Business'
          }
        });
      }

      const { title, description, price, currency, imageUrl, link } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });

      const item = await prisma.catalogItem.create({
        data: {
          businessId: profile.id,
          title,
          description,
          price: parseFloat(price) || 0.0,
          currency: currency || 'USD',
          imageUrl,
          link,
          isAvailable: true
        }
      });

      res.json(item);
    } catch (error) {
      console.error('Error adding catalog item:', error);
      res.status(500).json({ error: 'Failed to add catalog item' });
    }
  }

  async deleteCatalogItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const profile = await prisma.businessProfile.findUnique({ where: { userId } });
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      await prisma.catalogItem.deleteMany({
        where: { id, businessId: profile.id }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      res.status(500).json({ error: 'Failed to delete catalog item' });
    }
  }

  // Quick Replies
  async getQuickReplies(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const replies = await prisma.quickReply.findMany({
        where: { userId },
        orderBy: { shortcut: 'asc' }
      });

      res.json(replies);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      res.status(500).json({ error: 'Failed to fetch quick replies' });
    }
  }

  async addQuickReply(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { shortcut, message } = req.body;
      if (!userId || !shortcut || !message) {
        return res.status(400).json({ error: 'Shortcut and message required' });
      }

      const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
      const reply = await prisma.quickReply.create({
        data: {
          userId,
          shortcut: formattedShortcut,
          message
        }
      });

      res.json(reply);
    } catch (error) {
      console.error('Error adding quick reply:', error);
      res.status(500).json({ error: 'Failed to add quick reply' });
    }
  }

  async deleteQuickReply(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await prisma.quickReply.deleteMany({
        where: { id, userId }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      res.status(500).json({ error: 'Failed to delete quick reply' });
    }
  }

  // Automated Messages (Greeting, Away)
  async getAutomatedMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const messages = await prisma.automatedMessage.findMany({
        where: { userId }
      });

      res.json(messages);
    } catch (error) {
      console.error('Error fetching automated messages:', error);
      res.status(500).json({ error: 'Failed to fetch automated messages' });
    }
  }

  async updateAutomatedMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, content, isEnabled, schedule } = req.body;
      if (!userId || !type) return res.status(400).json({ error: 'User and type required' });

      const existing = await prisma.automatedMessage.findFirst({
        where: { userId, type }
      });

      let result;
      if (existing) {
        result = await prisma.automatedMessage.update({
          where: { id: existing.id },
          data: { content, isEnabled, schedule }
        });
      } else {
        result = await prisma.automatedMessage.create({
          data: {
            userId,
            type,
            content: content || (type === 'GREETING' ? 'Thank you for contacting us! How can we help you today?' : 'We are currently away and will reply shortly.'),
            isEnabled: isEnabled !== undefined ? isEnabled : true,
            schedule: schedule || 'ALWAYS'
          }
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Error updating automated message:', error);
      res.status(500).json({ error: 'Failed to update automated message' });
    }
  }

  // Chat Labels
  async getLabels(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let labels = await prisma.chatLabel.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (labels.length === 0) {
        // Seed standard WhatsApp Business default labels
        const defaults = [
          { name: 'New customer', colorHex: '#00A884' },
          { name: 'New order', colorHex: '#F59E0B' },
          { name: 'Pending payment', colorHex: '#EF4444' },
          { name: 'Paid', colorHex: '#10B981' },
          { name: 'Order complete', colorHex: '#3B82F6' }
        ];

        for (const def of defaults) {
          await prisma.chatLabel.create({
            data: { userId, name: def.name, colorHex: def.colorHex }
          });
        }

        labels = await prisma.chatLabel.findMany({ where: { userId } });
      }

      res.json(labels);
    } catch (error) {
      console.error('Error fetching labels:', error);
      res.status(500).json({ error: 'Failed to fetch labels' });
    }
  }

  async addLabel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, colorHex } = req.body;
      if (!userId || !name) return res.status(400).json({ error: 'Name is required' });

      const label = await prisma.chatLabel.create({
        data: {
          userId,
          name,
          colorHex: colorHex || '#25D366'
        }
      });

      res.json(label);
    } catch (error) {
      console.error('Error adding label:', error);
      res.status(500).json({ error: 'Failed to add label' });
    }
  }

  async toggleChatLabel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { labelId, chatId } = req.body;
      if (!userId || !labelId || !chatId) return res.status(400).json({ error: 'Missing parameters' });

      const label = await prisma.chatLabel.findFirst({
        where: { id: labelId, userId }
      });

      if (!label) return res.status(404).json({ error: 'Label not found' });

      const exists = label.chatIds.includes(chatId);
      const newChatIds = exists
        ? label.chatIds.filter(id => id !== chatId)
        : [...label.chatIds, chatId];

      const updated = await prisma.chatLabel.update({
        where: { id: labelId },
        data: { chatIds: newChatIds }
      });

      res.json(updated);
    } catch (error) {
      console.error('Error toggling chat label:', error);
      res.status(500).json({ error: 'Failed to toggle chat label' });
    }
  }
}
