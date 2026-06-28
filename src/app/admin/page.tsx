'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { OrderCard } from '@/components/admin/OrderCard';
import { ReservationDashboard } from '@/components/admin/ReservationDashboard';
import { Order, OrderStatus } from '@/types/order';
import { TrendingUp, ShoppingBag, Clock, CheckCircle, Trophy, Printer, Sparkles, ChevronRight, Cloud, Wand2, Settings, Globe } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

// ── 식당/카페 전용 대시보드 ────────────────────────────────────────────────────
interface Stats {
  todayRevenue: number;
  activeOrders: number;
  totalOrders: number;
  popularItems: { name: string; count: number }[];
}

function RestaurantDashboard() {
  const { session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchAll = useCallback(async () => {
    const [ordersRes, statsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/stats'),
    ]);
    const { orders: o } = await ordersRes.json();
    const s = await statsRes.json();
    setOrders(o);
    setStats(s);
    setLastUpdated(new Date().toLocaleTimeString('ko-KR'));
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  async function handleStatusChange(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  }

  const activeOrders  = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {session ? (
            <>
              <p className="text-sm text-stone-400 font-medium">
                안녕하세요,{' '}
                <span className="text-stone-700 font-semibold">{session.name}</span>님
              </p>
              <h1 className="text-2xl font-bold text-stone-800 mt-0.5">대시보드</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-stone-400">마지막 업데이트 {lastUpdated}</p>
                {session.driveConnected && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    <Cloud size={10} />
                    Drive 연동됨
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
              <p className="text-sm text-stone-400 mt-0.5">마지막 업데이트 {lastUpdated}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-2 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              신규 주문 {pendingOrders.length}건 대기 중
            </div>
          )}
          <Link
            href="/admin/menu-print"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Printer size={14} />
            메뉴판 인쇄하기
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="오늘 매출"
          value={stats ? `${stats.todayRevenue.toLocaleString()}원` : '—'}
          sub="완료 주문 기준"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          label="전체 주문"
          value={stats ? `${stats.totalOrders}건` : '—'}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          label="처리 중"
          value={stats ? `${stats.activeOrders}건` : '—'}
          sub="대기 · 접수 · 조리 · 완료"
          icon={Clock}
          color="rose"
        />
        <StatCard
          label="인기 메뉴 1위"
          value={stats?.popularItems[0]?.name ?? '—'}
          sub={stats?.popularItems[0] ? `${stats.popularItems[0].count}개 판매` : ''}
          icon={Trophy}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 실시간 주문 */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-800">실시간 주문 현황</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              5초마다 자동 갱신
            </span>
          </div>
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400 text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
              현재 처리 중인 주문이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeOrders.map(order => (
                <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>

        {/* 우측 패널 */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <h3 className="font-bold text-sm text-stone-800 mb-3">인기 메뉴 TOP 3</h3>
            <div className="flex flex-col gap-2">
              {stats?.popularItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-500 text-white' :
                    i === 1 ? 'bg-stone-300 text-stone-700' :
                              'bg-orange-200 text-orange-700'
                  }`}>{i + 1}</span>
                  <span className="text-sm text-stone-700 flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-stone-400 shrink-0">{item.count}개</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <h3 className="font-bold text-sm text-stone-800 mb-3">최근 완료 주문</h3>
            <div className="flex flex-col gap-2">
              {orders.filter(o => o.status === 'delivered').slice(0, 4).map(o => (
                <div key={o.id} className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">
                    {o.orderType === 'delivery' ? '🚴 배달' : `테이블 ${o.tableNumber}번`}
                  </span>
                  <span className="font-medium text-stone-700">{o.totalAmount.toLocaleString()}원</span>
                </div>
              ))}
              {orders.filter(o => o.status === 'delivered').length === 0 && (
                <p className="text-xs text-stone-400">완료된 주문이 없습니다</p>
              )}
            </div>
          </div>

          <Link
            href="/admin/menu-print"
            className="group bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white block hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Printer size={16} />
                <p className="font-bold text-sm">메뉴판 인쇄하기</p>
              </div>
              <ChevronRight size={16} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-amber-100 mb-3 leading-relaxed">등록된 메뉴로 AI가 자동 디자인 생성 — 수량만 선택하면 끝!</p>
            <div className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold w-fit">
              <Sparkles size={10} />
              원클릭 자동 주문
            </div>
          </Link>

          <div className="bg-white rounded-2xl border border-yellow-200 p-4">
            <h3 className="font-bold text-sm text-stone-800 mb-3">결제 승인 대기</h3>
            <div className="flex flex-col gap-2">
              {orders.filter(o => o.paymentStatus === 'pending').slice(0, 4).map(o => (
                <div key={o.id} className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">
                    {o.orderType === 'delivery' ? '배달' : `테이블 ${o.tableNumber}번`}
                    {o.paymentMethod && ` · ${o.paymentMethod}`}
                  </span>
                  <span className="font-medium text-amber-700">{o.totalAmount.toLocaleString()}원</span>
                </div>
              ))}
              {orders.filter(o => o.paymentStatus === 'pending').length === 0 && (
                <p className="text-xs text-stone-400">대기 중인 결제가 없습니다</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 범용 플레이스홀더 ────────────────────────────────────────────────────────────
const INDUSTRY_LABEL: Record<string, string> = {
  retail:        '소매점',
  consulting:    '컨설팅',
  fashion:       '패션/의류',
  print:         '인쇄/출력',
  accommodation: '숙박업',
  education:     '교육',
  shopping:      '쇼핑/유통',
};

function GenericDashboard({ industryLabel }: { industryLabel: string }) {
  const { session } = useSession();
  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        {session && (
          <p className="text-sm text-stone-400 font-medium">
            안녕하세요,{' '}
            <span className="text-stone-700 font-semibold">{session.name}</span>님
          </p>
        )}
        <h1 className="text-2xl font-bold text-stone-800 mt-0.5">대시보드</h1>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Sparkles size={28} className="text-amber-500" />
        </div>
        <div>
          <p className="font-bold text-stone-800 text-lg">{industryLabel} 대시보드 준비 중</p>
          <p className="text-sm text-stone-400 mt-1">업종 전용 현황 화면을 곧 제공할 예정입니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/editor" className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Wand2 size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">홈페이지 편집</p>
            <p className="text-xs text-stone-400">AI 자동 생성</p>
          </div>
        </Link>
        <Link href="/admin/settings" className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center shrink-0">
            <Settings size={16} className="text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">가게 정보</p>
            <p className="text-xs text-stone-400">기본 정보 설정</p>
          </div>
        </Link>
        <Link href="/admin/domain" className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Globe size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">도메인 관리</p>
            <p className="text-xs text-stone-400">커스텀 도메인</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── 메인 진입점 ─────────────────────────────────────────────────────────────────
const RESERVATION_INDUSTRIES = ['beauty', 'fitness', 'clinic', 'pension'];
const RESTAURANT_INDUSTRIES  = ['restaurant', 'cafe'];

export default function AdminDashboard() {
  const router = useRouter();
  const { session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.isSuperAdmin && !session.isImpersonating) {
      router.replace('/admin/superadmin');
      return;
    }
    if (session?.industry === 'tax') {
      router.replace('/admin/tax');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center gap-3 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        로딩 중...
      </div>
    );
  }

  const industry = session?.industry ?? '';

  if (RESERVATION_INDUSTRIES.includes(industry)) {
    return <ReservationDashboard session={session} />;
  }

  if (RESTAURANT_INDUSTRIES.includes(industry)) {
    return <RestaurantDashboard />;
  }

  // tax는 useEffect redirect 대기 중 잠깐 노출될 수 있어 빈 화면 유지
  if (industry === 'tax') {
    return null;
  }

  return <GenericDashboard industryLabel={INDUSTRY_LABEL[industry] ?? industry} />;
}
