import { NextRequest, NextResponse } from 'next/server';
import { createSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth';
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

  const sessionId = createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    plan: (state.plan as UserPlan) || 'free',
    industry: state.industry || '',
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
