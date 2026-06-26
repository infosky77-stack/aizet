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
    ['regen_count',      'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 슬러그 유니크 인덱스 (이미 있으면 무시) ────────────────────────────────────
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON users(slug) WHERE slug IS NOT NULL;`);

// ── 거래처 테이블 ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_clients (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    biz_number  TEXT    NOT NULL DEFAULT '',
    contact     TEXT    NOT NULL DEFAULT '',
    phone       TEXT    NOT NULL DEFAULT '',
    email       TEXT    NOT NULL DEFAULT '',
    memo        TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_clients_user_id ON tax_clients(user_id);
`);

// ── 신고 현황 테이블 ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_filings (
    id          TEXT    PRIMARY KEY,
    client_id   TEXT    NOT NULL REFERENCES tax_clients(id) ON DELETE CASCADE,
    user_id     TEXT    NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'vat',
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    due_date    TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'pending',
    filed_at    INTEGER,
    memo        TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_filings_user_id   ON tax_filings(user_id);
  CREATE INDEX IF NOT EXISTS idx_tax_filings_client_id ON tax_filings(client_id);
  CREATE INDEX IF NOT EXISTS idx_tax_filings_due_date  ON tax_filings(due_date);
`);

// ── 문서 보관 테이블 ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_documents (
    id            TEXT    PRIMARY KEY,
    client_id     TEXT    NOT NULL REFERENCES tax_clients(id) ON DELETE CASCADE,
    user_id       TEXT    NOT NULL,
    filename      TEXT    NOT NULL,
    mime_type     TEXT    NOT NULL DEFAULT 'application/octet-stream',
    file_size     INTEGER NOT NULL DEFAULT 0,
    local_path    TEXT,
    drive_file_id TEXT,
    drive_url     TEXT,
    doc_date      TEXT,
    amount        INTEGER,
    vendor        TEXT    NOT NULL DEFAULT '',
    category      TEXT    NOT NULL DEFAULT '',
    ai_raw        TEXT    NOT NULL DEFAULT '',
    ai_confirmed  INTEGER NOT NULL DEFAULT 0,
    deleted_at    INTEGER,
    deleted_by    TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_documents_user_id   ON tax_documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_tax_documents_client_id ON tax_documents(client_id);
  CREATE INDEX IF NOT EXISTS idx_tax_documents_deleted   ON tax_documents(deleted_at);
`);

// ── tax_documents 신규 컬럼 추가 (AI 원본 + 이상치, 멱등) ──────────────────────
{
  const existing = (db.pragma('table_info(tax_documents)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['ai_date',      'TEXT'],
    ['ai_amount',    'INTEGER'],
    ['ai_vendor',    "TEXT NOT NULL DEFAULT ''"],
    ['ai_category',  "TEXT NOT NULL DEFAULT ''"],
    ['anomaly_flag', 'INTEGER NOT NULL DEFAULT 0'],
    ['anomaly_note', "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE tax_documents ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 문서 수정이력 테이블 ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_document_edits (
    id          TEXT    PRIMARY KEY,
    document_id TEXT    NOT NULL,
    user_id     TEXT    NOT NULL,
    field       TEXT    NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    edited_by   TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_document_edits_doc ON tax_document_edits(document_id);
`);

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

// ── menu_items 테이블 신규 컬럼 추가 (기존 row 보존, 멱등) ─────────────────────
{
  const existing = (db.pragma('table_info(menu_items)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['description', "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE menu_items ADD COLUMN ${col} ${def}`);
    }
  }
}

export default db;
