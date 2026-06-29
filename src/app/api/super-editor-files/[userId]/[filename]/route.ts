import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return new NextResponse(null, { status: 401 });

  const { userId, filename } = await params;

  // 경로 탐색 공격 방지
  if (/[/\\]/.test(userId) || /[/\\]/.test(filename)) {
    return new NextResponse(null, { status: 400 });
  }

  // 본인 파일만 접근 가능
  if (session.sub !== userId) {
    return new NextResponse(null, { status: 403 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME[ext];
  if (!mime) return new NextResponse(null, { status: 400 });

  const filePath = path.join(process.cwd(), 'data', 'super-editor-files', userId, filename);
  if (!existsSync(filePath)) return new NextResponse(null, { status: 404 });

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
