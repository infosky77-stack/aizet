import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDocumentEdits } from '@/lib/db/tax-documents';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: Params) {
  const { id }  = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const edits   = getDocumentEdits(id, userId);
  return Response.json({ edits });
}
