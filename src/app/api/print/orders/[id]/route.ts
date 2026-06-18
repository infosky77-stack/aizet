import { NextRequest, NextResponse } from 'next/server';
import { getPrintOrder, updatePrintOrderStatus } from '@/lib/db/print';
import { PrintOrderStatus } from '@/types/print';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getPrintOrder(id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json() as { status: PrintOrderStatus };
  const order = updatePrintOrderStatus(id, status);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}
