import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const OUTPUT_BASE = path.join(process.cwd(), 'data', 'render-output');
const MAX_SIZE = 30 * 1024 * 1024; // 30MB — 리사이즈된 도록 PDF는 이 안에 들어와야 정상

// POST multipart: { orderId, pdf } — 브라우저에서 만든 도록 PDF를 서버에 보관(재다운로드용).
// 도록 PDF 자체를 여기서 "생성"하지 않는다 — 이미 완성된 파일을 저장만 한다.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const orderId = formData.get('orderId') as string | null;
  const pdf = formData.get('pdf') as File | null;
  if (!orderId || !pdf) return NextResponse.json({ error: 'orderId and pdf required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.order_type !== 'catalog') {
    return NextResponse.json({ error: 'catalog only' }, { status: 400 });
  }
  if (pdf.size > MAX_SIZE) {
    return NextResponse.json({ error: `PDF too large (max ${MAX_SIZE / 1024 / 1024}MB)` }, { status: 413 });
  }

  const uuid = randomUUID();
  const userDir = path.join(OUTPUT_BASE, session.sub);
  const outPath = path.join(userDir, `${uuid}.pdf`);
  const relPath = `data/render-output/${session.sub}/${uuid}.pdf`;

  await mkdir(userDir, { recursive: true });
  const buffer = Buffer.from(await pdf.arrayBuffer());
  await writeFile(outPath, buffer);

  const now = Date.now();
  db.prepare(`
    INSERT INTO render_jobs (id, order_id, job_type, worker_type, status, priority, queued_at, started_at, done_at, output_uuid, output_path, output_type)
    VALUES (?, ?, 'catalog', 'browser_client', 'done', 0, ?, ?, ?, ?, ?, 'pdf')
  `).run(randomUUID(), orderId, now, now, now, uuid, relPath);

  db.prepare(`
    UPDATE media_orders SET status='done', output_uuid=?, updated_at=? WHERE id=?
  `).run(uuid, now, orderId);

  return NextResponse.json({ ok: true, outputUuid: uuid });
}
