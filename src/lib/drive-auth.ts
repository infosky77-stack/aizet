import { updateSession } from '@/lib/auth';
import type { SessionData } from '@/types/auth';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // 만료 5분 전에 갱신

export async function getValidAccessToken(session: SessionData): Promise<string> {
  if (Date.now() + REFRESH_MARGIN_MS < session.expiresAt) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    throw new Error('no_refresh_token');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const newAccessToken = data.access_token as string;
  const newExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  updateSession(session.id, { accessToken: newAccessToken, expiresAt: newExpiresAt });

  return newAccessToken;
}
