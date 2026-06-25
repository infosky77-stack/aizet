import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDomainRecord, removeDomain } from '@/lib/db/domains';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { domain } = await params;
  const record = getDomainRecord(domain);

  if (!record) return NextResponse.json({ error: '도메인을 찾을 수 없습니다.' }, { status: 404 });
  if (record.userId !== session.sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  removeDomain(domain);
  return NextResponse.json({ ok: true });
}
