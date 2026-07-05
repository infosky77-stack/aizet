// 내 홈페이지(사업장) 목록 조회 — READ 전용 API.
//
// 데이터 읽기 경계: 세션에서 memberId(session.sub)를 얻어 명부(registry)에서
// listSitesForMember로 목록만 읽어 JSON으로 넘긴다(쓰기·수정 없음). 인증은 기존
// getSessionFromRequest를 그대로 재사용한다(새 인증 로직 없음). registry 읽기 실패는
// 방어적으로 빈 배열로 폴백해 화면이 정상 빈 상태를 그리게 한다.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listSitesForMember, type MemberSite } from '@/lib/registry/registryDb';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  let sites: MemberSite[] = [];
  try {
    sites = listSitesForMember(session.sub);
  } catch (e) {
    console.error('[/api/sites] listSitesForMember 실패 — 빈 목록으로 폴백:', e);
    sites = [];
  }
  return NextResponse.json(sites);
}
