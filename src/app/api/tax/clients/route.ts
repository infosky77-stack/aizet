import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listClients, createClient } from '@/lib/db/tax-clients';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  // 데모용: 세션 없으면 demo user id로 조회
  const userId = session?.sub ?? 'demo';
  const clients = listClients(userId);
  return Response.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId = session?.sub ?? 'demo';
  const body = await req.json();

  const name = (body.name ?? '').trim();
  if (!name) {
    return Response.json({ error: '거래처명은 필수입니다.' }, { status: 400 });
  }

  const client = createClient(userId, {
    name,
    biz_number: (body.biz_number ?? '').trim(),
    contact:    (body.contact ?? '').trim(),
    phone:      (body.phone ?? '').trim(),
    email:      (body.email ?? '').trim(),
    memo:       (body.memo ?? '').trim(),
  });
  return Response.json({ client }, { status: 201 });
}
