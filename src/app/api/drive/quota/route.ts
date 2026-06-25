import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/drive-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session);
  } catch {
    return NextResponse.json({ error: 'token_refresh_failed' }, { status: 401 });
  }

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Drive API error' }, { status: res.status });
  }

  const { storageQuota } = await res.json() as {
    storageQuota: { limit?: string; usage?: string; usageInDrive?: string };
  };

  return NextResponse.json({
    limit: parseInt(storageQuota.limit ?? '0', 10),
    usage: parseInt(storageQuota.usage ?? '0', 10),
    usageInDrive: parseInt(storageQuota.usageInDrive ?? '0', 10),
  });
}
