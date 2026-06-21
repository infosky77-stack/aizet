'use client';

import { Order } from '@/types/order';
import { X, Printer } from 'lucide-react';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: '신용/체크카드',
  cash: '현금',
  kakao: '카카오페이',
  naver: '네이버페이',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: '미결제',
  pending: '승인 대기',
  paid: '결제 완료',
};

const ORDER_STATUS_LABEL: Partial<Record<string, string>> = {
  refunded: '환불완료',
  partially_refunded: '부분환불',
};

interface Props {
  order: Order;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: Props) {
  const isRefunded = order.status === 'refunded' || order.status === 'partially_refunded';

  const formattedDate = new Date(order.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedRefundDate = order.refundedAt
    ? new Date(order.refundedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const itemsTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 32px 40px !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xs flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 - 인쇄 시 숨김 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 print:hidden">
            <span className="font-bold text-stone-800 text-sm">영수증</span>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* 영수증 본문 - 인쇄 대상 영역 */}
          <div className="px-6 py-5 font-mono text-sm receipt-print-area">
            {/* 매장명 */}
            <div className="text-center mb-4">
              <p className="text-base font-bold tracking-widest">중화가정</p>
              <p className="text-[11px] text-stone-400 mt-0.5">신세계백화점 의정부점 9층 · 매일 11:00~21:00</p>
              <div className="border-t border-dashed border-stone-300 mt-3" />
            </div>

            {/* 주문 정보 */}
            <div className="space-y-1 text-[11px] mb-3">
              <div className="flex justify-between gap-2">
                <span className="text-stone-500 shrink-0">주문번호</span>
                <span className="font-semibold text-right truncate">{order.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-stone-500 shrink-0">주문일시</span>
                <span className="text-right">{formattedDate}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-stone-500 shrink-0">주문유형</span>
                <span className="text-right">
                  {order.orderType === 'dine-in'
                    ? `매장 (테이블 ${order.tableNumber}번)`
                    : '배달'}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-stone-300 mb-3" />

            {/* 항목 헤더 */}
            <div className="flex justify-between text-[10px] text-stone-400 mb-2">
              <span className="flex-1">메뉴</span>
              <div className="flex shrink-0 text-right">
                <span className="w-6">수량</span>
                <span className="w-16 ml-2">단가</span>
                <span className="w-16 ml-2">금액</span>
              </div>
            </div>

            {/* 주문 항목 */}
            <div className="space-y-1.5 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="flex-1 truncate pr-2">{item.name}</span>
                  <div className="flex shrink-0 text-right">
                    <span className="w-6">{item.quantity}</span>
                    <span className="w-16 ml-2">{item.price.toLocaleString()}</span>
                    <span className="w-16 ml-2 font-medium">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 배달료 */}
            {order.deliveryFee !== undefined && (
              <>
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>소계</span>
                  <span>{itemsTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>배달료</span>
                  <span>{order.deliveryFee.toLocaleString()}원</span>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-stone-300 mb-3" />

            {/* 합계 */}
            <div className="flex justify-between font-bold text-sm mb-3">
              <span>합 계</span>
              <span>{order.totalAmount.toLocaleString()}원</span>
            </div>

            {/* 결제 정보 */}
            <div className="space-y-1 text-[11px] mb-4">
              <div className="flex justify-between">
                <span className="text-stone-500">결제수단</span>
                <span>
                  {order.paymentMethod
                    ? PAYMENT_METHOD_LABEL[order.paymentMethod]
                    : '미선택'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">결제상태</span>
                <span
                  className={
                    isRefunded
                      ? 'text-red-600 font-semibold'
                      : order.paymentStatus === 'paid'
                      ? 'text-emerald-600 font-semibold'
                      : 'text-amber-600 font-semibold'
                  }
                >
                  {isRefunded
                    ? ORDER_STATUS_LABEL[order.status]
                    : PAYMENT_STATUS_LABEL[order.paymentStatus]}
                </span>
              </div>
            </div>

            {/* 환불 정보 */}
            {isRefunded && (
              <>
                <div className="border-t border-dashed border-red-200 mb-3" />
                <div className="space-y-1 text-[11px] mb-4 bg-red-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-bold text-red-600 mb-1.5 uppercase tracking-wide">
                    환불 내역
                  </p>
                  <div className="flex justify-between">
                    <span className="text-red-500">환불 유형</span>
                    <span className="text-red-700 font-semibold">
                      {order.status === 'refunded' ? '전체 환불' : '부분 환불'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-500">환불 금액</span>
                    <span className="text-red-700 font-bold">
                      -{(order.refundAmount ?? 0).toLocaleString()}원
                    </span>
                  </div>
                  {formattedRefundDate && (
                    <div className="flex justify-between">
                      <span className="text-red-500">처리 일시</span>
                      <span className="text-red-700">{formattedRefundDate}</span>
                    </div>
                  )}
                  {order.refundReason && (
                    <div className="flex justify-between gap-2">
                      <span className="text-red-500 shrink-0">환불 사유</span>
                      <span className="text-red-700 text-right">{order.refundReason}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-dashed border-stone-300 mb-3" />
            <p className="text-center text-[11px] text-stone-400">
              감사합니다. 또 방문해 주세요!
            </p>
          </div>

          {/* 인쇄 버튼 - 인쇄 시 숨김 */}
          <div className="px-5 py-4 border-t border-stone-100 print:hidden">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-stone-800 hover:bg-stone-900 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Printer size={15} />
              인쇄하기 (Ctrl+P)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
