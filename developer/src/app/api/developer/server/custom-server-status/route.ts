import { NextRequest, NextResponse } from 'next/server';
import { checkCustomServerConnection, DEFAULT_CUSTOM_SERVER_URL } from '../../../../../lib/customServerBridge';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url') || DEFAULT_CUSTOM_SERVER_URL;
  const status = await checkCustomServerConnection(urlParam);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl } = body;
    const status = await checkCustomServerConnection(targetUrl || DEFAULT_CUSTOM_SERVER_URL);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, error: err.message, checkedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
