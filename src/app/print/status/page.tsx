'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Printer,
  ChevronLeft,
  Search,
  CheckCircle,
  Loader2,
  Package,
  Truck,
  Shield,
  Sparkles,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { PrintOrder, PrintOrderStatus } from '@/types/print';
import { clsx } from 'clsx';

const STATUS_STEPS: {
  status: PrintOrderStatus[];
  label: string;
  sub: string;
  icon: React.ElementType;
}[] = [
  { status: ['received'], label: '접수 완료', sub: '주문 및 파일 확인 중', icon: CheckCircle },
  { status: ['printing'], label: '인쇄 중', sub: '고품질 인쇄 진행 중', icon: Printer },
  { status: ['finishing'], label: '후가공', sub: '코팅·제본 작업 중', icon: Sparkles },
  { status: ['inspection'], label: '검수 중', sub: '품질 검수 진행 중', icon: Shield },
  { status: ['shipping'], label: '배송 중', sub: '배송업체에 인계됨', icon: Truck },
  { status: ['delivered'], label: '배송 완료', sub: '수령 완료', icon: Package },
];

const STATUS_LABEL: Record<PrintOrderStatus, string> = {
  received: '접수',
  printing: '인쇄중',
  finishing: '후가공',
  inspection: '검수',
  shipping: '배송중',
  delivered: '완료',
};

const CATEGORY_LABEL: Record<string, string> = {
  'business-card': '명함',
  flyer: '전단',
  booklet: '책자',
  banner: '배너',
  sticker: '스티커',
  package: '패키지',
};

function getStepIndex(status: PrintOrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.status.includes(status));
}

function StatusTimeline({ status }: { status: PrintOrderStatus }) {
  const current = getStepIndex(status);
  return (
    <div className="flex flex-col gap-0">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > i;
        const active = current === i;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-stone-100'
              )}>
                <Icon size={16} className={done || active ? 'text-white' : 'text-stone-300'} />
              </div>
              {!isLast && (
                <div className={clsx('w-0.5 h-8 my-1 transition-colors', done ? 'bg-emerald-300' : 'bg-stone-100')} />
              )}
            </div>
            <div className="flex-1 pb-4 pt-1.5">
              <p className={clsx('text-sm font-semibold', active ? 'text-blue-700' : done ? 'text-stone-700' : 'text-stone-300')}>
                {step.label}
                {active && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    진행 중
                  </span>
                )}
              </p>
              <p className={clsx('text-xs mt-0.5', active || done ? 'text-stone-400' : 'text-stone-200')}>
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: PrintOrder }) {
  const currentStep = getStepIndex(order.status);
  const totalSteps = STATUS_STEPS.length - 1;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const createdAt = new Date(order.createdAt);
  const estimatedDelivery = new Date(createdAt);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + order.estimatedDays);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-stone-50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-stone-800">{order.id}</span>
              <span className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'shipping' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              )}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="text-sm font-semibold text-stone-700">{order.productName}</p>
            <p className="text-xs text-stone-400">{CATEGORY_LABEL[order.category]} · {order.options.quantity.toLocaleString()}부</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">주문 금액</p>
            <p className="font-bold text-blue-700">{order.totalPrice > 0 ? `${order.totalPrice.toLocaleString()}원` : '견적 확인 중'}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              order.status === 'delivered' ? 'bg-emerald-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
          <span>접수</span>
          <span>{progress}%</span>
          <span>완료</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            접수일: {createdAt.toLocaleDateString('ko-KR')}
          </div>
          {order.status !== 'delivered' && (
            <div className="flex items-center gap-1 text-blue-600">
              <Truck size={11} />
              예정: {estimatedDelivery.toLocaleDateString('ko-KR')}
            </div>
          )}
        </div>
        <StatusTimeline status={order.status} />
      </div>

      {order.memo && (
        <div className="px-5 pb-5">
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-[10px] text-stone-400 font-semibold mb-0.5">요청 사항</p>
            <p className="text-xs text-stone-600">{order.memo}</p>
          </div>
        </div>
      )}

      {!order.fileUploaded && (
        <div className="px-5 pb-5">
          <Link
            href="/print/upload"
            className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors"
          >
            파일 미업로드 — 지금 업로드하기
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') ?? '');
  const [searchInput, setSearchInput] = useState(searchParams.get('orderId') ?? '');
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch('/api/print/orders')
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setLoading(false);
      });
  }, []);

  const filteredOrders = orderId
    ? orders.filter((o) =>
        o.id.toLowerCase().includes(orderId.toLowerCase()) ||
        o.customerName.includes(orderId) ||
        o.customerPhone.includes(orderId)
      )
    : orders.slice(0, 4);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setOrderId(searchInput);
    setSearched(true);
    router.replace(`/print/status?orderId=${encodeURIComponent(searchInput)}`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Printer size={13} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm leading-tight">주문 제작 현황</p>
            <p className="text-[10px] text-stone-400">실시간 제작 단계 추적</p>
          </div>
          <Link
            href="/print/chat"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 text-xs text-stone-600 hover:border-blue-300 transition-colors"
          >
            <MessageSquare size={12} />
            문의
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-5 pb-16 flex flex-col gap-5">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="주문번호 / 이름 / 연락처로 검색"
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Search size={14} />
            조회
          </button>
        </form>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20 text-stone-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <p className="text-sm">조회 중...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package size={36} className="text-stone-200" />
            <p className="text-stone-400 text-sm">
              {searched ? '해당 주문을 찾을 수 없습니다.' : '주문 내역이 없습니다.'}
            </p>
            <Link
              href="/print/quote"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              지금 견적 받기 <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {!orderId && (
              <p className="text-xs text-stone-400">
                최근 주문 {filteredOrders.length}건 표시 중 · 주문번호로 검색하면 특정 주문을 확인할 수 있어요
              </p>
            )}
            <div className="flex flex-col gap-5">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  );
}
