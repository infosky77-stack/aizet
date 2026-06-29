import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listJobs, countByStatus } from '@/lib/render/RenderQueue';
import { getUser } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/render-queue  → 큐 상태 조회 (슈퍼관리자 전용)
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const jobs   = listJobs(50);
  const counts = countByStatus();
  return Response.json({ jobs, counts });
}
