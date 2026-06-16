import { NextRequest } from 'next/server';
import { updateOrderStatus, getOrderById } from '@/lib/db/orders';
import { OrderStatus } from '@/types/order';

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const order = updateOrderStatus(id, status);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  return Response.json({ order });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ order });
}
