import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getFiling, updateFiling, deleteFiling, FilingStatus } from '@/lib/db/tax-filings';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const filing  = getFiling(id, userId);
  if (!filing) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ filing });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const body    = await req.json();

  const filing = updateFiling(id, userId, {
    client_id: body.client_id,
    type:      body.type,
    year:      body.year  !== undefined ? Number(body.year)  : undefined,
    month:     body.month !== undefined ? Number(body.month) : undefined,
    due_date:  body.due_date,
    status:    body.status as FilingStatus | undefined,
    memo:      body.memo  !== undefined ? String(body.memo).trim() : undefined,
  });
  if (!filing) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ filing });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const ok      = deleteFiling(id, userId);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ok: true });
}
