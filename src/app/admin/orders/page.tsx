'use client';

import { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { Robot } from '@/types/robot';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { clsx } from 'clsx';

const STATUS_TABS: { value: 'all' | 'dine-in' | 'delivery' | OrderStatus; label: string }[] = [
  { value: 'all',       label: '전체'   },
  { value: 'dine-in',  label: '매장'   },
  { value: 'delivery', label: '배달'   },
  { value: 'pending',   label: '대기'   },
  { value: 'confirmed', label: '접수'   },
  { value: 'preparing', label: '조리 중' },
  { value: 'ready',     label: '서빙 대기' },
  { value: 'delivered', label: '완료'   },
  { value: 'cancelled', label: '취소'   },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [tab, setTab] = useState<typeof STATUS_TABS[0]['value']>('all');

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const { orders: o } = await res.json();
    setOrders(o);
  }, []);

  const fetchRobots = useCallback(async () => {
    const res = await fetch('/api/robots');
    const { robots: r } = await res.json();
    setRobots(r);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchRobots();
    const id = setInterval(() => { fetchOrders(); fetchRobots(); }, 5000);
    return () => clearInterval(id);
  }, [fetchOrders, fetchRobots]);

  async function handleStatusChange(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  async function handleDispatchRobot(orderId: string, tableNumber: number, robotId: string) {
    await fetch(`/api/robots/${robotId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, tableNumber }),
    });
    fetchOrders();
    fetchRobots();
  }

  async function handleConfirmPayment(orderId: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    });
    fetchOrders();
  }

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true;
    if (tab === 'dine-in') return o.orderType === 'dine-in';
    if (tab === 'delivery') return o.orderType === 'delivery';
    return o.status === tab;
  });

  const countByTab = (value: typeof tab) => {
    if (value === 'all') return orders.length;
    if (value === 'dine-in') return orders.filter((o) => o.orderType === 'dine-in').length;
    if (value === 'delivery') return orders.filter((o) => o.orderType === 'delivery').length;
    return orders.filter((o) => o.status === value).length;
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">주문 관리</h1>
        <span className="text-sm text-stone-400">전체 {orders.length}건</span>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => {
          const count = countByTab(value);
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
              <span
                className={clsx(
                  'text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold',
                  tab === value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
          해당 상태의 주문이 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              robots={robots}
              onStatusChange={handleStatusChange}
              onDispatchRobot={handleDispatchRobot}
              onConfirmPayment={handleConfirmPayment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
