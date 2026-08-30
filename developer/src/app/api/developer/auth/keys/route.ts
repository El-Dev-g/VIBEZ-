import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { DEFAULT_CUSTOM_SERVER_URL } from '../../../../../lib/customServerBridge';

// In-memory key store with default production & sandbox keys
let keysDatabase: any[] = [
  {
    id: 'key_prod_master',
    name: 'Production Master API Key',
    keyType: 'api_key',
    keyPrefix: 'vbz_live_ko_',
    maskedKey: 'vbz_live_ko_••••••••••••••••••••7a8b',
    rawKey: 'vbz_live_ko_9824fbc001824a77e092471829a7b',
    environment: 'production',
    sdkTarget: 'Kotlin',
    scopes: ['openid', 'profile', 'email', 'messages:write', 'messages:read', 'auth:otp', 'calls:signaling', 'system:telemetry'],
    createdAt: '2026-08-01',
    lastUsedAt: '2 mins ago',
    requestsCount: 142850,
  },
  {
    id: 'key_sandbox_client',
    name: 'Client Credentials Testing Key',
    keyType: 'client_secret',
    keyPrefix: 'vbz_clt_ts_',
    maskedKey: 'vbz_clt_ts_••••••••••••••••••••99c1',
    rawKey: 'vbz_clt_ts_87834190bcae2847ff11048299c1',
    clientId: 'vbz_client_sbx_90248f',
    clientSecret: 'vbz_secret_a1b2c3d4e5f60718293a4b5c6d',
    environment: 'sandbox',
    sdkTarget: 'TypeScript',
    scopes: ['openid', 'profile', 'email', 'phone', 'offline_access', 'messages:write', 'calls:signaling'],
    createdAt: '2026-08-10',
    lastUsedAt: '1 hour ago',
    requestsCount: 4210,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: keysDatabase,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const body = await req.json();
    const { 
      name, 
      keyType = 'api_key', 
      environment = 'sandbox', 
      sdkTarget = 'Kotlin', 
      scopes = ['openid', 'profile', 'email', 'messages:write', 'auth:otp'] 
    } = body;

    // Try communicating with backend server first if reachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const serverRes = await fetch(`${DEFAULT_CUSTOM_SERVER_URL.replace(/\/+$/, '')}/api/developer/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ name, keyType, environment, sdkTarget, scopes }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.data) {
          keysDatabase = [data.data, ...keysDatabase];
          return NextResponse.json(data);
        }
      }
    } catch {
      // Backend offline fallback
    }

    const envPrefix = environment === 'production' ? 'live' : 'test';
    const sdkPrefix = (sdkTarget || 'Universal').toLowerCase().substring(0, 2);
    const keyPrefix = keyType === 'client_secret' ? `vbz_clt_${sdkPrefix}_` : `vbz_${envPrefix}_${sdkPrefix}_`;
    const randomHash = crypto.randomBytes(16).toString('hex');
    const rawKey = `${keyPrefix}${randomHash}`;

    // Clean and validate scopes
    const cleanedScopes = Array.isArray(scopes) && scopes.length > 0
      ? Array.from(new Set(scopes))
      : ['openid', 'profile', 'email', 'messages:write'];

    const newKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name?.trim() || `${environment.toUpperCase()} ${keyType === 'client_secret' ? 'Client Secret' : 'API Key'}`,
      keyType,
      keyPrefix,
      maskedKey: `${keyPrefix}••••••••••••••••••••${randomHash.slice(-4)}`,
      rawKey,
      clientId: keyType === 'client_secret' ? `vbz_client_${Math.random().toString(36).substring(2, 10)}` : undefined,
      clientSecret: keyType === 'client_secret' ? `vbz_secret_${crypto.randomBytes(16).toString('hex')}` : undefined,
      environment,
      sdkTarget,
      scopes: cleanedScopes,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Never',
      requestsCount: 0,
    };

    keysDatabase = [newKey, ...keysDatabase];

    return NextResponse.json({
      success: true,
      message: 'Credential Key created successfully',
      data: newKey,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Key creation failed.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, scopes, environment, sdkTarget, rotateSecret } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Key ID is required for update' }, { status: 400 });
    }

    const keyIndex = keysDatabase.findIndex((k) => k.id === id);
    if (keyIndex === -1) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    const existing = keysDatabase[keyIndex];
    let newRawKey = existing.rawKey;
    let newMaskedKey = existing.maskedKey;
    let newClientSecret = existing.clientSecret;

    if (rotateSecret) {
      const randomHash = crypto.randomBytes(16).toString('hex');
      newRawKey = `${existing.keyPrefix}${randomHash}`;
      newMaskedKey = `${existing.keyPrefix}••••••••••••••••••••${randomHash.slice(-4)}`;
      if (existing.keyType === 'client_secret') {
        newClientSecret = `vbz_secret_${crypto.randomBytes(16).toString('hex')}`;
      }
    }

    const updatedKey = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      scopes: Array.isArray(scopes) && scopes.length > 0 ? Array.from(new Set(scopes)) : existing.scopes,
      environment: environment !== undefined ? environment : existing.environment,
      sdkTarget: sdkTarget !== undefined ? sdkTarget : existing.sdkTarget,
      rawKey: newRawKey,
      maskedKey: newMaskedKey,
      clientSecret: newClientSecret,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    keysDatabase[keyIndex] = updatedKey;

    return NextResponse.json({
      success: true,
      message: 'Key credentials updated successfully',
      data: updatedKey,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Key ID is required for deletion' }, { status: 400 });
    }

    const beforeCount = keysDatabase.length;
    keysDatabase = keysDatabase.filter((k) => k.id !== id);

    if (keysDatabase.length === beforeCount) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Key revoked and deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete key' }, { status: 500 });
  }
}
