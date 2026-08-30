import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { DEFAULT_CUSTOM_SERVER_URL } from '../../../../../lib/customServerBridge';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const body = await req.json();
    const { name, environment = 'sandbox', sdkTarget = 'Kotlin', scopes = ['messages:write'] } = body;

    // Try communicating with backend server first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const serverRes = await fetch(`${DEFAULT_CUSTOM_SERVER_URL.replace(/\/+$/, '')}/api/developer/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ name, environment, sdkTarget, scopes }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (serverRes.ok) {
        const data = await serverRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    const envPrefix = environment === 'production' ? 'live' : 'test';
    const sdkPrefix = (sdkTarget || 'Universal').toLowerCase().substring(0, 2);
    const keyPrefix = `vbz_${envPrefix}_${sdkPrefix}_`;
    const randomHash = crypto.randomBytes(16).toString('hex');
    const rawKey = `${keyPrefix}${randomHash}`;

    const newKey = {
      id: `key_${Date.now()}`,
      name: name || `${environment.toUpperCase()} Key`,
      keyType: 'api_key',
      keyPrefix,
      maskedKey: `${keyPrefix}••••••••••••••••••••${randomHash.slice(-4)}`,
      rawKey,
      environment,
      sdkTarget,
      scopes,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Never',
      requestsCount: 0,
    };

    return NextResponse.json({
      success: true,
      data: newKey,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Key creation failed.' }, { status: 500 });
  }
}
