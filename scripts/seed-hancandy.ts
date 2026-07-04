// 한캔디 이관 seed — CANDY_PRODUCTS(하드코딩 데모)를 범용 쇼핑몰 구조로 옮긴다.
// 실행: npx tsx scripts/seed-hancandy.ts   (배포된 앱이 localhost:3000에 떠 있어야 함)
//
// 하는 일:
//  1) 한캔디 데모 계정(slug 'hancandy') 생성 — 기존 seed 데이터가 있으면 지우고 재생성(멱등)
//  2) 캔디 3종마다: 슈퍼에디터 product 콘텐츠 + 파일 원장(public/hancandy 이미지) +
//     섹션 스냅샷(헤드라인/이미지/설명/특징/이미지) + products 행(detail_order_id 연결)
//  3) headless Chromium으로 실제 앱을 구동해 "상세페이지 생성 → 상품에 게시"까지 수행
//     (회원이 하는 것과 완전히 같은 경로 — 게시 파이프라인 검증을 겸한다)
//  4) 게시 성공한 상품을 판매중(active)으로 전환
//
// 상품 id는 `hancandy-{candy.id}` 고정 — 홈/챗의 "담기"(candyToCartItem)와 맞물린다.

import { randomUUID, createHash } from 'crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { chromium } from 'playwright';
import { CANDY_PRODUCTS } from '../src/lib/hancandy/products';
import { newProductSection, type ProductDetailSnapshot } from '../src/lib/super-editor/product/types';

const ROOT = path.resolve(__dirname, '..');
const BASE = 'http://localhost:3000';
const db = new Database(path.join(ROOT, 'data', 'aizet.db'));

const USER_ID = 'hancandy-demo-user';
const SLUG    = 'hancandy';

// 캔디별 이미지(대표/보조) — public/hancandy 자산
const CANDY_IMAGES: Record<string, { hero: string; second: string }> = {
  'no1-green':  { hero: 'maekmundong_lilyturf.jpg', second: 'geumeunhwa_honeysuckle.jpg' },
  'no2-blue':   { hero: '2ho_scenario_morning.jpg', second: 'sanyak_yam.jpg' },
  'no3-yellow': { hero: '3ho_scenario_meat.jpg',    second: 'sansa_hawthorn.jpg' },
};

// ── 1) 계정 준비 (재실행 시 이전 seed 산출물 정리) ──────────────────────────
function ensureUser(): void {
  const existing = db.prepare('SELECT id FROM users WHERE slug=?').get(SLUG) as { id: string } | undefined;
  if (existing) {
    console.log('기존 한캔디 계정 발견 — seed 데이터 재생성');
    const orderIds = db.prepare('SELECT detail_order_id FROM products WHERE user_id=?').all(existing.id) as { detail_order_id: string | null }[];
    for (const { detail_order_id } of orderIds) {
      if (detail_order_id) db.prepare('DELETE FROM media_orders WHERE id=?').run(detail_order_id);
    }
    db.prepare('DELETE FROM products WHERE user_id=?').run(existing.id);
    db.prepare('DELETE FROM super_editor_files WHERE user_id=?').run(existing.id);
    rmSync(path.join(ROOT, 'data', 'super-editor-files', existing.id), { recursive: true, force: true });
    rmSync(path.join(ROOT, 'data', 'shop-public', existing.id), { recursive: true, force: true });
    // 주문(shop_orders)은 실데이터일 수 있어 보존한다
  } else {
    const now = Date.now();
    db.prepare(`
      INSERT INTO users (id, email, name, picture, plan, industry, shop_name, slug, created_at, updated_at)
      VALUES (?, ?, '한캔디', '', 'free', 'demo', '한캔디', ?, ?, ?)
    `).run(USER_ID, 'hancandy-demo@aizet.co.kr', SLUG, now, now);
    console.log('한캔디 계정 생성:', USER_ID);
  }
}

// ── 2) 파일 원장 등록 (업로드 라우트와 같은 저장 규칙: data/super-editor-files/<uid>/) ──
function registerImage(publicName: string, orderId: string): string {
  const src = path.join(ROOT, 'public', 'hancandy', publicName);
  const bytes = readFileSync(src);
  const fileId = randomUUID();
  const filename = `${randomUUID()}.jpg`;
  const dir = path.join(ROOT, 'data', 'super-editor-files', USER_ID);
  mkdirSync(dir, { recursive: true });
  copyFileSync(src, path.join(dir, filename));
  db.prepare(`
    INSERT INTO super_editor_files
      (id, user_id, filename, orig_name, file_type, mime_type, size_bytes, content_hash, sort_order, order_id, created_at)
    VALUES (?, ?, ?, ?, 'image', 'image/jpeg', ?, ?, ?, ?, ?)
  `).run(
    fileId, USER_ID, filename, publicName, statSync(src).size,
    createHash('sha256').update(bytes).digest('hex'), -Date.now(), orderId, Date.now(),
  );
  return fileId;
}

