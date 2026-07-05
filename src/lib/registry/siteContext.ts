// 홈페이지(사업장) 컨텍스트 단일 확정 유틸 — siteId → 그 홈페이지 전용 컨텍스트(READ 전용).
//
// 단일 책임: "siteId로 홈페이지 컨텍스트를 확정"하는 로직을 이 유틸 하나로 모은다. 여러
// 화면이 제각각 명부/사업장 DB를 다시 열지 않도록, 진입 시 이 함수 한 번으로 확정한다.
//
// 보안: 소유자 검증 필수. site_members(site_id, member_id, role='owner')에 해당 회원 행이
// 있어야만 컨텍스트를 돌려준다. 소유자가 아니거나 없는 siteId면 null(에러 던지지 않음) —
// 남의 홈페이지 컨텍스트를 여는 것을 원천 차단한다. 쓰기·생성 없음.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { openRegistry, REGISTRY_PATH } from './registryDb';

/** siteId로 확정된 홈페이지 전용 컨텍스트(다음 단계에서 dbPath로 사업장 DB를 연다) */
export interface SiteContext {
  siteId: string;
  slug: string;
  shopName: string;
  industry: string;
  dbPath: string;
}

type SiteRow = { siteId: string; industry: string; title: string; db_path: string };

/** 사업장 DB(site_profile)에서 slug·shop_name만 읽는다(읽기 전용, 방어적). 없으면 null. */
function readProfile(dbPath: string): { slug: string; shopName: string } | null {
  try {
    const resolved = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    if (!fs.existsSync(resolved)) return null;
    const sdb = new Database(resolved, { readonly: true });
    try {
      const row = sdb.prepare<[], { slug: string; shop_name: string }>(
        'SELECT slug, shop_name FROM site_profile LIMIT 1',
      ).get();
      if (!row) return null;
      return { slug: row.slug ?? '', shopName: row.shop_name ?? '' };
    } finally {
      sdb.close();
    }
  } catch {
    return null;
  }
}

/**
 * siteId → 그 홈페이지의 전용 컨텍스트를 단일 확정한다(READ 전용).
 * 소유자 검증: memberId가 그 site의 소유자(site_members.role='owner')여야 한다.
 * 소유자가 아니거나 없는 siteId면 null 반환(에러 던지지 않음).
 */
export function getSiteContext(
  siteId: string,
  memberId: string,
  dbPath: string = REGISTRY_PATH,
): SiteContext | null {
  if (!siteId || !memberId) return null;

  const db = openRegistry(dbPath);
  const row = db.prepare<[string, string], SiteRow>(`
    SELECT s.id AS siteId, s.industry AS industry, s.title AS title, s.db_path AS db_path
      FROM sites s
      JOIN site_members sm ON sm.site_id = s.id
     WHERE s.id = ? AND sm.member_id = ? AND sm.role = 'owner'
     LIMIT 1
  `).get(siteId, memberId);

  if (!row) return null; // 없는 siteId 또는 소유자 아님 → 접근 거부

  const profile = readProfile(row.db_path);
  return {
    siteId: row.siteId,
    slug: profile?.slug ?? '',
    shopName: profile?.shopName || row.title,
    industry: row.industry,
    dbPath: row.db_path,
  };
}
