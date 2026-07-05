// 콘텐츠 이전(2단계) — order로 귀속되는 콘텐츠를 각 사업장 DB로 옮긴다.
//
// 안전 원칙: 원본 aizet.db는 { readonly: true }로 읽기만(변경 0). 사업장 DB에만 쓴다.
// 멱등: id(PK) 기준 INSERT OR IGNORE라 재실행해도 행이 늘지 않는다. 앱 런타임 코드(src/)
// 무수정 — tenancy·registry·siteDb 모듈만 재사용한다.
//
// 매핑: 각 media_orders 행의 (user_id, order_type)로 명부(sites JOIN site_members, owner)를
//   역조회해 siteId·db_path를 얻고, 그 사업장 DB(siteDb.bootstrapSite)에 넣는다.
//   - super_editor_files: order_id로 부모 order를 찾아 그 사업장으로.
//   - super_editor_folders: order_id가 없으므로 (user_id, domain=industry)로 사업장 매핑.
//   - products: (user_id, 'product')로 사업장 매핑(detail_order_id는 같은 DB로 함께 감).
//
// ★이번 제외(다음 단계): order_id NULL super_editor_files(사업장 확정 불가), 음식점 menu_items
//   (order 없는 업종 — 명부 시드 보강 후). product_reviews·shop_*·magazine_placements는 0행.
//   ★render_jobs 제외: siteDb 스키마에 render_jobs 테이블이 없다(렌더 작업 이력은 재생성 가능한
//    일시 데이터라 콘텐츠 이전 대상이 아니다). 넣으려면 siteDb 스키마 확장이 선행돼야 한다.
//
// 실행 전제: registry 이전(sites 시드) + 사업장 DB 부트스트랩이 선행. 리허설은 아래 env로
//   경로를 임시로 덮어 실제 data/를 건드리지 않는다:
//     MIGRATE_REGISTRY_PATH  명부 DB 경로(기본 data/registry.db)
//     MIGRATE_SITE_ROOT      사업장 db_path의 기준 루트(기본 리포 루트)

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { bootstrapSite } from '../src/lib/siteDb/siteDb.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REG_PATH = process.env.MIGRATE_REGISTRY_PATH ?? path.join(ROOT, 'data', 'registry.db');
const SITE_ROOT = process.env.MIGRATE_SITE_ROOT ?? ROOT;
const siteAbsPath = (dbPath) => path.join(SITE_ROOT, dbPath);

// 원본 readonly, 명부 readonly(역조회만)
const src = new Database(path.join(ROOT, 'data', 'aizet.db'), { readonly: true });
const reg = new Database(REG_PATH, { readonly: true });

// (member_id, industry) → 사업장(owner 기준)
const findSite = reg.prepare(`
  SELECT s.id, s.db_path FROM sites s
  JOIN site_members sm ON sm.site_id = s.id
  WHERE sm.member_id = ? AND s.industry = ? AND sm.role = 'owner' LIMIT 1
`);

// 이전할 컬럼(원본=사업장 스키마 동일) — SELECT * row를 그대로 named param으로 넣는다
const COLS = {
  media_orders: ['id', 'user_id', 'order_type', 'title', 'snapshot', 'is_paid', 'payment_id', 'status', 'created_at', 'updated_at', 'output_uuid', 'folder_id'],
  super_editor_files: ['id', 'user_id', 'filename', 'orig_name', 'file_type', 'mime_type', 'size_bytes', 'created_at', 'content_hash', 'sort_order', 'order_id'],
  super_editor_folders: ['id', 'user_id', 'parent_folder_id', 'title', 'domain', 'sort_order', 'created_at', 'updated_at'],
  products: ['id', 'user_id', 'name', 'price', 'original_price', 'category', 'status', 'thumbnail_path', 'detail_order_id', 'detail_image_path', 'sort_order', 'created_at', 'updated_at', 'description', 'thumbnail_ref', 'detail_json_path'],
  // menu_items는 id INTEGER AUTOINCREMENT — INSERT OR IGNORE로 원본 id를 그대로 넣어 보존(멱등)
  menu_items: ['id', 'user_id', 'name', 'price', 'sort_order', 'description'],
  // render_jobs는 완료 산출물 포인터(order_id 귀속). PDF 파일(data/render-output/)은 이전 대상 아님 — 포인터만 옮김
  render_jobs: ['id', 'order_id', 'job_type', 'worker_type', 'status', 'priority', 'queued_at', 'started_at', 'done_at', 'error_msg', 'output_uuid', 'output_path', 'output_type'],
};
const insertSql = (t) => `INSERT OR IGNORE INTO ${t} (${COLS[t].join(',')}) VALUES (${COLS[t].map((c) => '@' + c).join(',')})`;

