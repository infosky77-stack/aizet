import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getClient, updateClient, deleteClient } from '@/lib/db/tax-clients';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId = session?.sub ?? 'demo';
  const client = getClient(id, userId);
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ client });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId = session?.sub ?? 'demo';
  const body = await req.json();

  const client = updateClient(id, userId, {
    name:       body.name       !== undefined ? String(body.name).trim()       : undefined,
    biz_number: body.biz_number !== undefined ? String(body.biz_number).trim() : undefined,
    contact:    body.contact    !== undefined ? String(body.contact).trim()    : undefined,
    phone:      body.phone      !== undefined ? String(body.phone).trim()      : undefined,
    email:      body.email      !== undefined ? String(body.email).trim()      : undefined,
    memo:       body.memo       !== undefined ? String(body.memo).trim()       : undefined,
  });
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ client });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId = session?.sub ?? 'demo';
  const ok = deleteClient(id, userId);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ok: true });
}
