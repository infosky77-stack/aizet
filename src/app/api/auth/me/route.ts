import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import type { PublicSession } from '@/types/auth';
import type { UserPlan } from '@/types/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  // Read live profile from users table (source of truth)
  const userRecord = getUser(session.sub);
  const isSuperAdmin = (userRecord?.is_super_admin ?? 0) === 1;

  // Impersonation: only honoured when caller is super_admin
  const impersonateId = isSuperAdmin
    ? req.cookies.get('impersonate_user_id')?.value ?? null
    : null;

  let industry    = userRecord?.industry    ?? session.industry;
  let name        = userRecord?.name        ?? session.name;
  let picture     = userRecord?.picture     ?? session.picture;
  let plan        = (userRecord?.plan       ?? session.plan) as UserPlan;
  let isImpersonating = false;

  if (impersonateId) {
    const target = getUser(impersonateId);
    if (target) {
      industry        = target.industry;
      name            = target.name;
      picture         = target.picture;
      plan            = target.plan as UserPlan;
      isImpersonating = true;
    }
  }

  const data: PublicSession = {
    sub:             session.sub,
    email:           session.email,
    name,
    picture,
    plan,
    industry,
    driveConnected:  !!session.accessToken,
    isSuperAdmin,
    isImpersonating,
  };
  return NextResponse.json(data);
}
