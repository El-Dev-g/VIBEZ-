import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class SubscriptionController {
  async subscribe(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    try {
      await prisma.subscription.upsert({
        where: { email },
        update: {},
        create: { email }
      });
      res.status(200).json({ message: 'Subscribed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  }
}
