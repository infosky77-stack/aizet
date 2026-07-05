// 사업장 DB 연결 창구(뼈대) — 아직 실제 연결은 붙이지 않고, "여기에 연결이 붙는다"는
// seam만 세운다. 경로 계산은 tenancy/types의 순수 함수(sitePath)를 재사용한다.
//
// 확정 구조: 회원 → 사업장(각 독립 DB, siteId로 식별) → 명부 묶음관리. 같은 업종 사업장
// 여러 개(학원 5개)는 서로 다른 siteId·같은 industry로 표현된다(industry는 분류·그룹핑 축).
//
// 원칙: 기존 공통 DB(src/lib/db.ts = 명부+계정, aizet.db)는 무수정 유지. 사업장별 DB는
// 오직 이 창구를 통해서만 열도록 하여, 연결 지점을 한 곳에 모은다(다음 단계에서 구현).

import { sitePath, type IndustryKind, type SiteDbRef } from './types';

/** 열린 사업장 DB 핸들(개념) — 실제 연결 객체는 다음 단계에서 이 형태에 얹는다 */
export interface SiteDbHandle {
  path: string;
  siteId: string;
  industry: IndustryKind;
  userId: string;
}

/**
 * 회원·사업장(siteId) → 사업장 DB 참조(경로 계산만). 파일이 없어도 ref는 만들어진다.
 * industry는 분류용으로 함께 담는다. 실제 better-sqlite3 연결은 아직 하지 않는다 — 아래 seam 참고.
 */
export function resolveSiteDb(userId: string, siteId: string, industry: IndustryKind): SiteDbRef {
  return { userId, siteId, industry, dbPath: sitePath(userId, siteId) };
}

// ── 연결 seam(다음 단계) ─────────────────────────────────────────────────────
// TODO(사업장 DB 연결): 여기에 실제 연결이 붙는다.
//   export function openSiteDb(userId, siteId, industry): SiteDbHandle {
//     const ref = resolveSiteDb(userId, siteId, industry);
//     // fs.mkdirSync(dirname(ref.dbPath), { recursive: true });
//     // const db = new Database(ref.dbPath);  // WAL·스키마 부트스트랩
//     // return { path: ref.dbPath, siteId, industry, userId /*, db */ };
//   }
// 기존 src/lib/db.ts(공통 명부+계정)는 절대 수정하지 않는다 — 사업장 DB는 이 창구 전용.
