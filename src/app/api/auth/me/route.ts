import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import type { PublicSession } from '@/types/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const data: PublicSession = {
    sub: session.sub,
    email: session.email,
    name: session.name,
    picture: session.picture,
    plan: session.plan,
    industry: session.industry,
    driveConnected: !!session.accessToken,
  };
  return NextResponse.json(data);
}
