import { NextRequest } from 'next/server';
import { updateOrderPayment } from '@/lib/db/orders';
import { PaymentMethod } from '@/types/order';

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount) {
    return Response.json({ error: 'paymentKey, orderId, amount required' }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });
  }

  const encoded = Buffer.from(secretKey + ':').toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
  });

  const data = await tossRes.json();
  if (!tossRes.ok) {
    return Response.json({ error: data.message ?? '결제 승인 실패' }, { status: tossRes.status });
  }

  // TossPayments method → our PaymentMethod
  let paymentMethod: PaymentMethod = 'card';
  const provider = data.easyPay?.provider as string | undefined;
  if (provider === 'KAKAOPAY') paymentMethod = 'kakao';
  else if (provider === 'NAVERPAY') paymentMethod = 'naver';
  else if (provider === 'TOSSPAY') paymentMethod = 'toss';

  const order = updateOrderPayment(orderId, 'paid', paymentMethod);
  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  return Response.json({ order });
}
