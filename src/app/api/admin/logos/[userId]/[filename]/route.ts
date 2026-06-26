import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, filename } = await params;

  // 본인 로고만 접근 가능
  if (userId !== session.sub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // 경로 traversal 방지
  if (!/^[\w-]+\.jpg$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'data', 'logos', userId, filename);
  if (!existsSync(filePath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const buffer = await readFile(filePath);
  return new Response(buffer, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' },
  });
}
