// 홈페이지 컨텍스트 확정 API — siteId → 그 홈페이지 전용 컨텍스트(READ 전용).
//
// 보안 핵심: 소유자 검증은 반드시 서버에서 "세션의 memberId"로 한다(클라이언트가 보낸
// 값을 신뢰하지 않는다). getSiteContext가 소유자 아니면 null을 주므로, 남의 siteId를
// URL로 직접 쳐도 404로 차단된다. 인증은 기존 getSessionFromRequest 재사용.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSiteContext } from '@/lib/registry/siteContext';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  const { siteId } = await params;

  let ctx = null;
  try {
    ctx = getSiteContext(siteId, session.sub); // 소유자 검증은 세션 memberId로
  } catch (e) {
    console.error('[/api/sites/[siteId]] getSiteContext 실패:', e);
    ctx = null;
  }

  // 소유자 아님 / 없는 siteId → 접근 거부(404). 남의 컨텍스트를 열지 않는다.
  if (!ctx) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(ctx);
}
