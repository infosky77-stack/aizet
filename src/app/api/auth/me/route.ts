import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import type { PublicSession } from '@/types/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  // Read industry from users table (source of truth) so stale session values don't mask profile changes
  const userRecord = getUser(session.sub);

  const data: PublicSession = {
    sub: session.sub,
    email: session.email,
    name: session.name,
    picture: session.picture,
    plan: session.plan,
    industry: userRecord?.industry ?? session.industry,
    driveConnected: !!session.accessToken,
  };
  return NextResponse.json(data);
}
