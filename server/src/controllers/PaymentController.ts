import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  // Process $3.00 Green Verification Badge Payment
  async processVerificationPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { paymentProvider, transactionId, rawReceipt } = req.body;

      const txId = transactionId || `TX_VBZ_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const provider = paymentProvider || 'IN_APP_PAYMENT';

      // Check if transaction ID already exists
      const existingPayment = await prisma.badgePayment.findUnique({
        where: { transactionId: txId }
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'Transaction ID already processed' });
      }

      // Fetch dynamic badge price configured by admin
      const setting = await prisma.systemSetting.findFirst();
      const price = setting?.verificationBadgePrice ?? 3.00;

      // Record badge payment & update user status
      const payment = await prisma.$transaction(async (tx) => {
        const badgePayment = await tx.badgePayment.create({
          data: {
            userId,
            amount: price,
            currency: 'USD',
            status: 'COMPLETED',
            paymentProvider: provider,
            transactionId: txId,
            rawReceipt: rawReceipt || `VERIFICATION_PAYMENT_PROOF_USD${price}_${Date.now()}`
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            isVerified: true,
            verifiedAt: new Date()
          }
        });

        return badgePayment;
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          isVerified: true,
          verifiedAt: true
        }
      });

      return res.json({
        success: true,
        message: 'Green verification badge activated successfully!',
        payment,
        user: updatedUser
      });
    } catch (error) {
      console.error('Payment error:', error);
      return res.status(500).json({ error: 'Payment processing failed' });
    }
  }

  // Get current user's badge status and receipt history
  async getUserBadgeStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          isVerified: true,
          verifiedAt: true
        }
      });

      const payments = await prisma.badgePayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const setting = await prisma.systemSetting.findFirst();
      const priceVal = setting?.verificationBadgePrice ?? 3.00;

      return res.json({
        isVerified: user?.isVerified || false,
        verifiedAt: user?.verifiedAt,
        badgeType: 'Green Verification Badge',
        badgePrice: priceVal,
        price: `$${priceVal.toFixed(2)} USD`,
        payments
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch badge status' });
    }
  }

  // Admin: Get all badge payments & total verification revenue
  async getAdminBadgePayments(req: Response, res: Response) {
    try {
      const payments = await prisma.badgePayment.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              isVerified: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalRevenue = payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      const verifiedUsersCount = await prisma.user.count({
        where: { isVerified: true }
      });

      const setting = await prisma.systemSetting.findFirst();
      const verificationBadgePrice = setting?.verificationBadgePrice ?? 3.00;

      return res.json({
        payments,
        totalRevenue,
        totalPurchases: payments.length,
        verifiedUsersCount,
        verificationBadgePrice
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch badge payments' });
    }
  }

  // Admin: Revoke or Grant Badge
  async toggleUserBadge(req: Response, res: Response) {
    try {
      const { userId } = req.params;
      const { isVerified, adminEmail } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: !!isVerified,
          verifiedAt: isVerified ? new Date() : null
        }
      });

      await prisma.auditLog.create({
        data: {
          adminEmail: adminEmail || 'admin',
          action: isVerified ? 'GRANT_VERIFICATION_BADGE' : 'REVOKE_VERIFICATION_BADGE',
          target: userId
        }
      });

      return res.json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update badge status' });
    }
  }
}
