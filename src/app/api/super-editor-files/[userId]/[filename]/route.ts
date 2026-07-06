import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveReadPath } from '@/lib/super-editor/filePaths';
import { getSiteContext } from '@/lib/registry/siteContext';

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

  // 선택적 ?siteId= — 있으면 소유 검증 후 new(siteId) 우선/old 폴백, 없으면 old만(기존과 100% 동일).
  // 소유가 아니거나 없는 siteId면 siteId를 무시하고 old로 폴백한다(무중단 + 남의 siteId 격리 우회 방지).
  let effectiveSiteId: string | null = req.nextUrl.searchParams.get('siteId');
  if (effectiveSiteId && !getSiteContext(effectiveSiteId, session.sub)) {
    effectiveSiteId = null;
  }

  const filePath = resolveReadPath(userId, effectiveSiteId, filename);
  if (!filePath) return new NextResponse(null, { status: 404 });

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
