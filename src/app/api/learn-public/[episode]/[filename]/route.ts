// 학습 공개 자산 서빙 — 인증 없음(학습자용). data/learn-public/<episodeNo>/ 아래의
// "게시된 사본"만 서빙한다(원장 파일 직접 서빙 금지 — shop-public과 같은 공개/비공개 경계).
// 파일명은 게시 라우트가 만든 고정 규칙(video.mp4/card-*/illust-*/episode.json)뿐이고,
// ?v= 캐시 버스팅을 쓰므로 캐시는 하루면 충분하다.
//
// HTTP Range/206 지원: 영상 재생바 탐색은 "moov가 앞(faststart — buildVideoMp4가 보장)"
// + "서버가 구간 요청을 받아줌" 두 조건이 모두 필요하다. Range를 무시하고 200 전체를
// 돌려주면 브라우저가 버퍼 밖 지점으로 탐색하지 못한다(뒤로 끌기 안 되는 버그의 원인).
// 구간은 fs.open으로 해당 바이트만 읽는다 — 영상(최대 100MB)에서 탐색마다 전체를 읽지
// 않기 위함. 다중 구간(bytes=a-b,c-d)은 스펙상 무시가 허용되므로 200 전체로 응답한다.

import { NextRequest, NextResponse } from 'next/server';
import { readFile, open, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', json: 'application/json',
};

/** 단일 Range 헤더 해석 — 대상 아님(null) / 범위 밖('unsatisfiable') / 구간 */
function parseRange(header: string | null, size: number):
  | { start: number; end: number }
  | 'unsatisfiable'
  | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null; // 형식 불명·다중 구간 → Range 무시(200 전체)
  if (!m[1]) {
    // 접미 구간 bytes=-N: 끝에서 N바이트
    const suffix = Number(m[2]);
    if (suffix === 0) return 'unsatisfiable';
    const start = Math.max(0, size - suffix);
    return { start, end: size - 1 };
  }
  const start = Number(m[1]);
  if (start >= size) return 'unsatisfiable';
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start > end) return 'unsatisfiable';
  return { start, end };
}

/** 파일에서 [start, end] 구간만 읽는다 — 전체 readFile 없이 */
async function readRange(filePath: string, start: number, end: number): Promise<Buffer> {
  const fh = await open(filePath, 'r');
  try {
    const length = end - start + 1;
    const buffer = Buffer.alloc(length);
    await fh.read(buffer, 0, length, start);
    return buffer;
  } finally {
    await fh.close();
  }
}

export async function GET(
  req: NextRequest,
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
    const { size } = await stat(filePath);
    const baseHeaders = {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes',
    };

    const range = parseRange(req.headers.get('range'), size);
    if (range === 'unsatisfiable') {
      return new NextResponse(null, {
        status: 416,
        headers: { ...baseHeaders, 'Content-Range': `bytes */${size}` },
      });
    }
    if (range) {
      const buffer = await readRange(filePath, range.start, range.end);
      return new NextResponse(new Uint8Array(buffer), {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { ...baseHeaders, 'Content-Length': String(size) },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
