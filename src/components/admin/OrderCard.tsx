'use client';

import { Order, OrderStatus } from '@/types/order';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
};
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:   '접수하기',
  confirmed: '조리 시작',
  preparing: '완료 처리',
  ready:     '서빙 완료',
};

interface Props {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  compact?: boolean;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

export function OrderCard({ order, onStatusChange, compact }: Props) {
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden',
        order.status === 'pending' && 'border-yellow-300 shadow-yellow-50',
        order.status === 'ready' && 'border-green-300 shadow-green-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <div className="flex items-center gap-3">
          <span className="font-bold text-stone-800">테이블 {order.tableNumber}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-xs text-stone-400">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Items */}
      {!compact && (
        <div className="px-4 py-3 flex flex-col gap-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-stone-700">{item.name} × {item.quantity}</span>
              <span className="text-stone-500">{(item.price * item.quantity).toLocaleString()}원</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-stone-50 mt-1">
            <span>합계</span>
            <span className="text-amber-700">{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {compact && (
        <div className="px-4 py-2 text-sm text-stone-500">
          {order.items.map((i) => i.name).join(', ')} · {order.totalAmount.toLocaleString()}원
        </div>
      )}

      {/* Action */}
      {nextStatus && (
        <div className="px-4 py-3 border-t border-stone-50 flex gap-2">
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {STATUS_LABEL[order.status]}
            <ChevronRight size={14} />
          </button>
          {order.status !== 'delivered' && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="px-3 py-2 border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400 text-sm rounded-xl transition-colors"
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  );
}
