import { NextRequest } from 'next/server';
import { createOrder } from '@/lib/db/orders';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tableNumber, items } = body;

  if (!tableNumber || !items?.length) {
    return Response.json({ error: 'tableNumber and items required' }, { status: 400 });
  }

  const totalAmount = items.reduce(
    (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
    0
  );

  const order = createOrder({
    tableNumber,
    items,
    status: 'confirmed',
    totalAmount,
  });

  return Response.json({ order });
}

export async function GET() {
  const { getOrders } = await import('@/lib/db/orders');
  return Response.json({ orders: getOrders() });
}
