import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const caller = getUser(session.sub);
  if (!caller || caller.is_super_admin !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = (db.prepare(`
    SELECT id, email, name, picture, shop_name, industry, slug, plan, created_at
    FROM users
    WHERE slug IS NOT NULL AND slug != ''
    ORDER BY created_at DESC
  `).all()) as Array<{
    id: string; email: string; name: string; picture: string;
    shop_name: string; industry: string; slug: string;
    plan: string; created_at: number;
  }>;

  return NextResponse.json({ users: rows });
}
