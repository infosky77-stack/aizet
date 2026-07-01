import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { validateToken, notifyChannel } from '@/lib/mobile-upload-store';
import { insertFile } from '@/lib/db/super-editor-files';

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

function userDir(userId: string): string {
  return path.join(process.cwd(), 'data', 'super-editor-files', userId);
}

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
  const dir = userDir(entry.userId);

  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const record = insertFile(entry.userId, filename, file.name || filename, fileType, mime, file.size);
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
}
