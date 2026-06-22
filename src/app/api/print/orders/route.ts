import { NextRequest, NextResponse } from 'next/server';
import { getPrintOrders, createPrintOrder } from '@/lib/db/print';
import { PrintOrder } from '@/types/print';

const AZOS_URL = process.env.AZOS_URL ?? 'http://localhost:8080';

export async function GET() {
  return NextResponse.json({ orders: getPrintOrders() });
}

export async function POST(req: NextRequest) {
  const data = await req.json() as Omit<PrintOrder, 'id' | 'createdAt' | 'updatedAt'>;
  const order = createPrintOrder(data);

  // Submit print-order task to AZOS
  let azosTaskId: string | null = null;
  try {
    const taskRes = await fetch(`${AZOS_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'print-order',
        payload: {
          orderId: order.id,
          productName: order.productName,
          category: order.category,
          quantity: order.options.quantity,
          totalPrice: order.totalPrice,
          customerName: order.customerName,
          memo: order.memo ?? '',
        },
        priority: 200,
      }),
    });
    const taskData = await taskRes.json();
    azosTaskId = taskData.id ?? null;
  } catch {
    // AZOS 전송 실패는 주문 저장과 무관하게 진행
  }

  return NextResponse.json({ order, azosTaskId }, { status: 201 });
}
