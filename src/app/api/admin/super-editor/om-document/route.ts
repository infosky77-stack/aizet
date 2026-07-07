// AIZET Object Model — 문서 편집용 로드(GET)·저장(PATCH) API.
//
// om-preview(읽기 전용 렌더)와 달리, 이 라우트는 편집 화면(DocumentEditor)이 쓰는 데이터 API다.
// 기존 admin/super-editor write 라우트 관례 그대로: 세션 memberId 취득 → getSiteContext(소유 검증,
// 아니면 403) → bootstrapSite(ctx.dbPath) → try { store 호출 } finally { close }. 렌더는 안 하고
// DocumentTree(JSON)만 돌려준다 — 미리보기는 클라이언트가 순수 renderHtml로 그린다.

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSiteContext } from '@/lib/registry/siteContext';
import { bootstrapSite } from '@/lib/siteDb/siteDb';
import { getBlock, updateBlock, createBlock, deleteBlock } from '@/lib/super-editor/object-model/store';
import { loadDocumentTree } from '@/lib/super-editor/object-model/model';
import type { BlockData, BlockKind } from '@/lib/super-editor/object-model/types';

// fs를 쓰는 렌더러는 여기서 안 부르지만, siteDb(better-sqlite3)가 Node 전용이라 Node 런타임 필수.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

