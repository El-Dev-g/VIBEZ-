import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SupportResponseOptions {
  to: string;
  recipientName?: string;
  ticketId?: string;
  originalSubject?: string;
  originalMessage?: string;
  responseMessage: string;
  agentName?: string;
  agentTitle?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private dynamicRefreshToken: string | null = null;
  private dynamicUserEmail: string | null = null;
  private dynamicAuthorizedAt: Date | null = null;

  public get clientId(): string | undefined {
    return process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  }

  public get clientSecret(): string | undefined {
    return process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
  }

  public get refreshToken(): string | undefined {
    return this.dynamicRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN;
  }

  public setDynamicCredentials(refreshToken: string, userEmail?: string) {
    this.dynamicRefreshToken = refreshToken;
    if (userEmail) this.dynamicUserEmail = userEmail;
    this.dynamicAuthorizedAt = new Date();
  }

  public getGmailStatus(): {
    configured: boolean;
    provider: string | null;
    scope: string;
    authorized: boolean;
    userEmail?: string;
    lastAuthorized?: string;
  } {
    const isConfigured = Boolean(this.clientId && this.clientSecret);
    const hasToken = Boolean(this.refreshToken);
    const isAuthorized = isConfigured && hasToken;

    return {
      configured: isConfigured,
      provider: isAuthorized ? 'gmail_api' : null,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      authorized: isAuthorized,
      userEmail: this.dynamicUserEmail || this.user || 'prigidcollection@gmail.com',
      lastAuthorized: this.dynamicAuthorizedAt ? this.dynamicAuthorizedAt.toISOString() : undefined,
    };
  }

  private get user(): string | undefined {
    return this.dynamicUserEmail || process.env.GMAIL_USER || process.env.EMAIL_USER;
  }

  private get pass(): string | undefined {
    return process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
  }

  private get fromName(): string {
    return process.env.EMAIL_FROM_NAME || 'VIBEZ Support';
  }

  private get fromAddress(): string {
    return this.user || process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  private get appUrl(): string {
    return process.env.BACKEND_URL || 'https://vibez-n5h1.onrender.com';
  }

  /**
   * Send email using Gmail REST API OAuth2 (Port 443 HTTPS - Unblockable on cloud platforms like Render)
   */
  private async sendViaGmailApi(
    options: SendEmailOptions,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Refresh OAuth2 access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return { success: false, error: tokenData.error_description || 'Failed to refresh Gmail OAuth token' };
      }

      const accessToken = tokenData.access_token;

      // 2. Build RFC 2822 email message
      const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject).toString('base64')}?=`;
      const messageParts = [
        `From: "${this.fromName}" <${userEmail}>`,
        `To: ${options.to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        options.html,
      ];
      const rawMessage = messageParts.join('\r\n');
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 3. Send email via Gmail API
      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        return { success: false, error: sendData.error?.message || JSON.stringify(sendData) };
      }

      console.log(`[EmailService] Delivered via Gmail API to ${options.to}:`, sendData.id);
      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] Gmail API error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send email using Resend REST API (Port 443 HTTPS - Unblockable on cloud platforms like Render)
   */
  private async sendViaResend(options: SendEmailOptions, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || JSON.stringify(data) };
      }
      console.log(`[EmailService] Delivered via Resend API to ${options.to}:`, data.id);
      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] Resend API error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send email using SendGrid REST API (Port 443 HTTPS)
   */
  private async sendViaSendGrid(options: SendEmailOptions, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: this.fromAddress, name: this.fromName },
          subject: options.subject,
          content: [
            { type: 'text/html', value: options.html },
            { type: 'text/plain', value: options.text || options.html.replace(/<[^>]*>?/gm, '') }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }
      console.log(`[EmailService] Delivered via SendGrid API to ${options.to}`);
      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] SendGrid API error:', err);
      return { success: false, error: err.message };
    }
  }

  private getTransporter(): nodemailer.Transporter | null {
    if (!this.user || !this.pass) {
      console.warn('[EmailService] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment.');
      return null;
    }

    if (!this.transporter) {
      const isCustomSmtp = Boolean(process.env.SMTP_HOST);
      const cleanPass = this.pass.replace(/\s+/g, '');

      if (isCustomSmtp) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 465,
          secure: (Number(process.env.SMTP_PORT) || 465) === 465,
          auth: {
            user: this.user,
            pass: cleanPass,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 20000,
        });
      } else {
        // Direct Gmail SMTP host configuration (port 465 SSL is more resilient against cloud firewall egress blocks than 587)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // SSL/TLS
          auth: {
            user: this.user,
            pass: cleanPass,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 20000,
        });
      }
    }

    return this.transporter;
  }

  /**
   * Dedicated Gmail REST API test sender - explicitly tests the Gmail API with NO fallback
   */
  async sendTestGmailEmail(recipientEmail: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;
    const refreshToken = this.refreshToken;
    const userEmail = this.user || 'prigidcollection@gmail.com';

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: 'Google OAuth Client ID or Client Secret is not configured on this environment.'
      };
    }

    if (!refreshToken) {
      return {
        success: false,
        error: 'Gmail account is not authorized yet. Please click "Connect Gmail" to authorize VIBEZ Support.'
      };
    }

    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>VIBEZ Gmail API Test</title></head>
      <body style="margin:0;padding:24px;background:#0b0f19;font-family:sans-serif;color:#f1f5f9;">
        <div style="max-width:560px;margin:0 auto;background:#111827;border-radius:14px;border:1px solid #1f2937;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;padding:8px 18px;background:#1e1b4b;border:1px solid #4338ca;border-radius:20px;color:#818cf8;font-size:12px;font-weight:700;letter-spacing:1px;">GMAIL REST API VERIFICATION</div>
          </div>
          <h2 style="color:#ffffff;margin:0 0 12px;font-size:22px;text-align:center;">VIBEZ Support Email Integration Test</h2>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;">
            This is an automated verification test email dispatched directly via the <strong>Gmail REST API (Port 443 HTTPS)</strong> using the authorized <code>https://www.googleapis.com/auth/gmail.send</code> scope.
          </p>
          <div style="background:#1e293b;border-radius:10px;padding:16px;border-left:4px solid #10b981;margin-bottom:24px;">
            <div style="color:#10b981;font-weight:700;font-size:14px;margin-bottom:6px;">✓ End-to-End Status: Active & Healthy</div>
            <div style="color:#cbd5e1;font-size:13px;">Authorized Sender: <strong>${userEmail}</strong></div>
            <div style="color:#cbd5e1;font-size:13px;margin-top:4px;">Dispatched: <strong>${new Date().toUTCString()}</strong></div>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
            VIBEZ Support Team &bull; Customer Success & Experience
          </p>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendViaGmailApi(
      {
        to: recipientEmail,
        subject: `[VIBEZ] Gmail API Integration Test Verification - ${new Date().toISOString().substring(11, 19)}`,
        html: testHtml,
        text: `VIBEZ Gmail API Integration Test Verification. Dispatched via https://www.googleapis.com/auth/gmail.send on ${new Date().toUTCString()}`,
      },
      clientId,
      clientSecret,
      refreshToken,
      userEmail
    );

    if (result.success) {
      return {
        success: true,
        message: `Gmail API test email delivered successfully to ${recipientEmail}`
      };
    } else {
      return {
        success: false,
        error: `Gmail API test failed: ${result.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Generic sender via Gmail OAuth2 REST API, Resend API, SendGrid API, or SMTP
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    // 1. Try Gmail REST API OAuth2 (HTTPS Port 443 - zero SMTP timeouts, works seamlessly on Render)
    const gmailClientId = this.clientId;
    const gmailClientSecret = this.clientSecret;
    const gmailRefreshToken = this.refreshToken;
    const gmailUser = this.user || 'prigidcollection@gmail.com';

    if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
      return await this.sendViaGmailApi(options, gmailClientId, gmailClientSecret, gmailRefreshToken, gmailUser);
    }

    // 2. Try Resend API if key is present (Fastest & unblockable over HTTPS)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      return await this.sendViaResend(options, resendKey);
    }

    // 3. Try SendGrid API if key is present
    const sendGridKey = process.env.SENDGRID_API_KEY;
    if (sendGridKey) {
      return await this.sendViaSendGrid(options, sendGridKey);
    }

    // 4. Fallback to SMTP (Gmail / Custom SMTP)
    const transporter = this.getTransporter();
    if (!transporter) {
      return { success: false, error: 'Email service credentials not configured. Please provide Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN), RESEND_API_KEY, or GMAIL_USER / GMAIL_APP_PASSWORD.' };
    }

    try {
      const sendPromise = transporter.sendMail({
        from: `"${this.fromName}" <${this.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      });

      // 20s strict timeout to prevent hung HTTP requests
      const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timed out after 20 seconds.')), 20000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[EmailService] Email successfully delivered to ${options.to}`);
      return { success: true };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  /**
   * Sends a professional, branded support response email to user inquiries
   */
  async sendSupportResponse(options: SupportResponseOptions): Promise<{ success: boolean; error?: string }> {
    const {
      to,
      recipientName = 'Valued User',
      ticketId = `VBZ-${Date.now().toString(36).toUpperCase()}`,
      originalSubject = 'General Inquiry',
      originalMessage,
      responseMessage,
      agentName = 'VIBEZ Support Team',
      agentTitle = 'Customer Experience & Success',
    } = options;

    const formattedResponse = responseMessage.replace(/\n/g, '<br/>');
    const formattedOriginal = originalMessage ? originalMessage.replace(/\n/g, '<br/>') : '';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Response to your inquiry - VIBEZ</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0b0f19;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #f1f5f9;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table { border-collapse: collapse; }
          .wrapper {
            width: 100%;
            background-color: #0b0f19;
            padding: 40px 10px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #111827;
            border-radius: 16px;
            border: 1px solid #1f2937;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%);
            padding: 36px 30px;
            text-align: center;
          }
          .logo-container {
            display: inline-block;
            text-align: center;
          }
          .logo-icon {
            display: inline-block;
            width: 52px;
            height: 52px;
            line-height: 52px;
            background: #ffffff;
            color: #4f46e5;
            font-size: 28px;
            font-weight: 900;
            border-radius: 14px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
            margin-bottom: 12px;
            text-align: center;
          }
          .logo-text {
            color: #ffffff;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 3px;
            margin: 0;
            text-transform: uppercase;
          }
          .tagline {
            color: rgba(255, 255, 255, 0.85);
            font-size: 13px;
            letter-spacing: 1px;
            margin-top: 4px;
            font-weight: 500;
          }
          .content {
            padding: 36px 30px;
          }
          .ticket-badge {
            display: inline-block;
            background: #1e1b4b;
            color: #818cf8;
            border: 1px solid #3730a3;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 16px;
          }
          .intro-text {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 24px;
          }
          .response-card {
            background: #1e293b;
            border-left: 4px solid #6366f1;
            border-radius: 0 12px 12px 0;
            padding: 22px;
            margin-bottom: 28px;
            color: #f8fafc;
            font-size: 15px;
            line-height: 1.7;
          }
          .response-card strong {
            color: #818cf8;
            display: block;
            margin-bottom: 10px;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .quote-box {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 30px;
          }
          .quote-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .quote-subject {
            font-size: 14px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 6px;
          }
          .quote-content {
            font-size: 13px;
            color: #64748b;
            font-style: italic;
            line-height: 1.5;
          }
          .signature {
            border-top: 1px solid #1f2937;
            padding-top: 20px;
            margin-top: 24px;
          }
          .signature-name {
            color: #f1f5f9;
            font-weight: 700;
            font-size: 15px;
          }
          .signature-title {
            color: #818cf8;
            font-size: 13px;
            margin-top: 2px;
          }
          .action-btn {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            margin: 20px 0 10px 0;
            text-align: center;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
          }
          .social-section {
            background: #0d1322;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #1f2937;
          }
          .social-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 16px;
          }
          .social-links {
            margin: 0 auto;
          }
          .social-btn {
            display: inline-block;
            background: #1e293b;
            border: 1px solid #334155;
            color: #cbd5e1 !important;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            padding: 8px 14px;
            border-radius: 8px;
            margin: 4px 3px;
            transition: all 0.2s ease;
          }
          .footer {
            background: #090d16;
            padding: 24px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            line-height: 1.6;
          }
          .footer a {
            color: #818cf8;
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background: #1f2937;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table class="container" align="center" width="100%" cellpadding="0" cellspacing="0">
            <!-- Header with Logo -->
            <tr>
              <td class="header">
                <div class="logo-container">
                  <div class="logo-icon">V</div>
                  <h1 class="logo-text">VIBEZ</h1>
                  <div class="tagline">Next-Gen Real-Time Communication</div>
                </div>
              </td>
            </tr>

            <!-- Main Body -->
            <tr>
              <td class="content">
                <div class="ticket-badge">TICKET #${ticketId} &bull; SUPPORT UPDATE</div>
                <div class="greeting">Hello ${recipientName},</div>
                <div class="intro-text">
                  Thank you for reaching out to the VIBEZ Customer Support Team. We have reviewed your inquiry and prepared the following resolution for you:
                </div>

                <!-- Support Response Message -->
                <div class="response-card">
                  <strong>Official Support Response</strong>
                  ${formattedResponse}
                </div>

                <!-- Original Message Quote (if provided) -->
                ${originalMessage ? `
                <div class="quote-box">
                  <div class="quote-title">Your Original Message</div>
                  <div class="quote-subject">Subject: ${originalSubject}</div>
                  <div class="quote-content">&ldquo;${formattedOriginal}&rdquo;</div>
                </div>
                ` : ''}

                <div style="text-align: center;">
                  <a href="${this.appUrl}" class="action-btn" target="_blank">Open VIBEZ Hub</a>
                </div>

                <!-- Agent Signature -->
                <div class="signature">
                  <div class="signature-name">${agentName}</div>
                  <div class="signature-title">${agentTitle} &bull; VIBEZ Inc.</div>
                </div>
              </td>
            </tr>

            <!-- Social Media Section -->
            <tr>
              <td class="social-section">
                <div class="social-title">Connect with VIBEZ Community</div>
                <div class="social-links">
                  <a href="https://x.com" class="social-btn" target="_blank">&#120143; Twitter/X</a>
                  <a href="https://discord.com" class="social-btn" target="_blank">&#128172; Discord</a>
                  <a href="https://instagram.com" class="social-btn" target="_blank">&#128248; Instagram</a>
                  <a href="https://github.com" class="social-btn" target="_blank">&#128187; GitHub</a>
                  <a href="https://linkedin.com" class="social-btn" target="_blank">&#128188; LinkedIn</a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer">
                <div>&copy; ${new Date().getFullYear()} VIBEZ Inc. All rights reserved.</div>
                <div style="margin-top: 4px;">
                  San Francisco, CA, USA &bull; <a href="mailto:${this.user || 'support@vibez.chat'}">${this.user || 'support@vibez.chat'}</a>
                </div>
                <div class="divider"></div>
                <div style="font-size: 11px; color: #475569;">
                  You received this email because you initiated a support request with the VIBEZ team. If you require further assistance, simply reply directly to this email.
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const textFallback = `
[VIBEZ Support - Ticket #${ticketId}]

Hello ${recipientName},

Thank you for contacting VIBEZ Customer Support. Here is our response regarding "${originalSubject}":

--------------------------------------------------
${responseMessage}
--------------------------------------------------

${originalMessage ? `\nYour original inquiry:\n"${originalMessage}"\n` : ''}

Best regards,
${agentName}
${agentTitle} - VIBEZ Inc.
${this.appUrl}

Connect with us:
- Twitter/X: https://x.com
- Discord: https://discord.com
- Instagram: https://instagram.com
- GitHub: https://github.com
- LinkedIn: https://linkedin.com
    `.trim();

    return this.sendEmail({
      to,
      subject: `[Ticket #${ticketId}] Re: ${originalSubject}`,
      html,
      text: textFallback,
    });
  }

  /**
   * Sends a styled subscription confirmation email to a new subscriber
   */
  async sendSubscriptionConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 40px 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 2px; }
          .content { padding: 32px 24px; line-height: 1.6; color: #c9d1d9; }
          .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #818cf8; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; margin-top: 24px; text-align: center; }
          .footer { padding: 20px 24px; background: #0d1117; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #21262d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VIBEZ</h1>
          </div>
          <div class="content">
            <span class="badge">LIVE UPDATES ACTIVE</span>
            <h2>You're Subscribed! 🎉</h2>
            <p>Thank you for subscribing to VIBEZ system & product updates.</p>
            <p>You'll now be the first to know when new releases, feature drops, and system status updates become available.</p>
            <p>If you have any questions or feedback, simply reply to this email or visit our status portal.</p>
            <a href="https://vibez-n5h1.onrender.com" class="btn">Visit VIBEZ Hub</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} VIBEZ Inc. All rights reserved.<br>
            You received this email because you subscribed on our platform.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to VIBEZ Updates 🎉',
      html,
    });
  }
}

export const emailService = new EmailService();
