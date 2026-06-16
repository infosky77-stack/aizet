'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export interface ConfirmedItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Props {
  items: ConfirmedItem[];
  tableNumber: number;
  onDone: () => void;
}

export function OrderConfirmCard({ items, tableNumber, onDone }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleConfirm() {
    setStatus('loading');
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, items }),
    });
    setStatus('done');
    setTimeout(onDone, 1800);
  }

  return (
    <div className="mx-2 my-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="bg-amber-600 px-4 py-2.5 flex items-center gap-2">
        <CheckCircle size={16} className="text-white" />
        <span className="text-white font-semibold text-sm">주문 확인</span>
        <span className="text-amber-200 text-xs ml-auto">테이블 {tableNumber}번</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {status === 'done' ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle size={36} className="text-amber-600" />
            <p className="font-bold text-stone-800">주문이 접수되었습니다!</p>
            <p className="text-sm text-stone-500">잠시 후 조리를 시작합니다</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-stone-800">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-amber-200 pt-2 flex justify-between">
              <span className="font-bold text-stone-800">합계</span>
              <span className="font-bold text-amber-700 text-base">
                {total.toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={status === 'loading'}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  접수 중...
                </>
              ) : (
                '주문 확정하기'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
