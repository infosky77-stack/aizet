// 명부 DB 연결·초기화(골격) — 기존 src/lib/db.ts(aizet.db)와 완전히 별개 연결.
//
// ⚠경로 주의: tenancy.REGISTRY_DB_PATH는 아직 'data/aizet.db'(이전 단계의 "당분간 기존
// DB 재사용" 임시값)를 가리킨다. 하지만 명부를 별도 파일로 세우는 이번 단계에서는 기존
// aizet.db 무접촉 원칙을 지키기 위해 별개 파일 'data/registry.db'를 쓴다. 명부 DB가
// 확정되면 다음 단계에서 tenancy 상수를 'data/registry.db'로 맞추는 것을 권장한다.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { REGISTRY_SCHEMA } from './schema';

export const REGISTRY_PATH = 'data/registry.db';

/**
 * 명부 DB를 열고(없으면 생성) 스키마를 멱등 초기화한다. dbPath 미지정 시 REGISTRY_PATH.
 * 테스트는 ':memory:' 또는 임시 경로를 주입할 수 있다. 기존 db.ts는 건드리지 않는다.
 */
export function openRegistry(dbPath: string = REGISTRY_PATH): Database.Database {
  const inMemory = dbPath === ':memory:';
  const resolved = inMemory
    ? dbPath
    : (path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath));

  if (!inMemory) {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
  }

  const db = new Database(resolved);
  if (!inMemory) db.pragma('journal_mode = WAL');
  for (const ddl of REGISTRY_SCHEMA) db.exec(ddl);
  return db;
}

/**
 * 한 회원이 접근 가능한 사업장 1개 요약(목록 화면·라우팅용).
 *  · siteId/industry/title/role/sortOrder/lastEditedAt/dbPath — 명부(registry.sites, site_members)에서 옴
 *  · slug/shopName — 명부에 없다. 각 사업장 DB의 site_profile에서 읽어 보강한다
 *    (없거나 읽기 실패 시 slug=''·shopName=title 폴백).
 */
export interface MemberSite {
  siteId: string;
  industry: string;
  title: string;
  shopName: string;
  slug: string;
  role: string;
  sortOrder: number;
  lastEditedAt: number | null;
  dbPath: string;
}

type MemberSiteRow = {
  siteId: string;
  industry: string;
  title: string;
  role: string;
  sort_order: number;
  last_edited_at: number | null;
  db_path: string;
};

/**
 * 사업장 DB(site_profile)에서 slug·shop_name만 읽어온다(읽기 전용, 방어적).
 * 파일이 없거나 site_profile이 비어 있으면 null을 반환해 호출부가 폴백하게 한다.
 * ★새 파일을 만들지 않도록 존재하는 경우에만 { readonly:true }로 연다.
 */
function readSiteProfile(dbPath: string): { slug: string; shopName: string } | null {
  try {
    const resolved = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    if (!fs.existsSync(resolved)) return null;
    const sdb = new Database(resolved, { readonly: true });
    try {
      const row = sdb.prepare<[], { slug: string; shop_name: string }>(
        'SELECT slug, shop_name FROM site_profile LIMIT 1'
      ).get();
      if (!row) return null;
      return { slug: row.slug ?? '', shopName: row.shop_name ?? '' };
    } finally {
      sdb.close();
    }
  } catch {
    return null; // 읽기 실패는 조용히 폴백(에러 던지지 않음)
  }
}

/**
 * 특정 회원(memberId)이 접근 가능한 사업장 목록을 읽는다(읽기 전용, SELECT만).
 * site_members(member_id) ⋈ sites 조인 — 공동관리 포함. sort_order 오름차순 정렬.
 * slug·shopName은 각 사업장 DB의 site_profile에서 보강한다. 사업장이 없으면 빈 배열([]) 반환.
 * dbPath 미지정 시 REGISTRY_PATH를 열어 재사용한다(기존 db.ts·원본 aizet.db 무접촉).
 */
export function listSitesForMember(memberId: string, dbPath: string = REGISTRY_PATH): MemberSite[] {
  const db = openRegistry(dbPath);
  const rows = db.prepare<[string], MemberSiteRow>(`
    SELECT s.id AS siteId, s.industry AS industry, s.title AS title,
           sm.role AS role, s.sort_order AS sort_order,
           s.last_edited_at AS last_edited_at, s.db_path AS db_path
      FROM site_members sm
      JOIN sites s ON s.id = sm.site_id
     WHERE sm.member_id = ?
     ORDER BY s.sort_order ASC, s.created_at ASC
  `).all(memberId);
  return rows.map(r => {
    const profile = readSiteProfile(r.db_path);
    return {
      siteId: r.siteId,
      industry: r.industry,
      title: r.title,
      shopName: profile?.shopName || r.title,
      slug: profile?.slug ?? '',
      role: r.role,
      sortOrder: r.sort_order,
      lastEditedAt: r.last_edited_at,
      dbPath: r.db_path,
    };
  });
}
