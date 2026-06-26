'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, RotateCcw, Home } from 'lucide-react';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get('code') ?? '';
  const message = searchParams.get('message') ?? '결제 중 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId') ?? '';

  const isUserCancel = code === 'PAY_PROCESS_CANCELED';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-amber-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 flex flex-col items-center gap-4">
          <XCircle size={52} className={isUserCancel ? 'text-stone-400' : 'text-red-400'} />
          <p className="font-bold text-stone-700 text-xl">
            {isUserCancel ? '결제 취소됨' : '결제 실패'}
          </p>
          <p className="text-sm text-stone-500 text-center">{decodeURIComponent(message)}</p>
          {code && !isUserCancel && (
            <p className="text-xs text-stone-400 font-mono bg-stone-50 px-3 py-1 rounded-lg">{code}</p>
          )}
        </div>

        <div className="flex gap-2">
          {orderId && (
            <button
              onClick={() => router.replace(`/payment?orderId=${orderId}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RotateCcw size={15} />
              다시 시도
            </button>
          )}
          <button
            onClick={() => router.replace('/demo')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-stone-300 text-stone-700 hover:border-amber-400 hover:text-amber-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Home size={15} />
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailContent />
    </Suspense>
  );
}
