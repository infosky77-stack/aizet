import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { getSessionFromRequest } from '@/lib/auth';
import { getDomainRecord, updateDomain } from '@/lib/db/domains';

export const dynamic = 'force-dynamic';

async function getServerIp(): Promise<string> {
  // 환경변수 우선, 없으면 aizet.co.kr A레코드로 자동 감지
  if (process.env.SERVER_IP) return process.env.SERVER_IP;
  try {
    const addrs = await dns.resolve4('aizet.co.kr');
    return addrs[0];
  } catch {
    return '';
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { domain } = await params;
  const record = getDomainRecord(domain);
  if (!record) return NextResponse.json({ error: '도메인을 찾을 수 없습니다.' }, { status: 404 });
  if (record.userId !== session.sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let addrs: string[] = [];
  try {
    addrs = await dns.resolve4(domain);
  } catch {
    return NextResponse.json({
      ok: false,
      reason: 'DNS 조회 실패 — 도메인이 존재하지 않거나 A레코드가 없습니다.',
      addrs: [],
    });
  }

  const serverIp = await getServerIp();
  const matched = serverIp ? addrs.includes(serverIp) : false;

  if (matched) {
    updateDomain(domain, { status: 'dns_ok', verifiedAt: new Date().toISOString(), errorMsg: undefined });
    return NextResponse.json({ ok: true, addrs, serverIp });
  }

  return NextResponse.json({
    ok: false,
    reason: `A레코드(${addrs.join(', ')})가 AIZET 서버(${serverIp || '확인불가'})를 가리키지 않습니다.`,
    addrs,
    serverIp,
  });
}
