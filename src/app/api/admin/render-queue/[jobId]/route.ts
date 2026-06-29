import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getJob } from '@/lib/render/RenderQueue';
import { getUser } from '@/lib/users';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/render-queue/[jobId]
// → 해당 주문의 소유자 또는 슈퍼관리자만 접근 가능
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 });

  // 소유자 확인: 잡의 order_id → media_orders.user_id
  const order = db.prepare<[string], { user_id: string }>(
    'SELECT user_id FROM media_orders WHERE id=?'
  ).get(job.order_id);

  const user = getUser(session.sub);
  const isOwner      = order?.user_id === session.sub;
  const isSuperAdmin = !!user?.is_super_admin;

  if (!isOwner && !isSuperAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json({
    job: {
      id:          job.id,
      order_id:    job.order_id,
      job_type:    job.job_type,
      status:      job.status,
      output_uuid: job.output_uuid,
      output_path: job.output_path,
      output_type: job.output_type,
      queued_at:   job.queued_at,
      started_at:  job.started_at,
      done_at:     job.done_at,
      error_msg:   job.error_msg,
    },
  });
}
