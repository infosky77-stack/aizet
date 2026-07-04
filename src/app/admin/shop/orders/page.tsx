'use client';

// 판매자 주문 관리 + 정산 개요 — 셀러센터 스타일.
// 상단: 기간별 매출/주문수/베스트상품 요약. 하단: 상태 필터 탭 + 주문 카드
// (전환 버튼은 nextOrderStatuses가 허용하는 것만 노출 — 서버와 같은 전이표).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Loader2, TrendingUp, Package2, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import {
  SHOP_ORDER_STATUS_LABELS, nextOrderStatuses, formatPrice,
  type ShopOrderRow, type ShopOrderStatus,
} from '@/lib/shop/types';

interface Summary {
  totalSales:  number;
  orderCount:  number;
  bestProducts: { name: string; qty: number; sales: number }[];
}

const STATUS_BADGE: Record<ShopOrderStatus, string> = {
  placed:    'bg-blue-100 text-blue-700',
  paid:      'bg-violet-100 text-violet-700',
  shipping:  'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-400',
};

const FILTERS: (ShopOrderStatus | 'all')[] = ['all', 'placed', 'paid', 'shipping', 'delivered', 'cancelled'];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<ShopOrderRow[] | null>(null);
  const [filter, setFilter] = useState<ShopOrderStatus | 'all'>('all');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [days, setDays] = useState(30);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const params = filter === 'all' ? '' : `?status=${filter}`;
    const res = await fetch(`/api/admin/shop/orders${params}`).catch(() => null);
    const data = await res?.json().catch(() => null);
    setOrders(data?.orders ?? []);
  }, [filter]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    fetch(`/api/admin/shop/orders?summaryDays=${days}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data?.summary ?? null));
  }, [days]);

  async function handleTransition(orderId: string, to: ShopOrderStatus) {
    if (busyId) return;
    setBusyId(orderId);
    const res = await fetch(`/api/admin/shop/orders/${orderId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: to }),
    }).catch(() => null);
    if (!res?.ok) alert('상태 전환에 실패했습니다.');
    await fetchOrders();
    setBusyId(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/shop"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
        >
          <ArrowLeft size={14} /> 상품 관리
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-800">주문 관리 · 정산</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-xs border border-stone-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value={7}>최근 7일</option>
          <option value={30}>최근 30일</option>
          <option value={90}>최근 90일</option>
        </select>
      </div>

      {/* 정산 개요 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
          <div>
            <p className="text-xs text-stone-400">매출 (취소 제외)</p>
            <p className="text-lg font-black text-stone-900">{summary ? formatPrice(summary.totalSales) : '—'}</p>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Package2 size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-stone-400">주문 수</p>
            <p className="text-lg font-black text-stone-900">{summary ? summary.orderCount.toLocaleString() : '—'}</p>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Trophy size={18} className="text-amber-600" /></div>
          <div className="min-w-0">
            <p className="text-xs text-stone-400">베스트 상품</p>
            {summary && summary.bestProducts.length > 0 ? (
              <p className="text-sm font-bold text-stone-800 truncate">
                {summary.bestProducts[0].name}
                <span className="text-xs font-medium text-stone-400 ml-1">{summary.bestProducts[0].qty}개</span>
              </p>
            ) : (
              <p className="text-sm text-stone-300">—</p>
            )}
          </div>
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setOrders(null); setFilter(f); }}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              filter === f ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-700',
            )}
          >
            {f === 'all' ? '전체' : SHOP_ORDER_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {orders === null ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-stone-300" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-stone-400 bg-white border border-stone-200 rounded-2xl">
          <ClipboardList size={30} className="opacity-30" />
          <p className="text-sm">주문이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-stone-400">{o.id.slice(0, 8)}</span>
                <span className={clsx('px-2 py-0.5 rounded-lg text-[11px] font-bold', STATUS_BADGE[o.status])}>
                  {SHOP_ORDER_STATUS_LABELS[o.status]}
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(o.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="ml-auto text-base font-black text-stone-900">{formatPrice(o.total)}</span>
              </div>
              <p className="text-sm text-stone-600">
                {(o.items ?? []).map((it) => `${it.name} ×${it.qty}`).join(', ')}
              </p>
              <p className="text-xs text-stone-400">
                {o.buyer_name} · {o.buyer_phone} · {o.buyer_address}
                {o.request && <span className="text-stone-500"> · 요청: {o.request}</span>}
              </p>
              {nextOrderStatuses(o.status).length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {nextOrderStatuses(o.status).map((to) => (
                    <button
                      key={to}
                      onClick={() => handleTransition(o.id, to)}
                      disabled={busyId === o.id}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50',
                        to === 'cancelled'
                          ? 'border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200'
                          : 'bg-stone-800 hover:bg-stone-700 text-white',
                      )}
                    >
                      {busyId === o.id ? <Loader2 size={12} className="animate-spin" /> : `${SHOP_ORDER_STATUS_LABELS[to]}로 전환`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
