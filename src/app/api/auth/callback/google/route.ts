import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionFromRequest, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth';
import { upsertUser } from '@/lib/users';
import type { UserPlan } from '@/types/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const loginUrl = (err: string) => `${origin}/login?error=${err}`;

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(loginUrl(error || 'oauth_failed'));
  }

  let state: { callbackUrl: string; industry: string; plan: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
  } catch {
    return NextResponse.redirect(loginUrl('invalid_state'));
  }

  // Code → tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/callback/google`,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (tokens.error) return NextResponse.redirect(loginUrl('token_exchange'));

  // User profile
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json();
  if (!user.id) return NextResponse.redirect(loginUrl('user_info'));

  // Persist user to SQLite (insert on first login, update profile on subsequent logins)
  const record = upsertUser({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    plan: (state.plan as UserPlan) || 'free',
    industry: state.industry || '',
  });

  // select_account 재로그인 시 구글이 refresh_token을 새로 보내지 않으므로 기존 토큰 보존.
  const prevSession = getSessionFromRequest(req);
  const refreshToken = tokens.refresh_token ?? prevSession?.refreshToken ?? null;

  const sessionId = createSession({
    sub: record.id,
    email: record.email,
    name: record.name,
    picture: record.picture,
    accessToken: tokens.access_token,
    refreshToken,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    plan: record.plan,
    industry: record.industry,
  });

  const dest = state.callbackUrl.startsWith('/') ? `${origin}${state.callbackUrl}` : state.callbackUrl;
  const response = NextResponse.redirect(dest);
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}
