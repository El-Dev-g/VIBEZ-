import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, role = 'publisher', ttlSeconds = 3600 } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'roomId and userId are required to issue a WebRTC signaling token.' },
        { status: 400 }
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (ttlSeconds || 3600);
    const tokenPayload = {
      sub: userId,
      room: roomId,
      role,
      iat: issuedAt,
      exp: expiresAt,
      nonce: crypto.randomBytes(8).toString('hex'),
    };

    const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const secret = process.env.VIBEZ_RTC_SECRET || 'vbz_sec_signaling_production_k8s_9921';
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const token = `${headerB64}.${payloadB64}.${signature}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        roomId,
        userId,
        role,
        expiresAt,
        iceServers: [
          { urls: 'stun:stun.vibez.prigid.com:3478' },
          {
            urls: 'turn:turn.vibez.prigid.com:3478?transport=udp',
            username: `user_${userId}`,
            credential: crypto.randomBytes(12).toString('hex'),
          },
          {
            urls: 'turns:turn.vibez.prigid.com:5349?transport=tcp',
            username: `user_${userId}`,
            credential: crypto.randomBytes(12).toString('hex'),
          }
        ],
        websocketSignalingUrl: `wss://api.vibez.prigid.com/v1/rtc/signal?token=${token}`,
        poweredBy: 'PRIGID GROUP VIBEZ Developer Engine',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Token generation failed' },
      { status: 500 }
    );
  }
}
