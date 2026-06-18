import { NextRequest, NextResponse } from 'next/server';
import { getClient, getFilesByClient } from '@/lib/db/print-files';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) return NextResponse.json({ error: '거래처 없음' }, { status: 404 });
  const files = getFilesByClient(id);
  return NextResponse.json({ client, files });
}
