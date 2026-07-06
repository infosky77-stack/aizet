import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { getSessionFromRequest } from '@/lib/auth';
import { saveToken } from '@/lib/mobile-upload-store';
import { getSiteContext } from '@/lib/registry/siteContext';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId, siteId } = await req.json() as { orderId?: string; siteId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  // siteId가 넘어오면 발급 단계에서 소유 검증을 끝내고, 성공한 경우에만 토큰에 각인한다.
  // 이렇게 하면 세션이 없는 모바일 업로드 시점에는 토큰의 siteId를 신뢰할 수 있다(잘못된
  // siteId 토큰 자체를 만들지 않음). siteId가 없으면 siteId 없는 토큰을 발급(하위호환).
  let siteIdToStore: string | undefined;
  if (siteId) {
    const ctx = getSiteContext(siteId, session.sub);
    if (!ctx) return NextResponse.json({ error: 'Forbidden: not site owner' }, { status: 403 });
    siteIdToStore = ctx.siteId;
  }

  const token = randomBytes(16).toString('hex');
  saveToken(token, { orderId, userId: session.sub, siteId: siteIdToStore });

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
