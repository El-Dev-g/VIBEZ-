import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { emailService } from '../lib/email';

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

      // Dispatch confirmation email asynchronously via Gmail nodemailer
      emailService.sendSubscriptionConfirmation(email).catch(err => {
        console.error('[Subscription] Error sending confirmation email:', err);
      });

      res.status(200).json({ message: 'Subscribed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  }
}
