import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Drive API error', status: res.status }, { status: res.status });
  }

  const { storageQuota } = await res.json();
  return NextResponse.json({
    limit: parseInt(storageQuota.limit ?? '0', 10),
    usage: parseInt(storageQuota.usage ?? '0', 10),
    usageInDrive: parseInt(storageQuota.usageInDrive ?? '0', 10),
  });
}
