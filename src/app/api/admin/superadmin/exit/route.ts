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

  const res = NextResponse.json({ ok: true });
  res.cookies.set('impersonate_user_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
