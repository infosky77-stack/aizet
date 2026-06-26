import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getDocument } from '@/lib/db/tax-documents';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const doc     = getDocument(id, userId);

  if (!doc || !doc.local_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const absPath = path.join(process.cwd(), doc.local_path);
  if (!existsSync(absPath)) {
    return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
  }

  const buffer = await readFile(absPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        doc.mime_type,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.filename)}"`,
      'Cache-Control':       'private, max-age=3600',
    },
  });
}