/** kind별 data 최소 검증(1차) — 핵심 필드 타입만 확인. 통과하면 정규화된 data 반환, 아니면 null. */
function validateData(kind: string, raw: unknown): BlockData | null {
  if (raw === null || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  switch (kind as BlockKind) {
    case 'heading': {
      if (typeof d.text !== 'string') return null;
      const level = d.level === 1 || d.level === 2 || d.level === 3 ? d.level : 1;
      return { level, text: d.text } as BlockData;
    }
    case 'paragraph':
      return typeof d.text === 'string' ? ({ text: d.text } as BlockData) : null;
    case 'image':
      // src는 1차엔 편집 안 하지만 저장 시 보존해야 하므로 문자열로 받되, alt/caption만 필수 문자열
      if (typeof d.alt !== 'string' || typeof d.caption !== 'string') return null;
      return { src: typeof d.src === 'string' ? d.src : '', alt: d.alt, caption: d.caption } as BlockData;
    case 'list':
      return { ordered: !!d.ordered } as BlockData;
    case 'list_item':
      return typeof d.text === 'string' ? ({ text: d.text } as BlockData) : null;
    default:
      return null; // 모르는 kind는 편집 대상 아님
  }
}

// GET /api/admin/super-editor/om-document?siteId=...&documentId=...
export async function GET(req: NextRequest): Promise<Response> {
  const session = getSessionFromRequest(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const siteId = req.nextUrl.searchParams.get('siteId');
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (!siteId || !documentId) return json({ error: 'siteId and documentId required' }, 400);

  const ctx = getSiteContext(siteId, session.sub);
  if (!ctx) return json({ error: 'Forbidden: not site owner' }, 403);

  const handle = bootstrapSite(ctx.dbPath);
  try {
    const tree = loadDocumentTree(handle, documentId);
    if (!tree) return json({ error: 'Document not found' }, 404);
    return json({ tree });
  } finally {
    handle.close();
  }
}

// POST /api/admin/super-editor/om-document  { siteId, documentId, images: [{ filename, alt?, caption? }, ...] }
//
// 업로드로 이미 저장된 이미지 파일명 배열을 받아, 각 파일의 서빙 URL(src)을 "서버가" 조립해
// image 블록으로 문서 맨 끝에 순서대로 추가한다(createBlock, position 자동 부여). 클라이언트는
// userId/서빙경로를 몰라도 되고 filename만 넘긴다(session.sub를 서버가 URL에 각인 → 격리 유지).
// 갱신된 tree(JSON)를 반환 → 미리보기는 클라이언트가 renderHtml로 그린다.
export async function POST(req: NextRequest): Promise<Response> {
  const session = getSessionFromRequest(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null) as
    { siteId?: string; documentId?: string; images?: unknown } | null;
  if (!body || !body.siteId || !body.documentId) {
    return json({ error: 'siteId and documentId required' }, 400);
  }
  if (!Array.isArray(body.images) || body.images.length === 0) {
    return json({ error: 'images (non-empty array) required' }, 400);
  }

  // 파일명 검증 — 저장 파일명은 randomUUID().<ext> 형태. 화이트리스트로 경로조작('..','/','\\') 원천 차단.
  const items: { filename: string; alt: string; caption: string }[] = [];
  for (const raw of body.images) {
    if (raw === null || typeof raw !== 'object') return json({ error: 'invalid image item' }, 400);
    const it = raw as Record<string, unknown>;
    const filename = typeof it.filename === 'string' ? it.filename : '';
    if (!filename || !/^[A-Za-z0-9._-]+$/.test(filename)) {
      return json({ error: 'invalid filename' }, 400);
    }
    items.push({
      filename,
      alt:     typeof it.alt === 'string' ? it.alt : '',
      caption: typeof it.caption === 'string' ? it.caption : '',
    });
  }

  const ctx = getSiteContext(body.siteId, session.sub);
  if (!ctx) return json({ error: 'Forbidden: not site owner' }, 403);

  const handle = bootstrapSite(ctx.dbPath);
  try {
    // 없는 문서에 orphan 블록을 붙이지 않도록 존재 확인
    if (!loadDocumentTree(handle, body.documentId)) return json({ error: 'Document not found' }, 404);

    // 서빙 URL을 서버가 조립 — userId는 세션에서 취득(클라 전달 아님). files 서빙 라우트 규칙 재사용.
    const uid = encodeURIComponent(session.sub);
    const sid = encodeURIComponent(body.siteId);
    for (const it of items) {
      const src = `/api/super-editor-files/${uid}/${encodeURIComponent(it.filename)}?siteId=${sid}`;
      createBlock(handle, {
        documentId: body.documentId,
        parentId:   null,
        kind:       'image',
        data:       { src, alt: it.alt, caption: it.caption },
      });
    }
    const tree = loadDocumentTree(handle, body.documentId);
    return json({ tree });
  } finally {
    handle.close();
  }
}

// PATCH /api/admin/super-editor/om-document  { siteId, documentId, blockId, data }
export async function PATCH(req: NextRequest): Promise<Response> {
  const session = getSessionFromRequest(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null) as
    { siteId?: string; documentId?: string; blockId?: string; data?: unknown } | null;
  if (!body || !body.siteId || !body.documentId || !body.blockId) {
    return json({ error: 'siteId, documentId, blockId required' }, 400);
  }

  const ctx = getSiteContext(body.siteId, session.sub);
  if (!ctx) return json({ error: 'Forbidden: not site owner' }, 403);

  const handle = bootstrapSite(ctx.dbPath);
  try {
    // 블록이 그 문서에 속하는지 확인(다른 문서/사업장 블록 수정 차단)
    const block = getBlock(handle, body.blockId);
    if (!block || block.document_id !== body.documentId) {
      return json({ error: 'Block not found in document' }, 404);
    }
    // data가 그 블록 kind에 맞는지 최소 검증
    const data = validateData(block.kind, body.data);
    if (!data) return json({ error: 'Invalid data for block kind' }, 400);

    updateBlock(handle, body.blockId, { data });
    const tree = loadDocumentTree(handle, body.documentId);
    if (!tree) return json({ error: 'Document not found' }, 404);
    return json({ tree });
  } finally {
    handle.close();
  }
}

// DELETE /api/admin/super-editor/om-document  (body JSON) { siteId, documentId, blockIds: string[] }
//
// 문서에서 블록을 "여러 개 한 번에 제거"한다(윈도우 탐색기식 다중선택 삭제).
// store.deleteBlock: 블록당 서브트리 삭제 + 형제 position 재인덱싱 포함. 전체를 한 트랜잭션으로 원자화.
// 실물 파일(super-editor-files)은 절대 건드리지 않는다 — 완전 삭제는 파일 관리자 휴지통의 별도 기능.
// 각 blockId가 그 문서에 속하는지 확인해 다른 문서/사업장 블록은 건너뛴다(선택분만 안전 삭제).
// 하위호환: 단일 blockId가 와도 [blockId] 배열로 감싸 처리한다. 갱신된 tree와 deletedCount 반환.
export async function DELETE(req: NextRequest): Promise<Response> {
  const session = getSessionFromRequest(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null) as
    { siteId?: string; documentId?: string; blockIds?: unknown; blockId?: unknown } | null;
  const siteId     = body?.siteId ?? null;
  const documentId = body?.documentId ?? null;
  // 다중(blockIds) 우선, 단일(blockId)은 하위호환으로 배열로 흡수. 문자열 아닌/빈 값은 걸러낸다.
  const rawIds = Array.isArray(body?.blockIds)
    ? body!.blockIds
    : (typeof body?.blockId === 'string' ? [body.blockId] : []);
  const blockIds = (rawIds as unknown[]).filter((v): v is string => typeof v === 'string' && v.length > 0);

  if (!siteId || !documentId) {
    return json({ error: 'siteId, documentId required' }, 400);
  }
  if (blockIds.length === 0) {
    return json({ error: 'blockIds (non-empty array) required' }, 400);
  }

  const ctx = getSiteContext(siteId, session.sub);
  if (!ctx) return json({ error: 'Forbidden: not site owner' }, 403);

  const handle = bootstrapSite(ctx.dbPath);
  try {
    // 한 트랜잭션에서: 각 blockId가 그 문서에 속하는지 확인 후 삭제(안 속하는 id는 건너뜀).
    // 실물 파일은 무접촉 — 문서에서 블록만 제거.
    let deletedCount = 0;
    const tx = handle.transaction(() => {
      for (const blockId of blockIds) {
        const block = getBlock(handle, blockId);
        if (!block || block.document_id !== documentId) continue; // 다른 문서/사업장 블록 차단
        deleteBlock(handle, blockId);
        deletedCount += 1;
      }
    });
    tx();
    const tree = loadDocumentTree(handle, documentId);
    if (!tree) return json({ error: 'Document not found' }, 404);
    return json({ tree, deletedCount });
  } finally {
    handle.close();
  }
}
