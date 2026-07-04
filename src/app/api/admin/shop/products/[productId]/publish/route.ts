// 상세페이지 게시 — 브라우저가 만든 긴 JPEG를 공개 디렉토리에 보관하고 상품에 연결.
// catalog-store-render와 같은 원칙: 서버는 "생성"하지 않고 완성 파일을 저장만 한다.
//
// 공개/비공개 경계가 이 라우트의 존재 이유다: 파일 원장(super-editor-files, 소유자 인증
// 서빙)의 파일은 구매자에게 직접 노출하지 않고, 게시 시점에 data/shop-public/<uid>/로
// 사본을 만들어 공개 라우트(/api/shop-public)로만 서빙한다. 썸네일(thumbnail_ref)도
// 이때 원장에서 함께 복사한다 — 재게시하면 사본만 덮어써서 구매자는 항상 게시본을 본다.

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, copyFile, readdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getProduct, updateProduct } from '@/lib/db/products';
import { getFile } from '@/lib/db/super-editor-files';
import { isProductDetailSnapshot } from '@/lib/super-editor/product/types';
import { toPublishedDetail } from '@/lib/super-editor/product/published';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PUBLIC_BASE = path.join(process.cwd(), 'data', 'shop-public');
const MAX_SIZE = 15 * 1024 * 1024; // 15MB — 폭 860 JPEG는 이 안에 들어와야 정상
const MAX_SECTION_IMAGE_SIZE = 10 * 1024 * 1024; // 섹션 이미지 1장 상한

// 섹션 id는 파일명에 들어가므로 형식을 강제한다(경로 조작 방지) — types.ts 생성 규칙과 일치
const SAFE_SECTION_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/jpeg': 'jpg',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await params;
  const product = getProduct(productId);
  if (!product || product.user_id !== session.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const detail = formData.get('detail') as File | null;
  if (!detail) return NextResponse.json({ error: 'detail file required' }, { status: 400 });
  if (detail.size > MAX_SIZE) {
    return NextResponse.json({ error: `상세 이미지가 너무 큽니다 (최대 ${MAX_SIZE / 1024 / 1024}MB)` }, { status: 413 });
  }

  const userDir = path.join(PUBLIC_BASE, session.sub);
  await mkdir(userDir, { recursive: true });
  const now = Date.now();
  const warnings: string[] = [];

  // 1) 상세 JPEG 보관 — 고정 이름 + ?v= 캐시 버스팅(재게시 시 사본 교체)
  const detailName = `detail-${productId}.jpg`;
  await writeFile(path.join(userDir, detailName), Buffer.from(await detail.arrayBuffer()));
  const detailPath = `/api/shop-public/${session.sub}/${detailName}?v=${now}`;

  // 2) 썸네일 사본 — 회원이 지정한 원장 파일(thumbnail_ref)을 공개 디렉토리로 복사
  let thumbnailPath = product.thumbnail_path;
  if (product.thumbnail_ref) {
    const record = getFile(product.thumbnail_ref);
    if (record && record.user_id === session.sub) {
      const src = path.join(process.cwd(), 'data', 'super-editor-files', session.sub, record.filename);
      if (existsSync(src)) {
        const ext = record.filename.split('.').pop() ?? 'jpg';
        const thumbName = `thumb-${productId}.${ext}`;
        await copyFile(src, path.join(userDir, thumbName));
        thumbnailPath = `/api/shop-public/${session.sub}/${thumbName}?v=${now}`;
      } else {
        warnings.push('썸네일 원본 파일을 찾지 못해 썸네일은 갱신하지 않았습니다');
      }
    } else {
      warnings.push('지정된 썸네일이 원장에 없어 썸네일은 갱신하지 않았습니다');
    }
  } else {
    warnings.push('썸네일이 지정되지 않았습니다 — 상품 편집에서 썸네일을 선택해주세요');
  }

  // 3) 칸칸 HTML 게시본 — 브라우저가 만든 스냅샷 JSON + 섹션 이미지의 공개 사본.
  //    JPEG와 같은 원칙(서버는 저장만): 이미지 바이트도 브라우저가 원장에서 해석해
  //    보내므로 원장 위치(OPFS/드라이브)와 무관하게 게시된다. 스냅샷이 없으면
  //    기존 JPEG 게시본만 갱신한다(구형 게시 경로 그대로 동작).
  let detailJsonPath = product.detail_json_path;
  const snapshotRaw = formData.get('snapshot');
  if (typeof snapshotRaw === 'string') {
    let parsed: unknown = null;
    try { parsed = JSON.parse(snapshotRaw); } catch { /* 아래 가드가 처리 */ }

    if (!isProductDetailSnapshot(parsed)) {
      warnings.push('스냅샷 형식이 올바르지 않아 HTML 게시본은 갱신하지 않았습니다');
    } else {
      // 재게시 시 이전 섹션 이미지 사본 정리 — 섹션 구성이 바뀌어도 찌꺼기가 안 쌓이게
      const stalePrefix = `detail-${productId}-sec-`;
      for (const name of await readdir(userDir)) {
        if (name.startsWith(stalePrefix)) await unlink(path.join(userDir, name));
      }

      const srcBySection: Record<string, string> = {};
      for (const section of parsed.sections) {
        if (section.kind !== 'image' || !SAFE_SECTION_ID.test(section.id)) continue;
        const file = formData.get(`image-${section.id}`);
        if (!(file instanceof File) || file.size === 0) continue;
        if (file.size > MAX_SECTION_IMAGE_SIZE) {
          warnings.push(`섹션 이미지가 너무 커서 제외했습니다 (${section.id}, 최대 ${MAX_SECTION_IMAGE_SIZE / 1024 / 1024}MB)`);
          continue;
        }
        const ext = EXT_BY_MIME[file.type] ?? 'jpg';
        const name = `${stalePrefix}${section.id}.${ext}`;
        await writeFile(path.join(userDir, name), Buffer.from(await file.arrayBuffer()));
        srcBySection[section.id] = `/api/shop-public/${session.sub}/${name}?v=${now}`;
      }

      const { detail: published, skipped } = toPublishedDetail(parsed, srcBySection);
      for (const skip of skipped) warnings.push(`${skip.label} — ${skip.reason}`);

      await writeFile(
        path.join(userDir, `detail-${productId}.json`),
        JSON.stringify(published),
      );
      detailJsonPath = `/api/shop-public/${session.sub}/detail-${productId}.json?v=${now}`;
    }
  }

  const updated = updateProduct(productId, session.sub, {
    detail_image_path: detailPath,
    thumbnail_path:    thumbnailPath,
    detail_json_path:  detailJsonPath,
  });
  return NextResponse.json({ ok: true, product: updated, warnings });
}
