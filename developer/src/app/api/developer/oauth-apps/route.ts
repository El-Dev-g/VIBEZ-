import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory persistent store with realistic defaults
let oauthAppsDatabase: any[] = [
  {
    id: 'app_vibez_android',
    name: 'VIBEZ Android Native Client',
    description: 'Official production mobile client for Android devices with biometric sign-in.',
    clientId: 'vibez_client_and_9024f',
    clientSecret: 'vbz_sec_7a819b4c0291e77dfa849201',
    redirectUris: ['com.aistudio.vibez://oauth/callback', 'https://vibez.prigid.com/auth/callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    createdAt: '2026-08-01',
    environment: 'production',
    developerName: 'PRIGID GROUP Mobile Lab',
    websiteUrl: 'https://vibez.prigid.com',
  },
  {
    id: 'app_enterprise_gateway',
    name: 'Enterprise Single Sign-On Gateway',
    description: 'Corporate authentication gateway integrating employee directory and SSO accounts.',
    clientId: 'vibez_client_srv_4412e',
    clientSecret: 'vbz_sec_99a8b1c4e201d44837ff0019',
    redirectUris: ['https://sso.enterprise.com/v1/auth/callback'],
    grantTypes: ['authorization_code', 'client_credentials'],
    scopes: ['openid', 'profile', 'email', 'phone', 'offline_access'],
    createdAt: '2026-08-15',
    environment: 'production',
    developerName: 'Enterprise Security Division',
    websiteUrl: 'https://enterprise.com',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: oauthAppsDatabase,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, redirectUris, grantTypes, scopes, environment = 'production' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Application name is required.' },
        { status: 400 }
      );
    }

    const cleanedScopes = Array.from(new Set(['openid', ...(Array.isArray(scopes) ? scopes : ['profile', 'email'])]));

    const newApp = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      description: description || 'Custom authentication client for VIBEZ Single Sign-On.',
      clientId: `vibez_client_${Math.random().toString(36).substring(2, 10)}`,
      clientSecret: `vbz_sec_${crypto.randomBytes(16).toString('hex')}`,
      redirectUris: Array.isArray(redirectUris) && redirectUris.length > 0
        ? redirectUris
        : ['https://localhost:3000/callback'],
      grantTypes: Array.isArray(grantTypes) && grantTypes.length > 0
        ? grantTypes
        : ['authorization_code', 'refresh_token'],
      scopes: cleanedScopes,
      createdAt: new Date().toISOString().split('T')[0],
      environment: environment === 'sandbox' ? 'sandbox' : 'production',
      developerName: 'PRIGID Verified Developer',
      websiteUrl: Array.isArray(redirectUris) && redirectUris[0] ? redirectUris[0] : 'https://vibez.prigid.com',
    };

    oauthAppsDatabase = [newApp, ...oauthAppsDatabase];

    return NextResponse.json({
      success: true,
      message: 'OAuth 2.0 Client Application created successfully',
      data: newApp,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create OAuth application' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, redirectUris, grantTypes, scopes, environment, regenerateSecret } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'App ID is required for update' }, { status: 400 });
    }

    const appIndex = oauthAppsDatabase.findIndex((a) => a.id === id);
    if (appIndex === -1) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const existing = oauthAppsDatabase[appIndex];
    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      description: description !== undefined ? description : existing.description,
      redirectUris: redirectUris !== undefined ? redirectUris : existing.redirectUris,
      grantTypes: grantTypes !== undefined ? grantTypes : existing.grantTypes,
      scopes: scopes !== undefined ? Array.from(new Set(['openid', ...scopes])) : existing.scopes,
      environment: environment !== undefined ? environment : existing.environment,
      clientSecret: regenerateSecret ? `vbz_sec_${crypto.randomBytes(16).toString('hex')}` : existing.clientSecret,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    oauthAppsDatabase[appIndex] = updated;

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'App ID is required for deletion' }, { status: 400 });
    }

    const beforeCount = oauthAppsDatabase.length;
    oauthAppsDatabase = oauthAppsDatabase.filter((a) => a.id !== id);

    if (oauthAppsDatabase.length === beforeCount) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete' }, { status: 500 });
  }
}
