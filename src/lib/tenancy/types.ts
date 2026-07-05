// 업종별 DB 분리 뼈대 — 순수 타입·경로 규칙만 담는다(DB 접근·파일 생성 없음).
//
// 설계: 앞으로 각 업종이 회원별 독립 DB 파일을 갖고, 중앙 명부(당분간 기존 aizet.db)가
// "누가 어떤 업종을 갖고 그 DB가 어디 있는지"만 안내한다. 이 파일은 그중 "경로 규칙 +
// 타입"만 세우며, 실제 연결·데이터 이동은 다음 단계다.
//
// IndustryKind는 기존 MediaOrderType을 그대로 재사용(값 일치 보장) — 타입만 가져오므로
// 런타임에 DB 모듈(better-sqlite3)이 로드되지 않는다.

import type { MediaOrderType } from '../db/media-orders';

/** 업종 종류 — 기존 media_orders.order_type과 동일 값(단일 소스 재사용) */
export type IndustryKind = MediaOrderType;

/**
 * 런타임 검증용 목록 — 타입이 `readonly IndustryKind[]`라 IndustryKind에 없는 값을
 * 넣으면 컴파일 에러. MediaOrderType에 값이 추가되면 여기도 함께 갱신해야 한다.
 */
export const INDUSTRY_KINDS: readonly IndustryKind[] = [
  'catalog', 'education', 'video', 'print', 'product', 'magazine',
];

/** 공통 DB(명부+계정) — 당분간 기존 aizet.db를 그대로 재사용한다 */
export const REGISTRY_DB_PATH = 'data/aizet.db';

/** 명부가 가리키는 한 업종 DB의 참조(경로만, 파일 존재 여부와 무관) */
export interface IndustryDbRef {
  userId: string;
  industry: IndustryKind;
  dbPath: string;
}

// userId는 파일 경로 한 조각이 되므로 경로 조작(구분자·상위이동·제어문자)을 원천 차단한다.
const USER_ID_RE = /^[A-Za-z0-9_-]+$/;

function isIndustryKind(value: string): value is IndustryKind {
  return (INDUSTRY_KINDS as readonly string[]).includes(value);
}

/**
 * 회원·업종으로 업종 DB 경로 문자열을 만든다(순수 함수, 파일 생성 안 함).
 * 규칙: `data/members/<userId>/<industry>.db`. 빈 값·이상 문자는 throw.
 */
export function industryDbPath(userId: string, industry: IndustryKind): string {
  const uid = (userId ?? '').trim();
  if (!uid || !USER_ID_RE.test(uid)) {
    throw new Error(`유효하지 않은 userId: ${JSON.stringify(userId)}`);
  }
  if (!isIndustryKind(industry)) {
    throw new Error(`유효하지 않은 industry: ${JSON.stringify(industry)}`);
  }
  return `data/members/${uid}/${industry}.db`;
}
