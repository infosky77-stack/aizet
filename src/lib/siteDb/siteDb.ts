// 사업장 DB 연결·초기화 — registry/registryDb.ts와 대칭. 기존 src/lib/db.ts와 완전 별개 연결.
//
// 이번 단계는 "빈 DB + 스키마 생성(부트스트랩)"까지만. 콘텐츠 이전은 다음 단계.
// 경로는 tenancy.sitePath(순수 규칙)를 재사용한다.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { sitePath } from '../tenancy/types';
import { SITE_SCHEMA } from './schema';

/**
 * 사업장 DB를 열고(없으면 생성) 스키마를 멱등 초기화한다. dbPath는 상대/절대/':memory:' 지원.
 * 콘텐츠는 넣지 않는다(빈 스키마까지만). 기존 db.ts는 건드리지 않는다.
 */
export function bootstrapSite(dbPath: string): Database.Database {
  const inMemory = dbPath === ':memory:';
  const resolved = inMemory
    ? dbPath
    : (path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath));

  if (!inMemory) {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
  }

  const db = new Database(resolved);
  if (!inMemory) db.pragma('journal_mode = WAL');
  for (const ddl of SITE_SCHEMA) db.exec(ddl);
  return db;
}

/**
 * 회원·사업장(siteId)으로 사업장 DB를 연다 — sitePath로 경로를 계산해 bootstrapSite에 위임.
 * (경로를 직접 알면 bootstrapSite(dbPath)를 써도 된다.)
 */
export function openSiteDb(userId: string, siteId: string): Database.Database {
  return bootstrapSite(sitePath(userId, siteId));
}
