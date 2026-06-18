'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Printer,
  Sparkles,
  Shield,
  Truck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PrintOrder, PrintOrderStatus } from '@/types/print';
import { clsx } from 'clsx';

const STATUS_CONFIG: Record<PrintOrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  received: { label: '접수', color: 'text-stone-600', bg: 'bg-stone-100', icon: Clock },
  printing: { label: '인쇄중', color: 'text-blue-700', bg: 'bg-blue-100', icon: Printer },
  finishing: { label: '후가공', color: 'text-violet-700', bg: 'bg-violet-100', icon: Sparkles },
  inspection: { label: '검수', color: 'text-amber-700', bg: 'bg-amber-100', icon: Shield },
  shipping: { label: '배송중', color: 'text-cyan-700', bg: 'bg-cyan-100', icon: Truck },
  delivered: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
};

const STATUS_FLOW: PrintOrderStatus[] = ['received', 'printing', 'finishing', 'inspection', 'shipping', 'delivered'];

const CATEGORY_LABEL: Record<string, string> = {
  'business-card': '명함',
  flyer: '전단',
  booklet: '책자',
  banner: '배너',
  sticker: '스티커',
  package: '패키지',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500">{label}</p>
        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-2xl font-black text-stone-800">{value}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function OrderRow({
  order,
  onStatusChange,
}: {
  order: PrintOrder;
  onStatusChange: (id: string, status: PrintOrderStatus) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-stone-700">{order.id}</span>
          <span className={clsx('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
            <Icon size={10} />
            {cfg.label}
          </span>
          {!order.fileUploaded && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              <AlertCircle size={10} />
              파일 미수신
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-stone-700 truncate">{order.productName}</p>
        <p className="text-xs text-stone-400">
          {order.customerName} · {order.customerPhone} · {CATEGORY_LABEL[order.category]} {order.options.quantity.toLocaleString()}부
        </p>
        {order.memo && <p className="text-[10px] text-stone-400 mt-0.5 truncate">메모: {order.memo}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-[10px] text-stone-400">금액</p>
          <p className="font-bold text-blue-700 text-sm">
            {order.totalPrice > 0 ? `${order.totalPrice.toLocaleString()}원` : '—'}
          </p>
        </div>

        {nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
            className={clsx(
              'px-3 py-2 rounded-xl text-xs font-bold transition-colors',
              STATUS_CONFIG[nextStatus].bg,
              STATUS_CONFIG[nextStatus].color,
              'hover:opacity-80'
            )}
          >
            → {STATUS_CONFIG[nextStatus].label}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PrintAdminDashboard() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [filter, setFilter] = useState<PrintOrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/print/orders');
    const { orders: o } = await res.json();
    setOrders(o);
    setLastUpdated(new Date().toLocaleTimeString('ko-KR'));
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 8000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function handleStatusChange(id: string, status: PrintOrderStatus) {
    await fetch(`/api/print/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + o.totalPrice, 0);
  const noFile = orders.filter((o) => !o.fileUploaded && o.status === 'received').length;

  const statusCounts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<PrintOrderStatus, number>);

  const displayOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">인쇄소 대시보드</h1>
          <p className="text-sm text-stone-400 mt-0.5">마지막 업데이트 {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-3">
          {noFile > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-semibold">
              <AlertCircle size={15} />
              파일 미수신 {noFile}건
            </div>
          )}
          <button
            onClick={fetchOrders}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-500"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="전체 주문"
          value={`${orders.length}건`}
          sub="누적 주문 수"
          icon={Package}
          color="blue"
        />
        <StatCard
          label="처리 중"
          value={`${activeOrders.length}건`}
          sub="제작 진행 중"
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="완료 매출"
          value={todayRevenue > 0 ? `${todayRevenue.toLocaleString()}원` : '—'}
          sub="배송 완료 기준"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          label="배송 완료"
          value={`${statusCounts.delivered}건`}
          icon={CheckCircle}
          color="rose"
        />
      </div>

      {/* Status pipeline */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h2 className="font-bold text-stone-800 text-sm mb-4">제작 파이프라인</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STATUS_FLOW.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const count = statusCounts[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(filter === status ? 'all' : status)}
                className={clsx(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                  filter === status
                    ? `${cfg.bg} ${cfg.color} border-transparent`
                    : 'bg-stone-50 text-stone-600 border-stone-100 hover:border-stone-200'
                )}
              >
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', filter === status ? 'bg-white/50' : cfg.bg)}>
                  <Icon size={14} className={filter === status ? cfg.color : 'text-stone-500'} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black leading-none">{count}</p>
                  <p className="text-[10px] font-semibold mt-0.5">{cfg.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-800">
            {filter === 'all' ? '전체 주문' : `${STATUS_CONFIG[filter].label} 주문`}
            <span className="ml-2 text-stone-400 font-normal text-sm">({displayOrders.length})</span>
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            8초마다 자동 갱신
          </span>
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400 text-sm">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
            해당 상태의 주문이 없습니다
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayOrders.map((order) => (
              <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
