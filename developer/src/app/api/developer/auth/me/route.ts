import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../../lib/jwt';
import { DEFAULT_CUSTOM_SERVER_URL } from '../../../../../lib/customServerBridge';

const JWT_SECRET = process.env.JWT_SECRET || 'vibez_secret_jwt_key_2024';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Token required.' }, { status: 401 });
    }

    // Try communicating with backend server first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const serverRes = await fetch(`${DEFAULT_CUSTOM_SERVER_URL.replace(/\/+$/, '')}/api/developer/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
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

    // Fallback: Verify JWT
    try {
      const decoded: any = verifyJwt(token, JWT_SECRET);
      if (!decoded || !decoded.id) {
        return NextResponse.json({ success: false, error: 'Invalid or expired session token.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: decoded.id,
          name: decoded.name || 'Developer',
          email: decoded.email,
          organization: 'PRIGID Developer Org',
          role: decoded.role || 'Developer',
          tier: decoded.tier || 'ENTERPRISE',
          primarySdk: 'Kotlin',
          monthlyLimit: 10000000,
          currentRequests: 0,
          createdAt: new Date().toISOString().split('T')[0],
          hasCompletedOnboarding: true,
        }
      });
    } catch (jwtErr) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session token.' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Profile fetch failed.' }, { status: 500 });
  }
}
