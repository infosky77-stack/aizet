import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, updateProfile, getMenuItems, replaceMenuItems, generateSlug } from '@/lib/users';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const menuItems = getMenuItems(user.id);
  return NextResponse.json({ user, menuItems });
}

export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    shop_name?: string;
    phone?: string;
    address?: string;
    business_hours?: string;
    slug?: string;
    menu_items?: Array<{ name: string; price: number; description?: string }>;
  };

  const shopName = (body.shop_name ?? '').trim();
  const phone = (body.phone ?? '').trim();
  const address = (body.address ?? '').trim();
  const businessHours = (body.business_hours ?? '').trim();

  // slug: 직접 입력이 있으면 그걸 쓰고, 없으면 shop_name 기반 자동 생성
  let slug = (body.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug && shopName) {
    const current = getUser(session.sub);
    slug = generateSlug(shopName, current?.industry ?? '', session.sub);
  }

  // 슬러그 중복 체크 (본인 제외)
  if (slug) {
    const conflict = db.prepare<[string, string]>('SELECT id FROM users WHERE slug = ? AND id != ?').get(slug, session.sub);
    if (conflict) {
      return NextResponse.json({ error: `슬러그 "${slug}"는 이미 사용 중입니다.` }, { status: 409 });
    }
  }

  const updated = updateProfile(session.sub, {
    shop_name: shopName,
    phone,
    address,
    business_hours: businessHours,
    slug: slug || null as unknown as string,
  });

  if (body.menu_items !== undefined) {
    replaceMenuItems(session.sub, body.menu_items);
  }

  const menuItems = getMenuItems(session.sub);
  return NextResponse.json({ user: updated, menuItems });
}
