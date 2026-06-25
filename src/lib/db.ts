import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'aizet.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT    PRIMARY KEY,
    email       TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    picture     TEXT    NOT NULL DEFAULT '',
    plan        TEXT    NOT NULL DEFAULT 'free',
    industry    TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           TEXT    PRIMARY KEY,
    sub          TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    picture      TEXT    NOT NULL DEFAULT '',
    accessToken  TEXT    NOT NULL DEFAULT '',
    refreshToken TEXT,
    expiresAt    INTEGER NOT NULL,
    plan         TEXT    NOT NULL DEFAULT 'free',
    industry     TEXT    NOT NULL DEFAULT '',
    createdAt    INTEGER NOT NULL
  );
`);

// ── users 테이블 신규 컬럼 추가 (기존 row 보존, 멱등) ──────────────────────────
{
  const existing = (db.pragma('table_info(users)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['shop_name',      "TEXT NOT NULL DEFAULT ''"],
    ['phone',          "TEXT NOT NULL DEFAULT ''"],
    ['address',        "TEXT NOT NULL DEFAULT ''"],
    ['business_hours', "TEXT NOT NULL DEFAULT ''"],
    ['slug',           'TEXT'],
    ['site_config',      "TEXT NOT NULL DEFAULT '{}'"],
    ['drive_folder_id',  'TEXT'],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 슬러그 유니크 인덱스 (이미 있으면 무시) ────────────────────────────────────
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON users(slug) WHERE slug IS NOT NULL;`);

// ── 메뉴 아이템 테이블 ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    price      INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_menu_items_user_id ON menu_items(user_id);
`);

export default db;
