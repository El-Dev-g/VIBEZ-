import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Handle GET requests to provide helpful API documentation and usage guidelines
 * when developers curl or open the endpoint in a browser.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || 'https://vibez-developer.onrender.com';
  return NextResponse.json(
    {
      endpoint: '/api/developer/server/issue-oauth-token',
      description: 'VIBEZ OAuth 2.0 Client Credentials Token Issuer • Powered by PRIGID GROUP',
      method: 'POST',
      contentType: 'application/json',
      supported_grant_types: ['client_credentials'],
      usage_example: {
        curl: `curl -X POST ${origin}/api/developer/server/issue-oauth-token -H "Content-Type: application/json" -d '{"client_id": "your_client_id", "client_secret": "your_client_secret", "grant_type": "client_credentials"}'`,
      },
      status: 'active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const { client_id, client_secret, grant_type = 'client_credentials', scope = 'messages:write rtc:signaling' } = body;

    if (grant_type !== 'client_credentials') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only grant_type=client_credentials is supported for server-to-server apps.' },
        { status: 400 }
      );
    }

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'client_id and client_secret are required.' },
        { status: 401 }
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresIn = 7200; // 2 hours
    const expiresAt = issuedAt + expiresIn;

    const payload = {
      iss: 'https://auth.vibez.prigid.com',
      sub: client_id,
      aud: 'https://api.vibez.prigid.com',
      scope,
      iat: issuedAt,
      exp: expiresAt,
      jti: crypto.randomBytes(12).toString('hex'),
    };

    const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', String(client_secret))
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const accessToken = `${headerB64}.${payloadB64}.${signature}`;

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope,
      organization: 'PRIGID GROUP Developer Network',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err.message || 'Token issuance failed' },
      { status: 500 }
    );
  }
}
