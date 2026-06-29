import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { processNextJob } from '@/lib/render/RenderQueue';
import { getUser } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/render-queue/process  → 큐 처리 트리거 (슈퍼관리자 전용)
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user?.is_super_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const result = await processNextJob();
  return Response.json(result);
}
