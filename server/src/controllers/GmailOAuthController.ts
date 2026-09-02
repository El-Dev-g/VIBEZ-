import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { emailService } from '../lib/email';

interface OAuthStateItem {
  state: string;
  adminId: string;
  adminEmail: string;
  expiresAt: number;
}

// In-memory state store with short expiration and single-use validation
const oauthStateStore = new Map<string, OAuthStateItem>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of oauthStateStore.entries()) {
    if (item.expiresAt < now) {
      oauthStateStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class GmailOAuthController {
  private isDemoEnabled(): boolean {
    return process.env.GMAIL_OAUTH_DEMO_ENABLED !== 'false';
  }

  private getAdminFrontendUrl(req?: Request): string {
    if (req) {
      const host = req.get('host') || '';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      
      // If we are on our preview/dev environments or localhost, we route with the /admin path prefix on the same host!
      if (host.includes('run.app') || host.includes('localhost') || host.includes('gitpod') || host.includes('github') || !process.env.ADMIN_FRONTEND_URL) {
        return `${protocol}://${host}/admin`;
      }
    }
    const raw = process.env.ADMIN_FRONTEND_URL || 'https://vibez-admin.onrender.com';
    return raw.replace(/\/$/, '');
  }

  private getRedirectUri(req: Request): string {
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    const host = req.get('host') || 'vibez-n5h1.onrender.com';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}/api/admin/gmail-oauth/callback`;
  }

  /**
   * GET /api/admin/gmail-oauth/start
   * Generates secure CSRF state and returns/redirects to Google's OAuth2 authorization URL
   */
  async startOAuth(req: Request, res: Response) {
    if (!this.isDemoEnabled()) {
      return res.status(404).json({ error: 'Not Found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const clientId = emailService.clientId;
    const clientSecret = emailService.clientSecret;

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: 'Gmail OAuth is not configured on this environment. Missing Google OAuth credentials.'
      });
    }

    // 1. Generate cryptographically secure random state
    const state = crypto.randomBytes(32).toString('hex');
    const adminUser = (req as any).admin || (req as any).user || {};

    // 2. Store state server-side with 10-minute expiration (single use)
    oauthStateStore.set(state, {
      state,
      adminId: adminUser.id || 'admin',
      adminEmail: adminUser.email || 'admin@vibez.com',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const redirectUri = this.getRedirectUri(req);
    const scope = 'https://www.googleapis.com/auth/gmail.send';

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
      return res.json({ url: authUrl.toString(), redirectUri });
    }

    return res.redirect(authUrl.toString());
  }

  /**
   * GET /api/admin/gmail-oauth/callback
   * Receives Google authorization code, validates state, exchanges code for refresh token server-side
   */
  async handleCallback(req: Request, res: Response) {
    if (!this.isDemoEnabled()) {
      return res.status(404).json({ error: 'Not Found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const adminFrontendUrl = this.getAdminFrontendUrl(req);

    const { code, state, error, error_description } = req.query;

    // Handle user or Google error / access denial
    if (error) {
      const errMsg = (error_description as string) || (error as string) || 'Access was denied by Google.';
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent(errMsg)}`);
    }

    if (!code || !state) {
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent('Missing authorization code or state parameter.')}`);
    }

    const stateStr = String(state);
    const storedState = oauthStateStore.get(stateStr);

    // Validate state (CSRF / Replay protection)
    if (!storedState) {
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent('Invalid or already used OAuth state. Please start again.')}`);
    }

    if (storedState.expiresAt < Date.now()) {
      oauthStateStore.delete(stateStr);
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent('OAuth authorization session expired. Please start again.')}`);
    }

    // Delete state immediately after single-use validation
    oauthStateStore.delete(stateStr);

    const clientId = emailService.clientId;
    const clientSecret = emailService.clientSecret;
    const redirectUri = this.getRedirectUri(req);

    if (!clientId || !clientSecret) {
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent('Google client credentials are not configured on server.')}`);
    }

    try {
      // Exchange code for tokens server-side
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error('[GmailOAuth] Token exchange failed:', tokenData.error_description || tokenData.error);
        return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent(tokenData.error_description || 'Token exchange failed.')}`);
      }

      const refreshToken = tokenData.refresh_token;
      const accessToken = tokenData.access_token;

      // Obtain authorized email address safely if access token is available
      let authorizedEmail = 'prigidcollection@gmail.com';
      if (accessToken) {
        try {
          const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.emailAddress) {
              authorizedEmail = profileData.emailAddress;
            }
          }
        } catch (e) {
          console.warn('[GmailOAuth] Could not fetch profile email address:', e);
        }
      }

      if (refreshToken) {
        emailService.setDynamicCredentials(refreshToken, authorizedEmail);
      } else if (accessToken) {
        // In case Google did not return a new refresh token (already previously granted), update user email
        emailService.setDynamicCredentials(emailService.refreshToken || '', authorizedEmail);
      }

      // Record in audit log
      try {
        await prisma.auditLog.create({
          data: {
            adminEmail: storedState.adminEmail || 'admin',
            action: 'GMAIL_OAUTH_AUTHORIZED',
            target: `Gmail Account: ${authorizedEmail} (gmail.send scope)`,
          },
        });
      } catch (logErr) {
        console.warn('[GmailOAuth] Failed to write audit log:', logErr);
      }

      // Redirect cleanly to admin dashboard with safe status (NO secrets in query params)
      return res.redirect(`${adminFrontendUrl}/integrations?status=connected&email=${encodeURIComponent(authorizedEmail)}`);
    } catch (err: any) {
      console.error('[GmailOAuth] Callback error:', err);
      return res.redirect(`${adminFrontendUrl}/integrations?status=error&message=${encodeURIComponent('An unexpected error occurred during Google authorization.')}`);
    }
  }

  /**
   * GET /api/admin/gmail-oauth/status
   * Safe provider diagnostics for authorized administrators
   */
  async getStatus(req: Request, res: Response) {
    if (!this.isDemoEnabled()) {
      return res.status(404).json({ error: 'Not Found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const status = emailService.getGmailStatus();
    
    // Perform a real health check if configured
    let health = { ok: status.configured, message: status.configured ? 'Configured' : 'Not configured' };
    
    if (status.configured && emailService.refreshToken) {
      try {
        // Try to get a fresh access token to verify the refresh token is still valid
        const clientId = emailService.clientId;
        const clientSecret = emailService.clientSecret;
        
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId || '',
            client_secret: clientSecret || '',
            refresh_token: emailService.refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        
        const data = await tokenRes.json();
        if (!tokenRes.ok) {
          health = { 
            ok: false, 
            message: data.error_description || data.error || 'Token invalid or expired' 
          };
        } else {
          health = { ok: true, message: 'Token is valid and active' };
        }
      } catch (e: any) {
        health = { ok: false, message: e.message || 'Connectivity issue during health check' };
      }
    }

    return res.json({ ...status, health });
  }

  /**
   * POST /api/admin/gmail-oauth/test-send
   * Dispatches a test email exclusively through the Gmail REST API
   */
  async testSend(req: Request, res: Response) {
    if (!this.isDemoEnabled()) {
      return res.status(404).json({ error: 'Not Found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { recipientEmail } = req.body;

    if (!recipientEmail || !recipientEmail.trim() || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' });
    }

    try {
      const result = await emailService.sendTestGmailEmail(recipientEmail.trim());

      if (result.success) {
        try {
          const adminEmail = (req as any).admin?.email || (req as any).user?.email || 'admin';
          await prisma.auditLog.create({
            data: {
              adminEmail,
              action: 'GMAIL_API_TEST_SEND',
              target: `Recipient: ${recipientEmail.trim()}`,
            },
          });
        } catch (logErr) {}

        return res.json({
          success: true,
          message: 'Gmail API test email sent successfully!',
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Gmail API test failed.',
        });
      }
    } catch (error: any) {
      console.error('[GmailOAuth] Test send error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to dispatch test email.',
      });
    }
  }

  /**
   * POST /api/admin/gmail-oauth/disconnect
   * Clears OAuth credentials to disconnect/uninstall the integration
   */
  async disconnectOAuth(req: Request, res: Response) {
    if (!this.isDemoEnabled()) {
      return res.status(404).json({ error: 'Not Found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    try {
      const currentToken = emailService.refreshToken;
      
      // If we have an active refresh token, send an HTTP POST request to Google's OAuth2 /revoke endpoint
      // This immediately revokes the token and unlinks/uninstalls the service globally!
      if (currentToken) {
        try {
          console.log('[GmailOAuth] Revoking token on Google servers...');
          await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token: currentToken }),
          });
          console.log('[GmailOAuth] Successfully revoked Google token.');
        } catch (revokeErr: any) {
          console.warn('[GmailOAuth] Could not automatically revoke token on Google servers (it may have already been expired or revoked):', revokeErr.message || revokeErr);
        }
      }

      emailService.clearDynamicCredentials();

      const adminEmail = (req as any).admin?.email || (req as any).user?.email || 'admin';
      try {
        await prisma.auditLog.create({
          data: {
            adminEmail,
            action: 'GMAIL_OAUTH_DISCONNECTED',
            target: 'Gmail Support Delivery Integration',
          },
        });
      } catch (logErr) {}

      return res.json({
        success: true,
        message: 'Gmail Support Delivery integration disconnected and Google authorization unlinked successfully.',
      });
    } catch (error: any) {
      console.error('[GmailOAuth] Disconnect error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to disconnect integration.',
      });
    }
  }
}
