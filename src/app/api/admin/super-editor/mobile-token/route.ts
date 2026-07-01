import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { getSessionFromRequest } from '@/lib/auth';
import { saveToken } from '@/lib/mobile-upload-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId } = await req.json() as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const token = randomBytes(16).toString('hex');
  saveToken(token, { orderId, userId: session.sub });

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host  = req.headers.get('host') ?? 'localhost:3000';
  const uploadUrl = `${proto}://${host}/se-upload/${token}`;

  const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
    width: 256,
    margin: 2,
    color: { dark: '#1c1917', light: '#ffffff' },
  });

  return NextResponse.json({ token, uploadUrl, qrDataUrl });
}
