'use client';

import { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { clsx } from 'clsx';

const STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all',       label: '전체'   },
  { value: 'pending',   label: '대기'   },
  { value: 'confirmed', label: '접수'   },
  { value: 'preparing', label: '조리 중' },
  { value: 'ready',     label: '서빙 대기' },
  { value: 'delivered', label: '완료'   },
  { value: 'cancelled', label: '취소'   },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'all' | OrderStatus>('all');

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

  async function handleStatusChange(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const countByStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">주문 관리</h1>
        <span className="text-sm text-stone-400">전체 {orders.length}건</span>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value === 'all' ? orders.length : countByStatus(value as OrderStatus);
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
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
