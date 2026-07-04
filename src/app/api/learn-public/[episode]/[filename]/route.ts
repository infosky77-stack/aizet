// 학습 공개 자산 서빙 — 인증 없음(학습자용). data/learn-public/<episodeNo>/ 아래의
// "게시된 사본"만 서빙한다(원장 파일 직접 서빙 금지 — shop-public과 같은 공개/비공개 경계).
// 파일명은 게시 라우트가 만든 고정 규칙(video.mp4/card-*/illust-*/episode.json)뿐이고,
// ?v= 캐시 버스팅을 쓰므로 캐시는 하루면 충분하다.

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', json: 'application/json',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ episode: string; filename: string }> },
) {
  const { episode, filename } = await params;

  // 경로 탐색 공격 방지 — episode는 숫자만, filename은 구분자 금지(shop-public과 동일 가드)
  if (!/^\d{1,4}$/.test(episode) || /[/\\]/.test(filename) || filename.includes('..')) {
    return new NextResponse(null, { status: 400 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME[ext];
  if (!mime) return new NextResponse(null, { status: 400 });

  const filePath = path.join(process.cwd(), 'data', 'learn-public', episode, filename);
  if (!existsSync(filePath)) return new NextResponse(null, { status: 404 });

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
