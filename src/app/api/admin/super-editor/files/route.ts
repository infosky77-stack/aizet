import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { getSessionFromRequest } from '@/lib/auth';
import {
  insertFile, listFiles, deleteFile, getFile, renameFile, reorderFiles,
  findExactDuplicate, listOrigNames, resolveAvailableName, FileType,
} from '@/lib/db/super-editor-files';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder, listDriveFiles } from '@/lib/drive-folder';
import { getSiteContext } from '@/lib/registry/siteContext';
import { bootstrapSite } from '@/lib/siteDb/siteDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIME_TO_TYPE: Record<string, FileType> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image',
  'image/gif': 'image',  'image/svg+xml': 'image',
  'video/mp4': 'video',  'video/quicktime': 'video', 'video/webm': 'video',
  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio',
};

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif',  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',  'video/quicktime': 'mov', 'video/webm': 'webm',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a',
};

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

function userDir(userId: string): string {
  return path.join(process.cwd(), 'data', 'super-editor-files', userId);
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// 중복/이름충돌 판정 — 윈도우 탐색기 방식, 주문(폴더) 단위로 격리:
//  - 이름·내용 완전 동일          → outcome 'duplicate' (저장 안 함, 기존 레코드 반환)
//  - 이름만 같고 내용 다름        → outcome 'renamed'   ("이름 (1).ext" 로 저장)
//  - 그 외(새 이름 또는 내용 다름) → outcome 'created'
// orderId가 null이면(독립 파일 관리자 페이지) "주문 미지정 파일들끼리"만 비교 — 다른 주문 폴더와는 무관.
function judgeNameConflict(
  userId: string, desiredName: string, contentHash: string, orderId: string | null,
): { outcome: 'duplicate'; existing: ReturnType<typeof findExactDuplicate> } | { outcome: 'created' | 'renamed'; finalName: string } {
  const exact = findExactDuplicate(userId, desiredName, contentHash, orderId);
  if (exact) return { outcome: 'duplicate', existing: exact };

  const existingNames = listOrigNames(userId, orderId);
  const finalName = resolveAvailableName(existingNames, desiredName);
  return { outcome: finalName === desiredName ? 'created' : 'renamed', finalName };
}

// GET /api/admin/super-editor/files?type=image|video|audio&orderId=xxx
// GET /api/admin/super-editor/files?source=drive  → Drive 파일 목록
// orderId 생략 시 계정 전체(독립 파일 관리자 페이지 — 기존 동작 그대로 유지)
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const source = req.nextUrl.searchParams.get('source');

  if (source === 'drive') {
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(session);
    } catch {
      return Response.json({ error: 'token_refresh_failed' }, { status: 401 });
    }
    try {
      const folderId = await ensureAizetFolder(accessToken);
      const files = await listDriveFiles(accessToken, folderId);
      return Response.json({ files });
    } catch {
      return Response.json({ error: 'drive_list_failed' }, { status: 502 });
    }
  }

  const type    = req.nextUrl.searchParams.get('type') as FileType | null;
  const orderId = req.nextUrl.searchParams.get('orderId');
  const siteId  = req.nextUrl.searchParams.get('siteId');

  // siteId가 있으면 그 홈페이지 전용 siteDb에서 읽는다(읽기 전용 파일럿).
  // 소유자 검증은 getSiteContext가 수행 — 소유자 아님/없는 siteId면 null → 빈 목록으로 거부
  // (에러로 터뜨리지 않음). siteId가 없으면 기존과 100% 동일하게 싱글턴(aizet.db)에서 읽는다.
  if (siteId) {
    const ctx = getSiteContext(siteId, session.sub);
    if (!ctx) return Response.json({ files: [] });
    const siteDb = bootstrapSite(ctx.dbPath);
    try {
      const files = listFiles(session.sub, type ?? undefined, orderId ?? undefined, siteDb);
      return Response.json({ files });
    } finally {
      siteDb.close();
    }
  }

  const files = listFiles(session.sub, type ?? undefined, orderId ?? undefined);
  return Response.json({ files });
}

