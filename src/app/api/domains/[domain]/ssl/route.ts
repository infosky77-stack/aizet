import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDomainRecord, updateDomain } from '@/lib/db/domains';

export const dynamic = 'force-dynamic';

const AZOS_URL   = process.env.AZOS_URL   ?? 'http://localhost:8080';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@aizet.co.kr';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { domain } = await params;
  const record = getDomainRecord(domain);
  if (!record) return NextResponse.json({ error: '도메인을 찾을 수 없습니다.' }, { status: 404 });
  if (record.userId !== session.sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (record.status !== 'dns_ok' && record.status !== 'active') {
    return NextResponse.json(
      { error: 'DNS 확인이 먼저 완료되어야 합니다.' },
      { status: 422 },
    );
  }

  if (record.sslStatus === 'issuing') {
    return NextResponse.json({ error: 'SSL 발급이 이미 진행 중입니다.', sslTaskId: record.sslTaskId }, { status: 409 });
  }

  // AZOS에 SSL 발급 태스크 제출
  let taskId: string | null = null;
  try {
    const taskRes = await fetch(`${AZOS_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'issue-ssl',
        payload: { domain, email: ADMIN_EMAIL },
        priority: 100,
      }),
    });
    const task = await taskRes.json() as { id?: string };
    taskId = task.id ?? null;
  } catch {
    // AZOS 미연결 시 태스크 없이 issuing 상태로만 전환
  }

  updateDomain(domain, { sslStatus: 'issuing', sslTaskId: taskId ?? undefined, errorMsg: undefined });

  return NextResponse.json({ ok: true, sslTaskId: taskId });
}

// AZOS 또는 외부 훅에서 SSL 발급 결과를 콜백으로 받는 엔드포인트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  // 내부 호출 전용 — AZOS_SECRET 설정 시 헤더 검증, 미설정 시 로컬호스트만 허용
  const configuredSecret = process.env.AZOS_SECRET;
  if (configuredSecret) {
    if (req.headers.get('x-azos-secret') !== configuredSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    const forwarded = req.headers.get('x-forwarded-for') ?? '';
    const isLocal = !forwarded || forwarded.startsWith('127.') || forwarded.startsWith('::1');
    if (!isLocal) {
      return NextResponse.json({ error: 'Forbidden — set AZOS_SECRET in env' }, { status: 403 });
    }
  }

  const { domain } = await params;
  if (!getDomainRecord(domain)) {
    return NextResponse.json({ error: '도메인을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { success, sslExpiresAt, errorMsg } = await req.json() as {
    success: boolean;
    sslExpiresAt?: string;
    errorMsg?: string;
  };

  if (success) {
    updateDomain(domain, {
      status:       'active',
      sslStatus:    'active',
      sslExpiresAt: sslExpiresAt ?? undefined,
      errorMsg:     undefined,
    });
  } else {
    updateDomain(domain, {
      sslStatus: 'error',
      errorMsg:  errorMsg ?? 'SSL 발급 실패',
    });
  }

  return NextResponse.json({ ok: true });
}
