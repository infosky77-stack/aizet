import { NextRequest, NextResponse } from 'next/server';
import { getFilesByClient, addClientFile, getClient } from '@/lib/db/print-files';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ files: getFilesByClient(id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) return NextResponse.json({ error: '거래처 없음' }, { status: 404 });

  const body = await req.json();
  if (!body.product || !body.filename || !body.fileType || !body.sizeBytes) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const existing = getFilesByClient(id).filter(f => f.product === body.product);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map(f => f.version)) + 1 : 1;

  const file = addClientFile({
    clientId: id,
    product: body.product,
    filename: body.filename,
    fileType: body.fileType,
    version: nextVersion,
    isLatest: true,
    sizeBytes: body.sizeBytes,
    tags: body.tags,
  });
  return NextResponse.json({ file }, { status: 201 });
}
