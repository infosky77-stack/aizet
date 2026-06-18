import { NextRequest, NextResponse } from 'next/server';
import { getPrintOrders, createPrintOrder } from '@/lib/db/print';
import { PrintOrder } from '@/types/print';

export async function GET() {
  return NextResponse.json({ orders: getPrintOrders() });
}

export async function POST(req: NextRequest) {
  const data = await req.json() as Omit<PrintOrder, 'id' | 'createdAt' | 'updatedAt'>;
  const order = createPrintOrder(data);
  return NextResponse.json({ order }, { status: 201 });
}
