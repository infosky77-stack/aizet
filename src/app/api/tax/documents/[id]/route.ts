import { NextRequest } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getDocument, updateDocument, softDeleteDocument, restoreDocument, recordEdits } from '@/lib/db/tax-documents';
import { getValidAccessToken } from '@/lib/drive-auth';
import { deleteFromDrive } from '@/lib/drive-upload';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const doc     = getDocument(id, userId);
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id }  = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const body    = await req.json();

  // 복구 요청
  if (body.restore) {
    const doc = restoreDocument(id, userId);
    if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ document: doc });
  }

  const existing = getDocument(id, userId);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  const patch = {
    doc_date:     body.doc_date     !== undefined ? (body.doc_date || null)                    : undefined,
    amount:       body.amount       !== undefined ? (body.amount ? Number(body.amount) : null) : undefined,
    vendor:       body.vendor       !== undefined ? String(body.vendor).trim()                 : undefined,
    category:     body.category     !== undefined ? String(body.category).trim()               : undefined,
    ai_confirmed: body.ai_confirmed !== undefined ? (body.ai_confirmed ? 1 : 0)               : undefined,
  };

  // 변경된 필드만 이력 기록
  const TRACKED = ['doc_date', 'amount', 'vendor', 'category', 'ai_confirmed'] as const;
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
  for (const field of TRACKED) {
    const newVal = patch[field];
    if (newVal === undefined) continue;
    const oldRaw = existing[field as keyof typeof existing];
    const oldStr = oldRaw == null ? null : String(oldRaw);
    const newStr = newVal == null ? null : String(newVal);
    if (oldStr !== newStr) changes.push({ field, oldValue: oldStr, newValue: newStr });
  }
  if (changes.length > 0) {
    recordEdits(id, userId, session?.email ?? session?.sub ?? 'unknown', changes);
  }

  const doc = updateDocument(id, userId, patch);
  return Response.json({ document: doc });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id }  = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const body    = await req.json().catch(() => ({}));

  const existing = getDocument(id, userId);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  // 영구 삭제 (purge=true, 관리자 또는 만료 처리)
  if (body.purge) {
    // 로컬 파일 삭제
    if (existing.local_path) {
      const absPath = path.join(process.cwd(), existing.local_path);
      if (existsSync(absPath)) await unlink(absPath).catch(() => {});
    }
    // Drive 파일 삭제
    if (existing.drive_file_id && session?.refreshToken) {
      try {
        const accessToken = await getValidAccessToken(session);
        await deleteFromDrive(accessToken, existing.drive_file_id);
      } catch (e) {
        console.warn('[Drive] 삭제 실패 (skip):', e instanceof Error ? e.message : e);
      }
    }
    const { default: db } = await import('@/lib/db');
    db.prepare('DELETE FROM tax_documents WHERE id=? AND user_id=?').run(id, userId);
    return Response.json({ ok: true, purged: true });
  }

  // 소프트 삭제
  const deletedBy = session?.email ?? 'unknown';
  const doc = softDeleteDocument(id, userId, deletedBy);
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ document: doc });
}
