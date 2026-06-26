'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Order } from '@/types/order';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { CheckCircle, Receipt, Home, Loader2, AlertCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const amount = searchParams.get('amount') ?? '';

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setError('잘못된 접근입니다.');
      return;
    }

    fetch('/api/payments/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        else setError(data.error ?? '결제 승인 중 오류가 발생했습니다.');
      })
      .catch(() => setError('네트워크 오류가 발생했습니다.'));
  }, [paymentKey, orderId, amount]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-amber-50 to-[#fafaf8]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-red-100 p-8 flex flex-col items-center gap-4">
          <AlertCircle size={44} className="text-red-400" />
          <p className="font-bold text-red-700 text-lg">결제 승인 실패</p>
          <p className="text-sm text-stone-500 text-center">{error}</p>
          <button
            onClick={() => router.replace(`/payment?orderId=${orderId}`)}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-amber-500" />
          <p className="text-sm">결제를 승인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-amber-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center gap-3">
          <CheckCircle size={52} className="text-emerald-500" />
          <p className="font-bold text-emerald-700 text-xl">결제 완료</p>
          <p className="text-sm text-emerald-600 text-center">
            {order.totalAmount.toLocaleString()}원 결제가 확인되었습니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-3">
          <p className="font-semibold text-stone-700 text-sm">주문 내역</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-stone-600">{item.name} × {item.quantity}</span>
              <span className="text-stone-800 font-medium">{(item.price * item.quantity).toLocaleString()}원</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-stone-100 pt-3">
            <span className="text-stone-700">합계</span>
            <span className="text-amber-700">{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-stone-300 text-stone-700 hover:border-amber-400 hover:text-amber-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Receipt size={15} />
            영수증 보기
          </button>
          <button
            onClick={() => router.replace('/demo')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Home size={15} />
            홈으로
          </button>
        </div>
      </div>

      {showReceipt && <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
