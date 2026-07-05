// 업종 DB 연결 창구(뼈대) — 아직 실제 연결은 붙이지 않고, "여기에 연결이 붙는다"는
// seam만 세운다. 경로 계산은 tenancy/types의 순수 함수를 재사용한다.
//
// 원칙: 기존 공통 DB(src/lib/db.ts = 명부+계정, aizet.db)는 무수정 유지. 업종별 DB는
// 오직 이 창구를 통해서만 열도록 하여, 연결 지점을 한 곳에 모은다(다음 단계에서 구현).

import { industryDbPath, type IndustryKind, type IndustryDbRef } from './types';

/** 열린 업종 DB 핸들(개념) — 실제 연결 객체는 다음 단계에서 이 형태에 얹는다 */
export interface IndustryDbHandle {
  path: string;
  industry: IndustryKind;
  userId: string;
}

/**
 * 회원·업종 → 업종 DB 참조(경로 계산만). 파일이 없어도 ref는 만들어진다.
 * 실제 better-sqlite3 연결은 아직 하지 않는다 — 아래 seam 참고.
 */
export function resolveIndustryDb(userId: string, industry: IndustryKind): IndustryDbRef {
  return { userId, industry, dbPath: industryDbPath(userId, industry) };
}

// ── 연결 seam(다음 단계) ─────────────────────────────────────────────────────
// TODO(업종 DB 연결): 여기에 실제 연결이 붙는다.
//   export function openIndustryDb(userId, industry): IndustryDbHandle {
//     const ref = resolveIndustryDb(userId, industry);
//     // fs.mkdirSync(dirname(ref.dbPath), { recursive: true });
//     // const db = new Database(ref.dbPath);  // WAL·스키마 부트스트랩
//     // return { path: ref.dbPath, industry, userId /*, db */ };
//   }
// 기존 src/lib/db.ts(공통 명부+계정)는 절대 수정하지 않는다 — 업종 DB는 이 창구 전용.
