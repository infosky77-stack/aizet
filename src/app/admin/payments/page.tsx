'use client';

import { useEffect, useState, useCallback } from 'react';
import { Order, PaymentMethod } from '@/types/order';
import { PaymentBadge } from '@/components/admin/PaymentBadge';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { RefundModal } from '@/components/admin/RefundModal';
import { CreditCard, Smartphone, Banknote, Truck, CheckCircle, Clock, AlertCircle, Receipt, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: '카드',
  kakao: '카카오페이',
  naver: '네이버페이',
  toss: '토스페이',
  cash: '현금',
};

const METHOD_ICON: Record<PaymentMethod, React.ElementType> = {
  card: CreditCard,
  kakao: Smartphone,
  naver: Smartphone,
  toss: Smartphone,
  cash: Banknote,
};

type FilterTab = 'all' | 'unpaid' | 'pending' | 'paid';

const TABS: { value: FilterTab; label: string; color: string }[] = [
  { value: 'all', label: '전체', color: 'stone' },
  { value: 'unpaid', label: '미결제', color: 'red' },
  { value: 'pending', label: '승인 대기', color: 'yellow' },
  { value: 'paid', label: '결제 완료', color: 'emerald' },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const { orders: o } = await res.json();
    setOrders(o);
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 5000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function handleConfirmPayment(orderId: string) {
    setLoading(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    });
    await fetchOrders();
    setLoading(null);
  }

  async function handleMarkUnpaid(orderId: string) {
    setLoading(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'unpaid' }),
    });
    await fetchOrders();
    setLoading(null);
  }

  const filtered = orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    if (tab === 'all') return true;
    return o.paymentStatus === tab;
  });

  const countBy = (t: FilterTab) => {
    const base = orders.filter((o) => o.status !== 'cancelled');
    if (t === 'all') return base.length;
    return base.filter((o) => o.paymentStatus === t).length;
  };

  const totalPaid = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalPending = orders
    .filter((o) => o.paymentStatus === 'pending')
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalUnpaid = orders
    .filter((o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled')
    .reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">결제 관리</h1>
        <span className="flex items-center gap-1.5 text-xs text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          5초마다 자동 갱신
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-stone-500">결제 완료</span>
          </div>
          <p className="text-xl font-bold text-stone-800">{totalPaid.toLocaleString()}원</p>
          <p className="text-xs text-stone-400 mt-0.5">{countBy('paid')}건</p>
        </div>

        <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock size={16} className="text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-stone-500">승인 대기</span>
          </div>
          <p className="text-xl font-bold text-stone-800">{totalPending.toLocaleString()}원</p>
          <p className="text-xs text-stone-400 mt-0.5">{countBy('pending')}건</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={16} className="text-red-400" />
            </div>
            <span className="text-sm font-medium text-stone-500">미결제</span>
          </div>
          <p className="text-xl font-bold text-stone-800">{totalUnpaid.toLocaleString()}원</p>
          <p className="text-xs text-stone-400 mt-0.5">{countBy('unpaid')}건</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ value, label }) => {
          const count = countBy(value);
          return (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
                tab === value
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              )}
            >
              {label}
              <span className={clsx(
                'text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold',
                tab === value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payment table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
          해당하는 결제 내역이 없습니다
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs">주문</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs">내역</th>
                <th className="text-right px-4 py-3 font-semibold text-stone-500 text-xs">금액</th>
                <th className="text-center px-4 py-3 font-semibold text-stone-500 text-xs">결제 방법</th>
                <th className="text-center px-4 py-3 font-semibold text-stone-500 text-xs">상태</th>
                <th className="text-center px-4 py-3 font-semibold text-stone-500 text-xs">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const MethodIcon = order.paymentMethod ? METHOD_ICON[order.paymentMethod] : null;
                return (
                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {order.orderType === 'delivery' ? (
                          <span className="flex items-center gap-1 font-semibold text-stone-700">
                            <Truck size={12} className="text-blue-500" />
                            배달
                          </span>
                        ) : (
                          <span className="font-semibold text-stone-700">테이블 {order.tableNumber}번</span>
                        )}
                        <span className="text-xs text-stone-400">{timeAgo(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-stone-600 line-clamp-1">
                        {order.items.map((i) => `${i.name}×${i.quantity}`).join(', ')}
                      </p>
                      {order.deliveryFee && (
                        <p className="text-xs text-stone-400">배달료 {order.deliveryFee.toLocaleString()}원 포함</p>
                      )}
                      {order.refundAmount !== undefined && (
                        <p className="text-xs text-red-500 mt-0.5">
                          환불 -{order.refundAmount.toLocaleString()}원
                          {order.refundReason && ` · ${order.refundReason}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                      {order.totalAmount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.paymentMethod ? (
                        <span className="flex items-center justify-center gap-1 text-stone-600">
                          {MethodIcon && <MethodIcon size={13} />}
                          {METHOD_LABEL[order.paymentMethod]}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs">미선택</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {order.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handleConfirmPayment(order.id)}
                            disabled={loading === order.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {loading === order.id ? '처리 중...' : '결제 승인'}
                          </button>
                        )}
                        {order.paymentStatus === 'paid' &&
                          order.status !== 'refunded' &&
                          order.status !== 'partially_refunded' && (
                            <>
                              <button
                                onClick={() => handleMarkUnpaid(order.id)}
                                disabled={loading === order.id}
                                className="px-2.5 py-1.5 border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                              >
                                결제취소
                              </button>
                              <button
                                onClick={() => setRefundTarget(order)}
                                disabled={loading === order.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                              >
                                <RotateCcw size={11} />
                                환불
                              </button>
                            </>
                          )}
                        {(order.status === 'refunded' ||
                          order.status === 'partially_refunded') && (
                          <span className="text-xs font-semibold text-red-500 px-1">
                            {order.status === 'refunded' ? '환불완료' : '부분환불'}
                          </span>
                        )}
                        {order.paymentStatus === 'unpaid' && (
                          <span className="text-xs text-stone-300">대기</span>
                        )}
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                          title="영수증 보기"
                        >
                          <Receipt size={12} />
                          영수증
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
      {refundTarget && (
        <RefundModal
          order={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={() => { setRefundTarget(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}
