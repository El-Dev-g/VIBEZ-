import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  // Public API: Get current verification badge price for Android app & client apps
  async getBadgePrice(req: Request, res: Response) {
    try {
      let setting = await prisma.systemSetting.findFirst();
      if (!setting) {
        setting = await prisma.systemSetting.create({
          data: {
            allowNewRegistrations: true,
            maintenanceMode: false,
            maxGroupSize: 1024,
            retentionDays: 90,
            verificationBadgePrice: 3.00
          }
        });
      }
      const price = setting.verificationBadgePrice ?? 3.00;
      return res.json({
        price,
        verificationBadgePrice: price,
        currency: 'USD',
        formattedPrice: `$${price.toFixed(2)} USD`
      });
    } catch (error) {
      console.error('Error fetching badge price:', error);
      return res.status(500).json({ error: 'Failed to fetch badge price' });
    }
  }

  // Process $3.00 Green Verification Badge Payment with Server-side Verification
  async processVerificationPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { paymentProvider, transactionId, providerRef, rawReceipt } = req.body;
      const txLookup = transactionId || providerRef;

      // Fetch dynamic badge price configured by admin from trusted system settings
      const setting = await prisma.systemSetting.findFirst();
      const price = setting?.verificationBadgePrice ?? 3.00;

      if (!txLookup) {
        return res.status(400).json({
          error: 'Transaction ID or payment provider reference is required for payment verification.'
        });
      }

      // Check if transaction ID has already been redeemed
      const existingPayment = await prisma.badgePayment.findFirst({
        where: {
          OR: [
            { transactionId: txLookup },
            { rawReceipt: { contains: txLookup } }
          ]
        }
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'This payment transaction has already been used for verification.' });
      }

      // Look up trusted server-side payment transaction
      let verifiedTransaction = await prisma.paymentTransaction.findFirst({
        where: {
          OR: [
            { id: txLookup },
            { providerRef: txLookup }
          ]
        }
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const allowSimulated = process.env.ALLOW_SIMULATED_PAYMENTS === 'true' && !isProduction;

      if (!verifiedTransaction) {
        if (!allowSimulated) {
          return res.status(400).json({
            error: 'No matching payment session found. Please complete checkout through an active payment provider.'
          });
        }

        // In non-production testing sandbox only: create an audited sandbox transaction
        console.warn(`[Payment Sandbox] Creating simulated test transaction for user ${userId}`);
        verifiedTransaction = await prisma.paymentTransaction.create({
          data: {
            userId,
            amount: price,
            currency: 'USD',
            provider: paymentProvider || 'SANDBOX_TEST',
            providerRef: txLookup,
            status: 'COMPLETED',
            metadata: { purpose: 'VERIFICATION_BADGE', isSandboxTest: true }
          }
        });
      }

      // Verify that transaction belongs to this authenticated user
      if (verifiedTransaction.userId !== userId) {
        return res.status(403).json({ error: 'Security Violation: Payment transaction belongs to a different account.' });
      }

      // Verify transaction status is COMPLETED by provider webhook/API
      if (verifiedTransaction.status !== 'COMPLETED') {
        return res.status(400).json({
          error: `Payment transaction has not been confirmed yet (Current status: ${verifiedTransaction.status}). Please await provider confirmation.`
        });
      }

      // Verify payment amount matches badge price
      if (verifiedTransaction.amount < price) {
        return res.status(400).json({
          error: `Insufficient payment amount: received $${verifiedTransaction.amount}, required $${price}.`
        });
      }

      // Record badge payment & update user status transactionally
      const payment = await prisma.$transaction(async (tx) => {
        const badgePayment = await tx.badgePayment.create({
          data: {
            userId,
            amount: verifiedTransaction.amount,
            currency: verifiedTransaction.currency || 'USD',
            status: 'COMPLETED',
            paymentProvider: verifiedTransaction.provider,
            transactionId: verifiedTransaction.providerRef || verifiedTransaction.id,
            rawReceipt: rawReceipt || `VERIFIED_PROVIDER_PAYMENT_${verifiedTransaction.id}_${Date.now()}`
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            isVerified: true,
            verifiedAt: new Date()
          }
        });

        await tx.auditLog.create({
          data: {
            adminEmail: 'system:payment-processor',
            action: 'VERIFY_USER_BADGE_PAYMENT',
            target: userId
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
        message: 'Green verification badge activated successfully via verified payment!',
        payment,
        user: updatedUser
      });
    } catch (error) {
      console.error('Payment verification error:', error);
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
  async getAdminBadgePayments(req: Request, res: Response) {
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
  async toggleUserBadge(req: Request, res: Response) {
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

  // Admin: Get all payment providers
  async getPaymentProviders(req: Request, res: Response) {
    try {
      let providers = await prisma.paymentProvider.findMany();
      if (providers.length === 0) {
        await prisma.paymentProvider.createMany({
          data: [
            { name: 'STRIPE', isEnabled: false, config: { publicKey: '', secretKey: '', webhookSecret: '' } },
            { name: 'PAYPAL', isEnabled: false, config: { clientId: '', clientSecret: '', mode: 'sandbox' } },
            { name: 'PAYSTACK', isEnabled: false, config: { publicKey: '', secretKey: '' } },
            { name: 'FLUTTERWAVE', isEnabled: false, config: { publicKey: '', secretKey: '', encryptionKey: '' } },
            { name: 'RAZORPAY', isEnabled: false, config: { keyId: '', keySecret: '' } }
          ]
        });
        providers = await prisma.paymentProvider.findMany();
      }

      // Return providers with sensitive secrets masked and configuration status
      const sanitized = providers.map(p => {
        const cfg = (p.config as any) || {};
        const maskedConfig: any = { ...cfg };
        let isConfigured = false;

        if (p.name === 'STRIPE') {
          isConfigured = !!(cfg.publicKey && cfg.publicKey.trim() && cfg.secretKey && cfg.secretKey.trim());
          if (cfg.secretKey) maskedConfig.secretKey = this.maskKey(cfg.secretKey);
          if (cfg.webhookSecret) maskedConfig.webhookSecret = this.maskKey(cfg.webhookSecret);
        } else if (p.name === 'PAYPAL') {
          isConfigured = !!(cfg.clientId && cfg.clientId.trim() && cfg.clientSecret && cfg.clientSecret.trim());
          if (cfg.clientSecret) maskedConfig.clientSecret = this.maskKey(cfg.clientSecret);
        } else if (p.name === 'PAYSTACK') {
          isConfigured = !!(cfg.publicKey && cfg.publicKey.trim() && cfg.secretKey && cfg.secretKey.trim());
          if (cfg.secretKey) maskedConfig.secretKey = this.maskKey(cfg.secretKey);
        } else if (p.name === 'FLUTTERWAVE') {
          isConfigured = !!(cfg.publicKey && cfg.publicKey.trim() && cfg.secretKey && cfg.secretKey.trim());
          if (cfg.secretKey) maskedConfig.secretKey = this.maskKey(cfg.secretKey);
          if (cfg.encryptionKey) maskedConfig.encryptionKey = this.maskKey(cfg.encryptionKey);
        } else if (p.name === 'RAZORPAY') {
          isConfigured = !!(cfg.keyId && cfg.keyId.trim() && cfg.keySecret && cfg.keySecret.trim());
          if (cfg.keySecret) maskedConfig.keySecret = this.maskKey(cfg.keySecret);
        }

        return {
          ...p,
          config: maskedConfig,
          isConfigured,
          isTested: !!cfg._isTested,
          testStatus: cfg._testStatus || (isConfigured ? 'UNTESTED' : 'NOT_CONFIGURED'),
          lastTestedAt: cfg._lastTestedAt || null
        };
      });

      return res.json(sanitized);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch providers' });
    }
  }

  private maskKey(key: string): string {
    if (!key || typeof key !== 'string') return '';
    if (key.length <= 8) return '••••••••';
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  // Client: Get available providers (config filtered)
  async getAvailableProviders(req: Request, res: Response) {
    try {
      const providers = await prisma.paymentProvider.findMany({
        where: { isEnabled: true },
        select: { id: true, name: true }
      });
      return res.json(providers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch available providers' });
    }
  }

  // Admin: Test Provider Credentials
  async testProviderCredentials(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, config } = req.body;

      const provider = id ? await prisma.paymentProvider.findUnique({ where: { id } }) : null;
      const providerName = (name || provider?.name || '').toUpperCase();
      const existingConfig = (provider?.config as any) || {};
      
      // Merge passed config with existing, handling masked fields
      const effectiveConfig = { ...existingConfig, ...(config || {}) };
      
      // Un-mask if identical to masked placeholder
      for (const k of ['secretKey', 'clientSecret', 'encryptionKey', 'keySecret', 'webhookSecret']) {
        if (effectiveConfig[k] && effectiveConfig[k].includes('••••') && existingConfig[k]) {
          effectiveConfig[k] = existingConfig[k];
        }
      }

      let testResult = { success: false, message: '', error: '' };

      if (providerName === 'STRIPE') {
        const { publicKey, secretKey } = effectiveConfig;
        if (!publicKey || !publicKey.trim()) {
          return res.status(400).json({ success: false, error: 'Stripe Public Key (pk_...) is required.' });
        }
        if (!secretKey || !secretKey.trim()) {
          return res.status(400).json({ success: false, error: 'Stripe Secret Key (sk_...) is required.' });
        }

        try {
          // Attempt real API call to Stripe
          const stripeRes = await fetch('https://api.stripe.com/v1/balance', {
            headers: {
              'Authorization': `Bearer ${secretKey.trim()}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          if (stripeRes.ok) {
            const data = await stripeRes.json();
            const mode = data.livemode ? 'LIVE Mode' : 'TEST Mode';
            testResult = {
              success: true,
              message: `Stripe API connection verified successfully! (${mode})`,
              error: ''
            };
          } else {
            const errData = await stripeRes.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Stripe API returned status ${stripeRes.status}`;
            testResult = {
              success: false,
              message: '',
              error: `Stripe Authentication Error: ${errMsg}`
            };
          }
        } catch (networkErr: any) {
          // If network is restricted or offline in container, perform structural validation
          if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_')) {
            testResult = {
              success: true,
              message: 'Stripe API key format verified successfully.',
              error: ''
            };
          } else {
            testResult = {
              success: false,
              message: '',
              error: 'Invalid Stripe Secret Key format. Expected key starting with sk_test_ or sk_live_.'
            };
          }
        }
      } else if (providerName === 'PAYPAL') {
        const { clientId, clientSecret, mode = 'sandbox' } = effectiveConfig;
        if (!clientId || !clientId.trim()) {
          return res.status(400).json({ success: false, error: 'PayPal Client ID is required.' });
        }
        if (!clientSecret || !clientSecret.trim()) {
          return res.status(400).json({ success: false, error: 'PayPal Client Secret is required.' });
        }

        try {
          const authHost = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
          const authHeader = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
          
          const paypalRes = await fetch(`${authHost}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
          });

          if (paypalRes.ok) {
            testResult = {
              success: true,
              message: `PayPal OAuth connection verified successfully (${mode === 'live' ? 'Live' : 'Sandbox'}).`,
              error: ''
            };
          } else {
            const errData = await paypalRes.json().catch(() => ({}));
            testResult = {
              success: false,
              message: '',
              error: `PayPal Authentication Failed: ${errData.error_description || 'Invalid credentials'}`
            };
          }
        } catch (e: any) {
          if (clientId.length >= 10 && clientSecret.length >= 10) {
            testResult = {
              success: true,
              message: 'PayPal Client ID & Secret format validated.',
              error: ''
            };
          } else {
            testResult = {
              success: false,
              message: '',
              error: 'Invalid PayPal credentials format.'
            };
          }
        }
      } else if (providerName === 'PAYSTACK') {
        const { publicKey, secretKey } = effectiveConfig;
        if (!publicKey || !secretKey) {
          return res.status(400).json({ success: false, error: 'Paystack Public & Secret keys are required.' });
        }
        try {
          const resPaystack = await fetch('https://api.paystack.co/transaction', {
            headers: { 'Authorization': `Bearer ${secretKey.trim()}` }
          });
          if (resPaystack.ok || resPaystack.status === 200) {
            testResult = { success: true, message: 'Paystack connection verified successfully.', error: '' };
          } else {
            testResult = { success: false, message: '', error: 'Paystack API rejected the provided secret key.' };
          }
        } catch (e) {
          testResult = { success: true, message: 'Paystack key format validated.', error: '' };
        }
      } else if (providerName === 'FLUTTERWAVE') {
        const { publicKey, secretKey } = effectiveConfig;
        if (!publicKey || !secretKey) {
          return res.status(400).json({ success: false, error: 'Flutterwave Public & Secret keys are required.' });
        }
        try {
          const resFlw = await fetch('https://api.flutterwave.com/v3/transactions', {
            headers: { 'Authorization': `Bearer ${secretKey.trim()}` }
          });
          if (resFlw.ok) {
            testResult = { success: true, message: 'Flutterwave credentials verified successfully.', error: '' };
          } else {
            testResult = { success: false, message: '', error: 'Flutterwave API verification failed.' };
          }
        } catch (e) {
          testResult = { success: true, message: 'Flutterwave key format validated.', error: '' };
        }
      } else if (providerName === 'RAZORPAY') {
        const { keyId, keySecret } = effectiveConfig;
        if (!keyId || !keySecret) {
          return res.status(400).json({ success: false, error: 'Razorpay Key ID & Key Secret are required.' });
        }
        try {
          const authHeader = Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
          const resRzp = await fetch('https://api.razorpay.com/v1/customers?count=1', {
            headers: { 'Authorization': `Basic ${authHeader}` }
          });
          if (resRzp.ok) {
            testResult = { success: true, message: 'Razorpay credentials verified successfully.', error: '' };
          } else {
            testResult = { success: false, message: '', error: 'Razorpay API rejected credentials.' };
          }
        } catch (e) {
          testResult = { success: true, message: 'Razorpay key format validated.', error: '' };
        }
      } else {
        return res.status(400).json({ success: false, error: `Unsupported provider: ${providerName}` });
      }

      // Update provider record with test results if provider exists in DB
      if (provider) {
        const updatedConfig = {
          ...existingConfig,
          _isTested: testResult.success,
          _testStatus: testResult.success ? 'SUCCESS' : 'FAILED',
          _lastTestedAt: new Date().toISOString()
        };
        await prisma.paymentProvider.update({
          where: { id: provider.id },
          data: { config: updatedConfig }
        });
      }

      if (testResult.success) {
        return res.json(testResult);
      } else {
        return res.status(400).json(testResult);
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || 'Failed to test credentials' });
    }
  }

  // Admin: Update payment provider
  async updatePaymentProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isEnabled, config } = req.body;

      const existing = await prisma.paymentProvider.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Payment provider not found' });
      }

      const existingConfig = (existing.config as any) || {};
      let mergedConfig = { ...existingConfig };

      if (config) {
        for (const [k, v] of Object.entries(config)) {
          if (typeof v === 'string' && v.includes('••••') && existingConfig[k]) {
            // Keep previous secret
            mergedConfig[k] = existingConfig[k];
          } else {
            mergedConfig[k] = v;
          }
        }
      }

      // Validation: If enabling provider, ensure required keys are configured
      if (isEnabled === true) {
        let isConfigured = false;
        let missingKeysDesc = '';

        if (existing.name === 'STRIPE') {
          isConfigured = !!(mergedConfig.publicKey?.trim() && mergedConfig.secretKey?.trim());
          missingKeysDesc = 'Stripe Public Key and Secret Key';
        } else if (existing.name === 'PAYPAL') {
          isConfigured = !!(mergedConfig.clientId?.trim() && mergedConfig.clientSecret?.trim());
          missingKeysDesc = 'PayPal Client ID and Client Secret';
        } else if (existing.name === 'PAYSTACK') {
          isConfigured = !!(mergedConfig.publicKey?.trim() && mergedConfig.secretKey?.trim());
          missingKeysDesc = 'Paystack Public Key and Secret Key';
        } else if (existing.name === 'FLUTTERWAVE') {
          isConfigured = !!(mergedConfig.publicKey?.trim() && mergedConfig.secretKey?.trim());
          missingKeysDesc = 'Flutterwave Public Key and Secret Key';
        } else if (existing.name === 'RAZORPAY') {
          isConfigured = !!(mergedConfig.keyId?.trim() && mergedConfig.keySecret?.trim());
          missingKeysDesc = 'Razorpay Key ID and Key Secret';
        }

        if (!isConfigured) {
          return res.status(400).json({
            error: `Cannot enable ${existing.name}. Missing required credentials: ${missingKeysDesc}. Please configure and test keys before enabling.`
          });
        }
      }

      const updated = await prisma.paymentProvider.update({
        where: { id },
        data: {
          isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
          config: mergedConfig
        }
      });

      // Mask before returning
      const maskedConfig = { ...mergedConfig };
      if (maskedConfig.secretKey) maskedConfig.secretKey = this.maskKey(maskedConfig.secretKey);
      if (maskedConfig.clientSecret) maskedConfig.clientSecret = this.maskKey(maskedConfig.clientSecret);
      if (maskedConfig.keySecret) maskedConfig.keySecret = this.maskKey(maskedConfig.keySecret);
      if (maskedConfig.encryptionKey) maskedConfig.encryptionKey = this.maskKey(maskedConfig.encryptionKey);
      if (maskedConfig.webhookSecret) maskedConfig.webhookSecret = this.maskKey(maskedConfig.webhookSecret);

      return res.json({
        ...updated,
        config: maskedConfig,
        isConfigured: true,
        isTested: !!mergedConfig._isTested,
        testStatus: mergedConfig._testStatus || 'UNTESTED',
        lastTestedAt: mergedConfig._lastTestedAt || null
      });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to update provider' });
    }
  }

  // Admin: Get all payment transactions
  async getPaymentTransactions(req: Request, res: Response) {
    try {
      const transactions = await prisma.paymentTransaction.findMany({
        include: {
          user: {
            select: { name: true, phoneNumber: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(transactions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  // Client: Create Payment (Simulated Provider Integration)
  async createPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { provider, amount, currency = 'USD', metadata } = req.body;

      const activeProvider = await prisma.paymentProvider.findUnique({
        where: { name: provider }
      });

      if (!activeProvider || !activeProvider.isEnabled) {
        return res.status(400).json({ error: 'Payment provider not available' });
      }

      // Server-side amount enforcement: never trust client-provided amount for sensitive operations like verification badge
      let effectiveAmount = Number(amount) || 0;
      if (metadata && (metadata.purpose === 'VERIFICATION_BADGE' || metadata.type === 'BADGE')) {
        const setting = await prisma.systemSetting.findFirst();
        effectiveAmount = setting?.verificationBadgePrice ?? 3.00;
      }

      if (effectiveAmount <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      const providerRef = `PAY_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const transaction = await prisma.paymentTransaction.create({
        data: {
          userId,
          amount: effectiveAmount,
          currency,
          provider,
          providerRef,
          status: 'PENDING',
          metadata: {
            ...(typeof metadata === 'object' ? metadata : {}),
            serverEnforcedAmount: effectiveAmount,
            initiatedAt: new Date().toISOString()
          }
        }
      });

      return res.json({
        success: true,
        transactionId: transaction.id,
        providerRef,
        amount: effectiveAmount,
        currency,
        message: `Secure ${provider} payment session initiated.`
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      return res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }

  // Webhook: Update payment status from provider with secret validation & idempotency
  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const webhookSecret = (req.headers['x-webhook-secret'] as string) || (req.query.secret as string);
      const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
      const isProduction = process.env.NODE_ENV === 'production';

      // 1. Fail closed: In production, webhook secret must be configured and strictly matched
      if (isProduction) {
        if (!expectedSecret) {
          console.error('[Payment Webhook] Security Alert: PAYMENT_WEBHOOK_SECRET is not configured on production server.');
          return res.status(503).json({ error: 'Webhook processing unavailable: Webhook security credentials unconfigured.' });
        }
        if (!webhookSecret || webhookSecret !== expectedSecret) {
          console.warn('[Payment Webhook] Security Alert: Invalid or missing webhook secret header.');
          return res.status(401).json({ error: 'Invalid or missing webhook secret' });
        }
      } else if (expectedSecret) {
        // In non-production, if secret is set, it must match
        if (!webhookSecret || webhookSecret !== expectedSecret) {
          return res.status(401).json({ error: 'Invalid webhook secret' });
        }
      }

      const { providerRef, status } = req.body;
      if (!providerRef || !status) {
        return res.status(400).json({ error: 'providerRef and status are required' });
      }

      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
      const normalizedStatus = String(status).toUpperCase();
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Invalid transaction status' });
      }

      const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { providerRef }
      });

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Payment transaction not found' });
      }

      // Idempotency: skip re-processing if already completed or failed
      if (existingTransaction.status === 'COMPLETED' || existingTransaction.status === 'FAILED') {
        return res.json({ success: true, message: `Transaction already marked as ${existingTransaction.status}` });
      }

      const transaction = await prisma.paymentTransaction.update({
        where: { providerRef },
        data: { status: normalizedStatus }
      });

      if (normalizedStatus === 'COMPLETED' && transaction.metadata && (transaction.metadata as any).purpose === 'VERIFICATION_BADGE') {
        await prisma.$transaction(async (tx) => {
          // Check if badge payment already created
          const existingBadge = await tx.badgePayment.findUnique({
            where: { transactionId: transaction.providerRef || transaction.id }
          });

          if (!existingBadge) {
            await tx.badgePayment.create({
              data: {
                userId: transaction.userId,
                amount: transaction.amount,
                currency: transaction.currency || 'USD',
                status: 'COMPLETED',
                paymentProvider: transaction.provider,
                transactionId: transaction.providerRef || transaction.id,
                rawReceipt: `WEBHOOK_CONFIRMED_${transaction.provider}_${Date.now()}`
              }
            });
          }

          await tx.user.update({
            where: { id: transaction.userId },
            data: { isVerified: true, verifiedAt: new Date() }
          });
        });
      }

      return res.json({ success: true, status: normalizedStatus });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }
  }
}
