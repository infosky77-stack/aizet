import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const caller = getUser(session.sub);
  if (!caller || caller.is_super_admin !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { targetUserId } = await req.json() as { targetUserId?: string };
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });

  const target = getUser(targetUserId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('impersonate_user_id', targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1시간
  });
  return res;
}
