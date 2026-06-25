import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { getSessionFromRequest } from '@/lib/auth';
import { getDomainsByUser, getDomainRecord, addDomain } from '@/lib/db/domains';

async function getServerIp(): Promise<string> {
  if (process.env.SERVER_IP) return process.env.SERVER_IP;
  try {
    const addrs = await dns.resolve4('aizet.co.kr');
    return addrs[0];
  } catch {
    return '';
  }
}

export const dynamic = 'force-dynamic';

// 허용하는 사이트 슬러그 (현재 운영 중인 사이트 경로)
const VALID_SLUGS = new Set(['demo', 'hancandy', 'korean', 'print', 'tax']);

// 도메인 형식 검사 (간단한 정규식)
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [domains, serverIp] = await Promise.all([
    Promise.resolve(getDomainsByUser(session.sub)),
    getServerIp(),
  ]);
  return NextResponse.json({ domains, serverIp });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { domain, siteSlug } = await req.json() as { domain?: string; siteSlug?: string };

  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: '유효하지 않은 도메인 형식입니다.' }, { status: 400 });
  }
  const normalised = domain.toLowerCase().trim();

  if (siteSlug && !VALID_SLUGS.has(siteSlug)) {
    return NextResponse.json({ error: '유효하지 않은 사이트 슬러그입니다.' }, { status: 400 });
  }

  if (getDomainRecord(normalised)) {
    return NextResponse.json({ error: '이미 등록된 도메인입니다.' }, { status: 409 });
  }

  const record = {
    domain: normalised,
    userId: session.sub,
    siteSlug: siteSlug ?? 'demo',
    status: 'pending' as const,
    sslStatus: 'none' as const,
    createdAt: new Date().toISOString(),
  };
  addDomain(record);

  return NextResponse.json({ domain: record }, { status: 201 });
}
