import { NextRequest } from 'next/server';
import { createOrder, DELIVERY_FEE } from '@/lib/db/orders';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderType, tableNumber, deliveryAddress, items, note } = body;

  if (!orderType || !items?.length) {
    return Response.json({ error: 'orderType and items required' }, { status: 400 });
  }
  if (orderType === 'dine-in' && !tableNumber) {
    return Response.json({ error: 'tableNumber required for dine-in' }, { status: 400 });
  }
  if (orderType === 'delivery' && !deliveryAddress) {
    return Response.json({ error: 'deliveryAddress required for delivery' }, { status: 400 });
  }

  const itemsTotal = items.reduce(
    (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
    0
  );
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : undefined;
  const totalAmount = itemsTotal + (deliveryFee ?? 0);

  const order = createOrder({
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
    deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
    items,
    status: 'confirmed',
    totalAmount,
    deliveryFee,
    estimatedDeliveryMinutes: orderType === 'delivery' ? 30 : undefined,
    paymentStatus: 'unpaid',
    note,
  });

  return Response.json({ order });
}

export async function GET() {
  const { getOrders } = await import('@/lib/db/orders');
  return Response.json({ orders: getOrders() });
}