interface Seeded { productId: string; orderId: string; name: string }

function seedProducts(): Seeded[] {
  const uid = db.prepare('SELECT id FROM users WHERE slug=?').get(SLUG) as { id: string };
  const results: Seeded[] = [];
  for (const candy of CANDY_PRODUCTS) {
    const now = Date.now();
    const orderId = randomUUID();
    db.prepare(`
      INSERT INTO media_orders (id, user_id, order_type, title, snapshot, is_paid, status, folder_id, created_at, updated_at)
      VALUES (?, ?, 'product', ?, '{}', 0, 'editing', NULL, ?, ?)
    `).run(orderId, uid.id, candy.name, now, now);

    const images = CANDY_IMAGES[candy.id];
    const heroRef   = registerImage(images.hero, orderId);
    const secondRef = registerImage(images.second, orderId);

    const snapshot: ProductDetailSnapshot = {
      version: 1,
      title: candy.name,
      templateId: 'clean',
      sections: [
        newProductSection('headline', { text: `${candy.name} ${candy.weight}`, subText: candy.slogan }),
        newProductSection('image',    { ledgerRef: heroRef, text: candy.concept }),
        newProductSection('text',     { text: candy.longDescription }),
        newProductSection('features', {
          items: candy.keyIngredients.slice(0, 4).map((ing) => ({
            title: ing.priority ? `${ing.name} (${ing.priority})` : ing.name,
            body:  `${ing.role} — ${ing.desc}`,
          })),
        }),
        newProductSection('image',    { ledgerRef: secondRef, text: '' }),
      ],
    };
    db.prepare('UPDATE media_orders SET snapshot=?, updated_at=? WHERE id=?')
      .run(JSON.stringify(snapshot), Date.now(), orderId);

    const productId = `hancandy-${candy.id}`;
    db.prepare(`
      INSERT INTO products (id, user_id, name, description, price, original_price, category, status,
                            thumbnail_ref, detail_order_id, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `).run(
      productId, uid.id, candy.name, `${candy.slogan} · ${candy.benefit}`,
      candy.price, candy.originalPrice ?? null, candy.concept,
      heroRef, orderId, candy.number, now, now,
    );
    results.push({ productId, orderId, name: candy.name });
    console.log(`상품 seed: ${candy.name} (${productId})`);
  }
  return results;
}

// ── 3) 실제 앱에서 생성→게시 (회원과 같은 경로) ─────────────────────────────
async function publishAll(seeded: Seeded[]): Promise<void> {
  const sessionId = randomUUID();
  db.prepare(`
    INSERT INTO sessions (id, sub, email, name, picture, accessToken, refreshToken, expiresAt, plan, industry, createdAt)
    VALUES (?, ?, 'hancandy-demo@aizet.co.kr', '한캔디', '', 'seed', NULL, ?, 'free', 'demo', ?)
  `).run(sessionId, USER_ID, Date.now() + 3600_000, Date.now());

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: 'aizet_session', value: sessionId, domain: 'localhost', path: '/' }]);
    const page = await ctx.newPage();
    page.setDefaultTimeout(30000);

    for (const item of seeded) {
      await page.goto(`${BASE}/admin/super-editor/folders?domain=product&contentId=${item.orderId}`);
      await page.getByRole('button', { name: '상세페이지 생성' }).click();
      await page.getByRole('heading', { name: '상세페이지 미리보기' }).waitFor();
      await page.getByRole('button', { name: '상품에 게시' }).click();
      await page.getByRole('button', { name: '게시됨' }).waitFor();
      db.prepare("UPDATE products SET status='active', updated_at=? WHERE id=?").run(Date.now(), item.productId);
      console.log(`게시 완료: ${item.name}`);
    }
  } finally {
    await browser.close();
    db.prepare('DELETE FROM sessions WHERE id=?').run(sessionId);
  }
}

(async () => {
  ensureUser();
  const seeded = seedProducts();
  await publishAll(seeded);
  const rows = db.prepare(
    "SELECT id, name, status, thumbnail_path IS NOT NULL AS has_thumb, detail_image_path IS NOT NULL AS has_detail FROM products WHERE user_id=?",
  ).all(USER_ID);
  console.log('\n결과:', rows);
  db.close();
})().catch((e) => { console.error(e); process.exit(1); });
