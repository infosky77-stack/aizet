'use client';

import { useState } from 'react';
import { Order } from '@/types/order';
import { X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  order: Order;
  onClose: () => void;
  onRefunded: () => void;
}

export function RefundModal({ order, onClose, onRefunded }: Props) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const parsedAmount = parseInt(refundAmount, 10);
  const isAmountValid =
    refundType === 'full' ||
    (!isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= order.totalAmount);
  const canSubmit = refundReason.trim().length > 0 && isAmountValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          refundType,
          refundAmount: refundType === 'partial' ? parsedAmount : order.totalAmount,
          refundReason: refundReason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? '환불 처리 중 오류가 발생했습니다.');
        return;
      }
      onRefunded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <span className="font-bold text-stone-800 text-sm">환불 처리</span>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 주문 요약 */}
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-100">
          <p className="text-[11px] text-stone-400 mb-1">환불 대상 주문</p>
          <p className="text-xs font-mono text-stone-500">{order.id}</p>
          <p className="text-sm text-stone-700 mt-1 line-clamp-1">
            {order.items.map((i) => `${i.name}×${i.quantity}`).join(', ')}
          </p>
          <p className="text-base font-bold text-amber-700 mt-0.5">
            {order.totalAmount.toLocaleString()}원 결제
          </p>
        </div>

        {/* 폼 */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* 환불 유형 */}
          <div>
            <p className="text-xs font-semibold text-stone-600 mb-2">환불 유형</p>
            <div className="grid grid-cols-2 gap-2">
              {(['full', 'partial'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setRefundType(t);
                    if (t === 'full') setRefundAmount('');
                  }}
                  className={clsx(
                    'py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors',
                    refundType === t
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  )}
                >
                  {t === 'full' ? '전체 환불' : '부분 환불'}
                </button>
              ))}
            </div>
          </div>

          {/* 부분환불 금액 입력 */}
          {refundType === 'partial' && (
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                환불 금액{' '}
                <span className="text-stone-400 font-normal">
                  (1원 ~ {order.totalAmount.toLocaleString()}원)
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min={1}
                  max={order.totalAmount}
                  placeholder="환불할 금액 입력"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-red-400 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                  원
                </span>
              </div>
              {refundAmount !== '' && !isAmountValid && (
                <p className="text-xs text-red-500 mt-1.5">
                  1원 이상 {order.totalAmount.toLocaleString()}원 이하로 입력하세요.
                </p>
              )}
            </div>
          )}

          {/* 환불 사유 */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">
              환불 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="환불 사유를 입력하세요 (필수)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-5 py-4 border-t border-stone-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 text-stone-500 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={clsx(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors',
              canSubmit
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            )}
          >
            {submitting ? '처리 중...' : '환불 처리'}
          </button>
        </div>
      </div>
    </div>
  );
}
