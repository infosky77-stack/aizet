import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TTL_MS = 15 * 60 * 1000; // 15분

export interface MobileToken {
  orderId: string;
  userId: string;
  exp: number;
}

// 서버 메모리 토큰 스토어 (프로세스 공유)
export const tokenStore = new Map<string, MobileToken>();

// 만료 토큰 정리 (호출마다 GC)
function gc() {
  const now = Date.now();
  for (const [k, v] of tokenStore) {
    if (v.exp < now) tokenStore.delete(k);
  }
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId } = await req.json() as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  gc();

  const token = randomBytes(16).toString('hex');
  tokenStore.set(token, { orderId, userId: session.sub, exp: Date.now() + TTL_MS });

  const origin = req.headers.get('origin') ?? req.headers.get('x-forwarded-proto')
    ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}`
    : 'http://localhost:3000';

  const uploadUrl = `${origin}/se-upload/${token}`;
  const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
    width: 256,
    margin: 2,
    color: { dark: '#1c1917', light: '#ffffff' },
  });

  return NextResponse.json({ token, uploadUrl, qrDataUrl });
}
