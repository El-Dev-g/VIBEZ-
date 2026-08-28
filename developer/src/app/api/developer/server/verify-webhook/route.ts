import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, payload, signature, timestamp } = body;

    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Webhook signing secret is required' },
        { status: 400 }
      );
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Construct signed content with optional timestamp
    const contentToSign = timestamp ? `${timestamp}.${payloadString}` : payloadString;
    
    // Compute HMAC-SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(contentToSign)
      .digest('hex');

    const expectedHeader = `t=${timestamp || Math.floor(Date.now() / 1000)},v1=${computedSignature}`;
    
    let isValid = false;
    if (signature) {
      // If signature is provided as v1=... or raw hex
      const cleanSig = signature.includes('v1=') 
        ? signature.split('v1=')[1].split(',')[0].trim() 
        : signature.trim();

      try {
        const sigBuffer = Buffer.from(cleanSig, 'hex');
        const computedBuffer = Buffer.from(computedSignature, 'hex');
        
        if (sigBuffer.length === computedBuffer.length) {
          isValid = crypto.timingSafeEqual(sigBuffer, computedBuffer);
        }
      } catch {
        isValid = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid,
        computedSignature,
        formattedHeader: expectedHeader,
        algorithm: 'HMAC-SHA256',
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        payloadLength: Buffer.byteLength(payloadString, 'utf8'),
        verifiedAt: new Date().toISOString(),
        poweredBy: 'PRIGID GROUP VIBEZ Developer Engine',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
