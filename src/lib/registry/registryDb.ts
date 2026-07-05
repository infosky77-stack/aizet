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