// 사업장 DB 핸들 + prepared insert 캐시(db_path별)
const bundles = new Map();
function bundleFor(memberId, industry) {
  const site = findSite.get(memberId, industry);
  if (!site) return null; // 명부에 없는 조합(generic 폴더 등) → skip
  if (!bundles.has(site.db_path)) {
    const db = bootstrapSite(siteAbsPath(site.db_path)); // 이미 부트스트랩됐으면 멱등 재적용
    bundles.set(site.db_path, {
      db,
      ins: Object.fromEntries(Object.keys(COLS).map((t) => [t, db.prepare(insertSql(t))])),
    });
  }
  return bundles.get(site.db_path);
}
// named param에 SQL이 참조하는 키만 추리기(여분 키 있으면 better-sqlite3가 거부)
const pick = (row, cols) => Object.fromEntries(cols.map((c) => [c, row[c] ?? null]));

let moved = { media_orders: 0, super_editor_files: 0, super_editor_folders: 0, products: 0, menu_items: 0, render_jobs: 0 };

// 1) media_orders — (user_id, order_type)로 사업장
for (const o of src.prepare('SELECT * FROM media_orders').all()) {
  const b = bundleFor(o.user_id, o.order_type);
  if (!b) continue;
  moved.media_orders += b.ins.media_orders.run(pick(o, COLS.media_orders)).changes;
}
// 2) super_editor_files — order_id로 부모 order를 찾아 그 사업장(order 있는 것만)
for (const f of src.prepare(`
  SELECT f.* FROM super_editor_files f JOIN media_orders o ON o.id = f.order_id
`).all()) {
  const o = src.prepare('SELECT user_id, order_type FROM media_orders WHERE id=?').get(f.order_id);
  const b = bundleFor(o.user_id, o.order_type);
  if (!b) continue;
  moved.super_editor_files += b.ins.super_editor_files.run(pick(f, COLS.super_editor_files)).changes;
}
// 3) super_editor_folders — (user_id, domain=industry)로 사업장
for (const fd of src.prepare('SELECT * FROM super_editor_folders').all()) {
  const b = bundleFor(fd.user_id, fd.domain);
  if (!b) continue;
  moved.super_editor_folders += b.ins.super_editor_folders.run(pick(fd, COLS.super_editor_folders)).changes;
}
// 4) products — (user_id, 'product')로 사업장
for (const p of src.prepare('SELECT * FROM products').all()) {
  const b = bundleFor(p.user_id, 'product');
  if (!b) continue;
  moved.products += b.ins.products.run(pick(p, COLS.products)).changes;
}
// 5) render_jobs — order_id로 부모 order의 (user_id, order_type) 역조회 → 사업장(id 보존).
//    PDF 파일(data/render-output/)은 이전 대상 아님 — render_jobs 포인터 행만 옮긴다.
for (const j of src.prepare('SELECT * FROM render_jobs').all()) {
  const o = src.prepare('SELECT user_id, order_type FROM media_orders WHERE id=?').get(j.order_id);
  if (!o) continue;
  const b = bundleFor(o.user_id, o.order_type);
  if (!b) continue;
  moved.render_jobs += b.ins.render_jobs.run(pick(j, COLS.render_jobs)).changes;
}

// ── 선결1: order_id NULL super_editor_files 귀속 ─────────────────────────────
// 참조: media_orders.snapshot이 그 file id를 포함하면 그 order로(order_id 채워 정확 연결).
// 미참조: 어느 snapshot에도 없으면 user_id의 대표 사업장(sort_order 최소)으로 order_id NULL(미분류).
// 원본 f는 안 바꾸고, 사업장 DB에 넣을 때만 order_id를 보정한다(원본 readonly 유지).
const moved1 = { referenced: 0, unref: 0, skipped: 0 };
const nullFiles = src.prepare('SELECT * FROM super_editor_files WHERE order_id IS NULL').all();
const allOrders = src.prepare('SELECT id, user_id, order_type, snapshot FROM media_orders').all();
const findRepIndustry = reg.prepare(`
  SELECT s.industry FROM sites s JOIN site_members sm ON sm.site_id = s.id
  WHERE sm.member_id = ? AND sm.role = 'owner' ORDER BY s.sort_order LIMIT 1
`);
for (const f of nullFiles) {
  // snapshot 문자열에 file id가 박혀 있으면 그 order가 이 파일을 쓰는 것(파싱 실패 없이 안전)
  const refOrder = allOrders.find((o) => (o.snapshot || '').includes(f.id)) ?? null;
  if (refOrder) {
    const b = bundleFor(refOrder.user_id, refOrder.order_type);
    if (!b) { moved1.skipped++; continue; }
    const row = { ...pick(f, COLS.super_editor_files), order_id: refOrder.id }; // order_id 보정
    moved1.referenced += b.ins.super_editor_files.run(row).changes;
  } else {
    const rep = findRepIndustry.get(f.user_id); // 미참조 → 대표 사업장(미분류)
    if (!rep) { moved1.skipped++; continue; }
    const b = bundleFor(f.user_id, rep.industry);
    if (!b) { moved1.skipped++; continue; }
    moved1.unref += b.ins.super_editor_files.run(pick(f, COLS.super_editor_files)).changes; // order_id NULL 유지
  }
}

