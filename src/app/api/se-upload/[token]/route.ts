import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import { validateToken, notifyChannel } from '@/lib/mobile-upload-store';
import { insertFile } from '@/lib/db/super-editor-files';
import { resolveWritePath } from '@/lib/super-editor/filePaths';
import { getSiteContext } from '@/lib/registry/siteContext';
import { bootstrapSite } from '@/lib/siteDb/siteDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIME_TO_TYPE: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image',
  'image/heic': 'image', 'image/heif': 'image',
  'video/mp4': 'video', 'video/quicktime': 'video', 'video/webm': 'video',
};

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

// GET — 토큰 유효성 확인 (모바일 페이지 진입 시 호출)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const entry = validateToken(token);
  if (!entry) return NextResponse.json({ error: 'token_expired' }, { status: 410 });
  return NextResponse.json({ ok: true, orderId: entry.orderId });
}

// POST multipart — 스마트폰에서 파일 업로드
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const entry = validateToken(token);
  if (!entry) return NextResponse.json({ error: 'token_expired' }, { status: 410 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'file too large (max 200MB)' }, { status: 413 });

  // HEIC/HEIF 등 MIME 불확실한 경우 확장자로 보정
  let mime = file.type;
  if (!mime || mime === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const fallback: Record<string, string> = {
      heic: 'image/heic', heif: 'image/heif',
      mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    };
    mime = fallback[ext] ?? mime;
  }

  const fileType = MIME_TO_TYPE[mime] ?? 'image';
  const ext = EXT_MAP[mime] ?? (file.name.split('.').pop() ?? 'jpg');
  const filename = `${randomUUID()}.${ext}`;

  // 토큰에 siteId가 각인돼 있으면 PC 업로드와 동일 패턴으로 격리 저장한다(실물 new + 메타 siteDb,
  // 3자 일치). 세션이 없는 모바일 업로드이므로 소유 검증은 세션 대신 토큰의 userId로 재확인한다
  // (getSiteContext는 memberId 인자를 받는데, 여기선 발급 시 세션 소유자였던 entry.userId를 넘김).
  // siteId가 없으면(옛 토큰) effSiteId=null → resolveWritePath가 old(userDir)에 쓰고 메타는 싱글턴.
  const effSiteId: string | null = entry.siteId ?? null;
  let siteHandle: Database.Database | null = null;
  if (effSiteId) {
    const ctx = getSiteContext(effSiteId, entry.userId);
    if (!ctx) return NextResponse.json({ error: 'Forbidden: not site owner' }, { status: 403 });
    siteHandle = bootstrapSite(ctx.dbPath);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dest = resolveWritePath(entry.userId, effSiteId, filename); // siteId 있으면 new(sites/<siteId>/), 없으면 old
    await writeFile(dest, buffer);

    let record: ReturnType<typeof insertFile>;
    try {
      record = insertFile({
        userId: entry.userId, filename, origName: file.name || filename, fileType, mimeType: mime,
        sizeBytes: file.size, orderId: entry.orderId,
      }, siteHandle ?? undefined);
    } catch {
      // 메타 삽입 실패 → 방금 new 경로에 쓴 실물만 롤백(old·기존 파일은 건드리지 않음)
      if (effSiteId) { try { await unlink(dest); } catch { /* 롤백 실패는 무시 */ } }
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    const url = `/api/super-editor-files/${entry.userId}/${filename}`;

    // SSE로 PC 편집 화면에 notify (공유 store 사용 → 같은 채널 Map)
    notifyChannel(entry.orderId, {
      type: 'file_uploaded',
      url,
      filename,
      fileId: record.id,
      fileType,
    });

    return NextResponse.json({ ok: true, url, filename });
  } finally {
    siteHandle?.close();
  }
}
