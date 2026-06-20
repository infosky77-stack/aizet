'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { Robot } from '@/types/robot';
import { OrderStatusBadge } from './OrderStatusBadge';
import { PaymentBadge } from './PaymentBadge';
import { ReceiptModal } from './ReceiptModal';
import { ChevronRight, Bot, Truck, CreditCard, MapPin, Receipt } from 'lucide-react';
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
  onDispatchRobot?: (orderId: string, tableNumber: number, robotId: string) => void;
  onConfirmPayment?: (orderId: string) => void;
  robots?: Robot[];
  compact?: boolean;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

export function OrderCard({ order, onStatusChange, onDispatchRobot, onConfirmPayment, robots = [], compact }: Props) {
  const [showReceipt, setShowReceipt] = useState(false);
  const nextStatus = STATUS_FLOW[order.status];
  const idleRobot = robots.find((r) => r.status === 'idle' && r.batteryLevel > 20);
  const dispatchedRobot = order.robotId ? robots.find((r) => r.id === order.robotId) : undefined;

  const canDispatchRobot =
    order.orderType === 'dine-in' &&
    order.status === 'ready' &&
    !order.robotId &&
    !!idleRobot;

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden',
        order.status === 'pending' && 'border-yellow-300 shadow-yellow-50',
        order.status === 'ready' && 'border-green-300 shadow-green-50',
        order.orderType === 'delivery' && 'border-blue-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <div className="flex items-center gap-2 flex-wrap">
          {order.orderType === 'delivery' ? (
            <span className="flex items-center gap-1 font-bold text-stone-800">
              <Truck size={14} className="text-blue-500" />
              배달
            </span>
          ) : (
            <span className="font-bold text-stone-800">테이블 {order.tableNumber}</span>
          )}
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
        <span className="text-xs text-stone-400 shrink-0">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Delivery address */}
      {order.orderType === 'delivery' && order.deliveryAddress && (
        <div className="px-4 py-2 bg-blue-50 flex items-start gap-1.5 text-xs text-blue-700">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{order.deliveryAddress}</span>
        </div>
      )}

      {/* Robot status */}
      {dispatchedRobot && (
        <div className="px-4 py-2 bg-emerald-50 flex items-center gap-1.5 text-xs text-emerald-700">
          <Bot size={12} />
          {dispatchedRobot.name} 출동 중
        </div>
      )}

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

      {/* Actions */}
      <div className="px-4 py-3 border-t border-stone-50 flex flex-col gap-2">
        <div className="flex gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {STATUS_LABEL[order.status]}
              <ChevronRight size={14} />
            </button>
          )}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="px-3 py-2 border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400 text-sm rounded-xl transition-colors"
            >
              취소
            </button>
          )}
        </div>

        {/* Robot dispatch */}
        {canDispatchRobot && onDispatchRobot && idleRobot && (
          <button
            onClick={() => onDispatchRobot(order.id, order.tableNumber!, idleRobot.id)}
            className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Bot size={14} />
            로봇 호출 ({idleRobot.name})
          </button>
        )}

        {/* Payment confirm */}
        {order.paymentStatus === 'pending' && onConfirmPayment && (
          <button
            onClick={() => onConfirmPayment(order.id)}
            className="flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <CreditCard size={14} />
            결제 확인
          </button>
        )}

        {/* Receipt */}
        <button
          onClick={() => setShowReceipt(true)}
          className="flex items-center justify-center gap-1.5 py-2 border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 text-sm rounded-xl transition-colors"
        >
          <Receipt size={14} />
          영수증 보기
        </button>
      </div>

      {showReceipt && (
        <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
