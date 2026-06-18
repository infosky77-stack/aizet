import { NextRequest, NextResponse } from 'next/server';
import { getLabel } from '@/lib/db/print-files';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const label = getLabel(id);
  if (!label) return NextResponse.json({ error: '라벨 없음' }, { status: 404 });
  return NextResponse.json({ label });
}
