import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/auth';
import { insertFile, listFiles, deleteFile, getFile, FileType } from '@/lib/db/super-editor-files';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder, listDriveFiles } from '@/lib/drive-folder';

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

// GET /api/admin/super-editor/files?type=image|video|audio
// GET /api/admin/super-editor/files?source=drive  → Drive 파일 목록
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

  const type = req.nextUrl.searchParams.get('type') as FileType | null;
  const files = listFiles(session.sub, type ?? undefined);
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
    const { driveFileId, driveName, driveMime, driveSize } = await req.json() as {
      driveFileId: string;
      driveName:   string;
      driveMime:   string;
      driveSize:   string;
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
    const ext = EXT_MAP[driveMime] ?? 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const dir = userDir(session.sub);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    const record = insertFile(
      session.sub, filename, driveName, fileType, driveMime,
      parseInt(driveSize ?? '0', 10) || buffer.byteLength,
    );
    return Response.json({ file: record }, { status: 201 });
  }

  // multipart 업로드
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large (max 200 MB)' }, { status: 413 });
  }

  const mime = file.type;
  const fileType = MIME_TO_TYPE[mime];
  if (!fileType) {
    return Response.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const ext = EXT_MAP[mime] ?? 'bin';
  const filename = `${randomUUID()}.${ext}`;
  const dir = userDir(session.sub);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const record = insertFile(session.sub, filename, file.name, fileType, mime, file.size);
  return Response.json({ file: record }, { status: 201 });
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
