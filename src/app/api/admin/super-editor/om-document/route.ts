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
import { getBlock, updateBlock } from '@/lib/super-editor/object-model/store';
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
