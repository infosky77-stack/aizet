import { NextRequest } from 'next/server';
import { updateOrderPayment } from '@/lib/db/orders';
import { PaymentMethod } from '@/types/order';

const VALID_METHODS: PaymentMethod[] = ['card', 'cash', 'kakao', 'naver'];

export async function POST(req: NextRequest) {
  const { orderId, paymentMethod } = await req.json();

  if (!orderId || !VALID_METHODS.includes(paymentMethod)) {
    return Response.json({ error: 'orderId and valid paymentMethod required' }, { status: 400 });
  }

  const order = updateOrderPayment(orderId, 'pending', paymentMethod);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  return Response.json({ order });
}

export async function PATCH(req: NextRequest) {
  const { orderId, paymentStatus } = await req.json();

  if (!orderId || !['unpaid', 'pending', 'paid'].includes(paymentStatus)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const order = updateOrderPayment(orderId, paymentStatus);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  return Response.json({ order });
}