// POST multipart: PC 직접 업로드
// POST JSON { driveFileId, driveName, driveMime, driveSize }: Drive에서 가져오기
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    // Drive 가져오기
    const { driveFileId, driveName, driveMime, driveSize, orderId } = await req.json() as {
      driveFileId: string;
      driveName:   string;
      driveMime:   string;
      driveSize:   string;
      orderId?:    string;
    };

    if (!driveFileId || !driveMime) {
      return Response.json({ error: 'driveFileId and driveMime required' }, { status: 400 });
    }

    const fileType = MIME_TO_TYPE[driveMime];
    if (!fileType) {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(session);
    } catch {
      return Response.json({ error: 'token_refresh_failed' }, { status: 401 });
    }

    // Drive에서 파일 다운로드
    const dlRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!dlRes.ok) {
      return Response.json({ error: 'drive_download_failed' }, { status: 502 });
    }

    const buffer = Buffer.from(await dlRes.arrayBuffer());
    const contentHash = sha256(buffer);
    const judged = judgeNameConflict(session.sub, driveName, contentHash, orderId ?? null);
    if (judged.outcome === 'duplicate') {
      return Response.json({ file: judged.existing, outcome: 'duplicate' });
    }

    const ext = EXT_MAP[driveMime] ?? 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const dir = userDir(session.sub);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    const record = insertFile({
      userId: session.sub, filename, origName: judged.finalName, fileType, mimeType: driveMime,
      sizeBytes: parseInt(driveSize ?? '0', 10) || buffer.byteLength, contentHash, orderId,
    });
    return Response.json(
      { file: record, outcome: judged.outcome, originalName: judged.outcome === 'renamed' ? driveName : undefined },
      { status: 201 },
    );
  }

  // multipart 업로드
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
  const orderId = (formData.get('orderId') as string | null) ?? undefined;

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large (max 200 MB)' }, { status: 413 });
  }

  const mime = file.type;
  const fileType = MIME_TO_TYPE[mime];
  if (!fileType) {
    return Response.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentHash = sha256(buffer);
  const judged = judgeNameConflict(session.sub, file.name, contentHash, orderId ?? null);
  if (judged.outcome === 'duplicate') {
    // 이름·내용 완전 동일 — 디스크에 새로 쓰지 않고 기존 레코드를 그대로 반환
    return Response.json({ file: judged.existing, outcome: 'duplicate' });
  }

  const ext = EXT_MAP[mime] ?? 'bin';
  const filename = `${randomUUID()}.${ext}`;
  const dir = userDir(session.sub);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  const record = insertFile({
    userId: session.sub, filename, origName: judged.finalName, fileType, mimeType: mime,
    sizeBytes: file.size, contentHash, orderId,
  });
  return Response.json(
    { file: record, outcome: judged.outcome, originalName: judged.outcome === 'renamed' ? file.name : undefined },
    { status: 201 },
  );
}

// PATCH { fileId, name }        → 이름 변경 (충돌 시 서버가 자동으로 "(1)" 접미사)
// PATCH { order: string[] }     → 순서 변경 (앞에 있는 id가 먼저 표시됨)
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { fileId?: string; name?: string; order?: string[] } | null;
  if (!body) return Response.json({ error: 'Invalid body' }, { status: 400 });

  if (Array.isArray(body.order)) {
    reorderFiles(session.sub, body.order);
    return Response.json({ ok: true });
  }

  if (body.fileId && typeof body.name === 'string') {
    const trimmed = body.name.trim();
    if (!trimmed) return Response.json({ error: 'name required' }, { status: 400 });
    const updated = renameFile(body.fileId, session.sub, trimmed);
    if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ file: updated });
  }

  return Response.json({ error: 'fileId+name or order required' }, { status: 400 });
}

// DELETE /api/admin/super-editor/files?fileId=xxx
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return Response.json({ error: 'fileId required' }, { status: 400 });

  const record = getFile(fileId);
  if (!record || record.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = path.join(userDir(session.sub), record.filename);
  if (existsSync(filePath)) await unlink(filePath);

  deleteFile(fileId, session.sub);
  return Response.json({ ok: true });
}
