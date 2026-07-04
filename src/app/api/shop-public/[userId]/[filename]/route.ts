// 쇼핑몰 공개 자산 서빙 — 인증 없음(구매자용). data/shop-public/<userId>/ 아래의
// "게시된 사본"만 서빙한다(원장 파일 직접 서빙 금지 — 공개/비공개 경계).
// 파일명은 게시 라우트가 만든 고정 규칙(detail-*/thumb-*)뿐이고, ?v= 캐시 버스팅을 쓰므로
// 캐시는 하루면 충분하다.

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const { userId, filename } = await params;

  // 경로 탐색 공격 방지 (super-editor-files 서빙과 동일 가드)
  if (/[/\\]/.test(userId) || /[/\\]/.test(filename) || userId.includes('..') || filename.includes('..')) {
    return new NextResponse(null, { status: 400 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME[ext];
  if (!mime) return new NextResponse(null, { status: 400 });

  const filePath = path.join(process.cwd(), 'data', 'shop-public', userId, filename);
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
