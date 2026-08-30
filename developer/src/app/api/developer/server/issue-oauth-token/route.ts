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
      description: 'VIBEZ & PRIGID GROUP OAuth 2.0 & API Key Token Issuer',
      method: 'POST',
      contentType: 'application/json or application/x-www-form-urlencoded',
      supported_grant_types: ['client_credentials', 'api_key', 'authorization_code', 'refresh_token'],
      available_scopes: [
        'openid',
        'profile',
        'email',
        'phone',
        'offline_access',
        'messages:write',
        'messages:read',
        'messages:delete',
        'auth:otp',
        'auth:sessions',
        'calls:signaling',
        'rtc:token',
        'rtc:rooms',
        'status:publish',
        'status:read',
        'system:telemetry',
        'logs:read',
        'quotas:read',
        'webhooks:manage',
        'events:replay'
      ],
      usage_examples: {
        client_credentials: {
          curl: `curl -X POST ${origin}/api/developer/server/issue-oauth-token -H "Content-Type: application/json" -d '{"client_id": "your_client_id", "client_secret": "your_client_secret", "grant_type": "client_credentials", "scope": "openid profile email messages:write"}'`,
        },
        api_key_auth: {
          curl: `curl -X POST ${origin}/api/developer/server/issue-oauth-token -H "Content-Type: application/json" -H "X-API-Key: vbz_live_your_key" -d '{"grant_type": "api_key", "scope": "openid profile email auth:otp calls:signaling"}'`,
        }
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
    const headerApiKey = req.headers.get('x-api-key') || '';
    const authHeader = req.headers.get('authorization') || '';

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

    const {
      client_id,
      client_secret,
      clientId,
      clientSecret,
      api_key,
      apiKey,
      grant_type = 'client_credentials',
      grantType,
      scope = 'openid profile email messages:write auth:otp calls:signaling',
      scopes
    } = body;

    const effectiveGrantType = grant_type || grantType || 'client_credentials';
    const effectiveClientId = client_id || clientId;
    const effectiveClientSecret = client_secret || clientSecret;
    const effectiveApiKey = api_key || apiKey || headerApiKey || (authHeader.startsWith('Bearer vbz_') ? authHeader.replace('Bearer ', '') : '');

    // Normalize scopes to space-separated string
    let scopeString = 'openid profile email messages:write';
    if (Array.isArray(scopes) && scopes.length > 0) {
      scopeString = scopes.join(' ');
    } else if (Array.isArray(scope)) {
      scopeString = scope.join(' ');
    } else if (typeof scope === 'string' && scope.trim()) {
      scopeString = scope.trim();
    }

    // Process Token Issuance for Client Credentials or API Key
    let subjectId = 'vibez_dev_client';
    let signingKey = 'prigid_group_master_secret';

    if (effectiveGrantType === 'client_credentials') {
      if (!effectiveClientId && !effectiveApiKey) {
        return NextResponse.json(
          { 
            error: 'invalid_client', 
            error_description: 'client_id and client_secret (or API Key) are required for token generation with scopes.' 
          },
          { status: 401 }
        );
      }
      subjectId = effectiveClientId || `clt_${effectiveApiKey?.slice(-8) || 'sub'}`;
      signingKey = effectiveClientSecret || effectiveApiKey || signingKey;
    } else if (effectiveGrantType === 'api_key') {
      if (!effectiveApiKey) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'api_key is required for grant_type=api_key' },
          { status: 401 }
        );
      }
      subjectId = `key_${effectiveApiKey.substring(0, 16)}`;
      signingKey = effectiveApiKey;
    } else {
      // Support flexible grant types
      subjectId = effectiveClientId || 'clt_standard';
      signingKey = effectiveClientSecret || 'standard_secret';
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresIn = 7200; // 2 hours
    const expiresAt = issuedAt + expiresIn;

    const payload = {
      iss: 'https://auth.vibez.prigid.com',
      sub: subjectId,
      aud: 'https://api.vibez.prigid.com',
      scope: scopeString,
      scopes: scopeString.split(' ').filter(Boolean),
      iat: issuedAt,
      exp: expiresAt,
      jti: crypto.randomBytes(12).toString('hex'),
    };

    const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', String(signingKey))
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const accessToken = `${headerB64}.${payloadB64}.${signature}`;

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: scopeString,
      scopes: scopeString.split(' ').filter(Boolean),
      subject: subjectId,
      organization: 'PRIGID GROUP Developer Network',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err.message || 'Token issuance failed' },
      { status: 500 }
    );
  }
}
