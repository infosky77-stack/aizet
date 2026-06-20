'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Printer,
  Lock,
} from 'lucide-react';
import { DailySummary } from '@/types/settlement';
import { clsx } from 'clsx';

const METHOD_META: {
  key: keyof DailySummary['byMethod'];
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: 'card',    label: '카드',      icon: CreditCard,  color: 'text-blue-600'   },
  { key: 'cash',    label: '현금',      icon: Banknote,    color: 'text-green-600'  },
  { key: 'kakao',   label: '카카오페이', icon: Smartphone,  color: 'text-yellow-600' },
  { key: 'naver',   label: '네이버페이', icon: Smartphone,  color: 'text-emerald-600'},
  { key: 'unknown', label: '미선택',    icon: Clock,       color: 'text-stone-400'  },
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SettlementPage() {
  const [date, setDate] = useState(todayString);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [alreadyClosed, setAlreadyClosed] = useState(false);

  const fetchSummary = useCallback(async (d: string) => {
    setLoading(true);
    setAlreadyClosed(false);
    try {
      const res = await fetch(`/api/settlement?date=${d}`);
      const { summary: s } = await res.json();
      setSummary(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(date);
  }, [date, fetchSummary]);

  async function handleClose() {
    if (!summary || summary.isClosed) return;
    setClosing(true);
    const res = await fetch('/api/settlement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    if (res.status === 409) {
      setAlreadyClosed(true);
    }
    await fetchSummary(date);
    setClosing(false);
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .settlement-print-area, .settlement-print-area * { visibility: visible; }
          .settlement-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 32px 40px !important;
          }
        }
      `}</style>

      <div className="p-6 flex flex-col gap-6 max-w-3xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">매출 정산</h1>
            <p className="text-sm text-stone-400 mt-0.5">날짜별 매출 집계 및 마감 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayString()}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 text-sm transition-colors"
            >
              <Printer size={14} />
              인쇄
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40 text-stone-400 text-sm print:hidden">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
            집계 중...
          </div>
        )}

        {!loading && summary && (
          <>
            {/* 마감 상태 배너 */}
            {summary.isClosed && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 print:hidden">
                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-700 text-sm">마감 완료</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {summary.closedAt ? formatDateTime(summary.closedAt) : ''} 마감 처리됨
                  </p>
                </div>
              </div>
            )}

            {alreadyClosed && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 print:hidden">
                <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-700">이미 마감된 날짜입니다.</p>
              </div>
            )}

            {/* 인쇄 대상 영역 */}
            <div className="settlement-print-area flex flex-col gap-6">

              {/* 인쇄 전용 헤더 */}
              <div className="hidden print:block text-center mb-2">
                <p className="text-xl font-bold tracking-wide">식당 데모 — 일일 정산서</p>
                <p className="text-sm text-stone-500 mt-1">정산 날짜: {summary.date}</p>
                {summary.isClosed && summary.closedAt && (
                  <p className="text-sm text-stone-500">
                    마감 처리: {formatDateTime(summary.closedAt)}
                  </p>
                )}
                <div className="border-t border-dashed border-stone-300 mt-3" />
              </div>

              {/* 요약 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard
                  icon={ShoppingBag}
                  iconBg="bg-blue-100 text-blue-600"
                  label="총 주문"
                  value={`${summary.totalOrders}건`}
                  sub={`결제완료 ${summary.paidCount}건`}
                />
                <SummaryCard
                  icon={TrendingUp}
                  iconBg="bg-amber-100 text-amber-600"
                  label="총 매출"
                  value={`${summary.totalRevenue.toLocaleString()}원`}
                  sub="결제완료 기준"
                />
                <SummaryCard
                  icon={XCircle}
                  iconBg="bg-red-100 text-red-500"
                  label="취소·환불"
                  value={`-${(summary.cancelledAmount + summary.refundedAmount).toLocaleString()}원`}
                  sub={`취소 ${summary.cancelledCount}건 · 환불 ${summary.refundedCount}건`}
                  valueColor="text-red-600"
                />
                <SummaryCard
                  icon={CheckCircle}
                  iconBg="bg-emerald-100 text-emerald-600"
                  label="순매출"
                  value={`${summary.netRevenue.toLocaleString()}원`}
                  sub="총매출 - 환불"
                  valueColor="text-emerald-700"
                  highlight
                />
              </div>

              {/* 결제수단별 내역 */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-50">
                  <h2 className="font-bold text-stone-800 text-sm">결제수단별 매출</h2>
                </div>
                <div className="divide-y divide-stone-50">
                  {METHOD_META.map(({ key, label, icon: Icon, color }) => {
                    const amount = summary.byMethod[key];
                    return (
                      <div
                        key={key}
                        className={clsx(
                          'flex items-center justify-between px-5 py-3.5',
                          amount === 0 && 'opacity-40'
                        )}
                      >
                        <span className={clsx('flex items-center gap-2 text-sm font-medium', color)}>
                          <Icon size={15} />
                          {label}
                        </span>
                        <span className="font-bold text-stone-800">
                          {amount.toLocaleString()}원
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-stone-50">
                    <span className="text-sm font-bold text-stone-700">합계</span>
                    <span className="font-bold text-amber-700">
                      {summary.totalRevenue.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              {/* 미처리 주문 */}
              {(summary.unpaidCount > 0 || summary.pendingCount > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-yellow-800 mb-1">미처리 주문 있음</p>
                    <div className="flex gap-4 text-yellow-700">
                      {summary.unpaidCount > 0 && (
                        <span>미결제 {summary.unpaidCount}건</span>
                      )}
                      {summary.pendingCount > 0 && (
                        <span>승인 대기 {summary.pendingCount}건</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 인쇄 전용 푸터 */}
              <div className="hidden print:block text-center mt-4">
                <div className="border-t border-dashed border-stone-300 mb-3" />
                <p className="text-xs text-stone-400">
                  출력일시: {formatDateTime(new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* 마감 처리 버튼 */}
            {!summary.isClosed && (
              <button
                onClick={handleClose}
                disabled={closing}
                className={clsx(
                  'flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-sm transition-colors print:hidden',
                  closing
                    ? 'bg-stone-300 cursor-not-allowed'
                    : 'bg-stone-800 hover:bg-stone-900'
                )}
              >
                <Lock size={15} />
                {closing ? '처리 중...' : `${summary.date} 마감 처리`}
              </button>
            )}
          </>
        )}

        {!loading && summary && summary.totalOrders === 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center text-stone-400 text-sm print:hidden">
            {summary.date} 날짜의 주문이 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
  valueColor = 'text-stone-800',
  highlight = false,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border shadow-sm p-4',
        highlight
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-stone-100'
      )}
    >
      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-3', iconBg)}>
        <Icon size={16} />
      </div>
      <p className={clsx('text-lg font-black', valueColor)}>{value}</p>
      <p className="text-xs text-stone-500 font-semibold mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}
