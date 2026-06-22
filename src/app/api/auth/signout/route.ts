import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, deleteSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (session) deleteSession(session.id);

  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(origin + '/');
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
