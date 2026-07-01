import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';
import db from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uuid } = await params;

  // render_jobs 에서 output_uuid → 소유자 확인 + 파일 경로 조회
  const job = db.prepare<[string], {
    output_path: string | null;
    output_type: string | null;
    order_id: string;
  }>(
    'SELECT output_path, output_type, order_id FROM render_jobs WHERE output_uuid=?'
  ).get(uuid);

  if (!job || !job.output_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 소유자 or 슈퍼관리자만 접근
  const order = db.prepare<[string], { user_id: string }>(
    'SELECT user_id FROM media_orders WHERE id=?'
  ).get(job.order_id);

  const user = getUser(session.sub);
  if (order?.user_id !== session.sub && !user?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), job.output_path);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const stat = statSync(filePath);
  const contentType = job.output_type === 'pdf' ? 'application/pdf' : 'video/mp4';
  const filename    = `${uuid}.${job.output_type === 'pdf' ? 'pdf' : 'mp4'}`;

  // Range 요청 지원 (영상 seek)
  const rangeHeader = req.headers.get('range');
  if (rangeHeader && contentType === 'video/mp4') {
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : stat.size - 1;
    const chunk = end - start + 1;

    const stream = createReadStream(filePath, { start, end });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': String(chunk),
        'Content-Type':   contentType,
      },
    });
  }

  const stream = createReadStream(filePath);
  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type':        contentType,
      'Content-Length':      String(stat.size),
      'Content-Disposition': `inline; filename="${filename}"`,
      'Accept-Ranges':       'bytes',
      'Cache-Control':       'private, max-age=3600',
    },
  });
}