// ── 선결2: order 없는 업종 콘텐츠 이전(menu_items) ──────────────────────────
// user_id의 서비스 업종 사업장(users.industry로 역조회)으로. id 보존(INSERT OR IGNORE).
const findUserIndustry = src.prepare('SELECT industry FROM users WHERE id=?');
for (const m of src.prepare('SELECT * FROM menu_items').all()) {
  const industry = (findUserIndustry.get(m.user_id)?.industry ?? '').trim() || 'service';
  const b = bundleFor(m.user_id, industry);
  if (!b) continue;
  moved.menu_items += b.ins.menu_items.run(pick(m, COLS.menu_items)).changes;
}

// ── site_profile 채우기 — 각 사업장의 owner 회원 프로필을 복제(id='self' 1행) ─────
// slug만 대표 사업장(회원의 sort_order 최소)에 원래 값, 나머지 사업장은 ''(공개 URL 유일성).
// 나머지 5개(shop_name·phone·address·business_hours·site_config)는 전 사업장 복제.
// 멱등: id='self' PK INSERT OR REPLACE(행수 1 유지, 최신 프로필 반영). 원본 users는 readonly.
const allOwnerSites = reg.prepare(`
  SELECT s.id, s.db_path, s.sort_order, sm.member_id FROM sites s
  JOIN site_members sm ON sm.site_id = s.id WHERE sm.role = 'owner'
`).all();
const minSort = {}; // 회원별 대표(최소 sort_order) 판정용
for (const s of allOwnerSites) minSort[s.member_id] = Math.min(minSort[s.member_id] ?? Infinity, s.sort_order);
const findProfile = src.prepare('SELECT shop_name, phone, address, business_hours, slug, site_config, updated_at FROM users WHERE id=?');
let movedProfiles = 0;
for (const s of allOwnerSites) {
  const u = findProfile.get(s.member_id);
  if (!u) continue;
  // 사업장 DB 핸들 — 콘텐츠 이전으로 이미 열린 것 재사용, 없으면(콘텐츠 0인 사업장) 새로 연다
  let db;
  if (bundles.has(s.db_path)) db = bundles.get(s.db_path).db;
  else { db = bootstrapSite(siteAbsPath(s.db_path)); bundles.set(s.db_path, { db, ins: null }); }
  const isRep = s.sort_order === minSort[s.member_id];
  db.prepare(`
    INSERT OR REPLACE INTO site_profile (id, shop_name, phone, address, business_hours, slug, site_config, updated_at)
    VALUES ('self', @shop_name, @phone, @address, @business_hours, @slug, @site_config, @updated_at)
  `).run({
    shop_name: u.shop_name ?? '', phone: u.phone ?? '', address: u.address ?? '',
    business_hours: u.business_hours ?? '', slug: isRep ? (u.slug ?? '') : '',
    site_config: u.site_config ?? '', updated_at: u.updated_at ?? now,
  });
  movedProfiles++;
}

// ── 검증 출력 ────────────────────────────────────────────────────────────────
console.log('── 콘텐츠 이전 결과(이번 실행 삽입 행수) ─────────────');
console.log(`  media_orders ${moved.media_orders} · files ${moved.super_editor_files} · folders ${moved.super_editor_folders} · products ${moved.products} · menu_items ${moved.menu_items} · render_jobs ${moved.render_jobs}`);
console.log(`  선결1(order_id NULL 파일): 참조 ${moved1.referenced} + 미분류 ${moved1.unref} = ${moved1.referenced + moved1.unref} (skip ${moved1.skipped})`);
console.log(`  site_profile 채움: ${movedProfiles}개 사업장`);

// 사업장별 최종 행수(files 중 미분류=order_id NULL 별도 표기)
console.log('\n사업장별 최종 행수:');
for (const [dbPath, b] of bundles) {
  const c = (t) => b.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
  const unclassified = b.db.prepare('SELECT COUNT(*) n FROM super_editor_files WHERE order_id IS NULL').get().n;
  const prof = b.db.prepare("SELECT shop_name, slug FROM site_profile WHERE id='self'").get();
  console.log(`  ${dbPath}: orders ${c('media_orders')} files ${c('super_editor_files')}(미분류 ${unclassified}) folders ${c('super_editor_folders')} products ${c('products')} menu ${c('menu_items')} | profile[shop="${prof?.shop_name ?? ''}" slug="${prof?.slug ?? ''}"]`);
}

// files↔orders JOIN 무결성(사업장 DB 안) — 첫 사업장
const first = [...bundles.values()][0];
if (first) {
  const orphan = first.db.prepare(`
    SELECT COUNT(*) n FROM super_editor_files f LEFT JOIN media_orders o ON o.id=f.order_id
    WHERE f.order_id IS NOT NULL AND o.id IS NULL
  `).get().n;
  console.log(`\nfiles↔orders JOIN 무결성(첫 사업장): 고아 파일 ${orphan}건 ${orphan === 0 ? '✅' : '❌'}`);
}

console.log('원본 aizet.db: readonly로 열어 변경 없음(쓰기 0).');
for (const b of bundles.values()) b.db.close();
src.close();
reg.close();
