import { NextRequest } from 'next/server';
import { updateOrderStatus, updateOrderPayment, getOrderById } from '@/lib/db/orders';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types/order';

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled',
];
const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending', 'paid'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['card', 'cash', 'kakao', 'naver'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }
    const order = updateOrderStatus(id, body.status);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json({ order });
  }

  if (body.paymentStatus) {
    if (!VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return Response.json({ error: 'Invalid paymentStatus' }, { status: 400 });
    }
    if (body.paymentMethod && !VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return Response.json({ error: 'Invalid paymentMethod' }, { status: 400 });
    }
    const order = updateOrderPayment(id, body.paymentStatus, body.paymentMethod);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json({ order });
  }

  return Response.json({ error: 'Nothing to update' }, { status: 400 });
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
