import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth가 설정되지 않았습니다. .env.local에 GOOGLE_CLIENT_ID를 추가하세요.' },
      { status: 503 }
    );
  }

  const { searchParams } = req.nextUrl;
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';
  const industry = searchParams.get('industry') || '';
  const plan = searchParams.get('plan') || 'free';

  const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const state = Buffer.from(JSON.stringify({ callbackUrl, industry, plan })).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/callback/google`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH}?${params}`);
}
