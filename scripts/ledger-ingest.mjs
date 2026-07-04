// 파일질라(SFTP) 등으로 서버에 직접 올린 이미지들을 슈퍼에디터 원장에 등록한다.
//
// 원장은 "디스크 파일 + super_editor_files DB 행"의 쌍이라 파일만 올려서는 앱이 모른다 —
// 이 스크립트가 업로드 API(api/admin/super-editor/files)와 같은 규약으로 등록해 준다:
// 디스크 파일명은 uuid.ext로 바꾸고, 사용자가 지은 이름은 orig_name으로 보존(UI에 표시).
//
// 사용법:
//   node scripts/ledger-ingest.mjs --dir data/incoming --order <콘텐츠 주문 id> [--user <sub>]
//
//   --dir   가져올 디렉토리(기본 data/incoming) — jpg/jpeg/png/webp/gif만 처리
//   --order 콘텐츠 주문 id — 그 콘텐츠의 "파일 관리"에 나타나게 한다(생략 시 미지정 파일)
//   --user  소유자 sub(기본: 대표 계정)
//
// 같은 이름+같은 내용(sha256)이 이미 있으면 건너뛴다(재실행 멱등). 처리한 원본 파일은
// <dir>/ingested/로 옮겨 이중 등록을 막는다.

import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const userId  = opt('user', '112873040654574135275');
const orderId = opt('order', null);
const dir     = path.resolve(ROOT, opt('dir', 'data/incoming'));

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

if (!existsSync(dir)) {
  console.error(`디렉토리가 없습니다: ${dir}`);
  process.exit(1);
}

const db = new Database(path.join(ROOT, 'data', 'aizet.db'));
const destDir = path.join(ROOT, 'data', 'super-editor-files', userId);
const doneDir = path.join(dir, 'ingested');
mkdirSync(destDir, { recursive: true });
mkdirSync(doneDir, { recursive: true });

const files = readdirSync(dir).filter((f) => statSync(path.join(dir, f)).isFile());
let ingested = 0, skipped = 0;

for (const name of files) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME[ext];
  if (!mime) { console.log(`무시(이미지 아님): ${name}`); continue; }

  const buffer = readFileSync(path.join(dir, name));
  const hash = createHash('sha256').update(buffer).digest('hex');

  // 재실행 멱등 — 같은 이름+내용이 이미 원장에 있으면 건너뛴다(업로드 API의 중복 규칙과 동일)
  const dup = db.prepare(
    'SELECT id FROM super_editor_files WHERE user_id=? AND orig_name=? AND content_hash=? AND order_id IS ? LIMIT 1',
  ).get(userId, name, hash, orderId);
  if (dup) {
    console.log(`건너뜀(이미 등록됨 id=${dup.id.slice(0, 8)}…): ${name}`);
    renameSync(path.join(dir, name), path.join(doneDir, name));
    skipped++;
    continue;
  }

  const id = randomUUID();
  const filename = `${randomUUID()}.${ext}`;
  const now = Date.now();
  copyFileSync(path.join(dir, name), path.join(destDir, filename));
  db.prepare(`
    INSERT INTO super_editor_files
      (id, user_id, filename, orig_name, file_type, mime_type, size_bytes, content_hash, sort_order, order_id, created_at)
    VALUES (?, ?, ?, ?, 'image', ?, ?, ?, ?, ?, ?)
  `).run(id, userId, filename, name, mime, buffer.length, hash, -now, orderId, now);
  renameSync(path.join(dir, name), path.join(doneDir, name));
  console.log(`등록: ${name} → id=${id.slice(0, 8)}… (${Math.round(buffer.length / 1024)}KB)`);
  ingested++;
}

db.close();
console.log(`\n완료 — 등록 ${ingested}건, 건너뜀 ${skipped}건. 원본은 ${doneDir}/ 으로 이동됨.`);
console.log('슈퍼에디터 파일 관리(해당 콘텐츠)에서 목록에 보이면 성공입니다.');
