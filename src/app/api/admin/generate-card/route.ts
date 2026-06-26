import { NextRequest, NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { selectedStyle } = await req.json();
  if (!selectedStyle) return NextResponse.json({ error: 'selectedStyle required' }, { status: 400 });

  const cwd      = process.cwd();
  const fontDir  = path.join(cwd, 'data', 'fonts');
  const logoPath = path.join(cwd, 'data', 'logos', session.sub, `${selectedStyle}.jpg`);
  const script   = path.join(cwd, 'scripts', 'gen_card.py');

  const cardData = {
    shopName:  user.shop_name  || '',
    ownerName: user.name       || '',
    phone:     user.phone      || '',
    address:   user.address    || '',
    logoPath,
    fontDir,
  };

  try {
    const png = execFileSync('python3', [script], {
      input:     JSON.stringify(cardData),
      maxBuffer: 20 * 1024 * 1024,
      timeout:   30_000,
    });

    return new Response(png, {
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="business-card.png"`,
        'Cache-Control':       'no-store',
      },
    });
  } catch (e) {
    console.error('[generate-card]', e);
    return NextResponse.json({ error: '명함 생성에 실패했습니다.' }, { status: 500 });
  }
}
