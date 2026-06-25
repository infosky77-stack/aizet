import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

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

  // 이미 refresh_token을 보유한 사용자는 'select_account'로 계정 선택만 요청.
  // refresh_token이 없는 최초 가입/재인증 시에만 'consent'로 전체 동의를 받아 토큰을 발급받는다.
  const existingSession = getSessionFromRequest(req);
  const prompt = existingSession?.refreshToken ? 'select_account' : 'consent';

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/callback/google`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt,
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH}?${params}`);
}
