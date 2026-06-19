'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, Users, CalendarClock, AlertTriangle, ExternalLink, CheckCircle, Clock, XCircle, TrendingUp, CalendarDays } from 'lucide-react';
import { TaxReservation, TAX_DEADLINES, DEADLINE_TYPE_LABELS } from '@/lib/tax/data';
import clsx from 'clsx';

const TODAY = '2026-06-19';

const STATUS_MAP: Record<TaxReservation['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: '대기중',   color: 'bg-amber-100 text-amber-700',  icon: <Clock size={12} /> },
  confirmed: { label: '확정',     color: 'bg-blue-100 text-blue-700',    icon: <CheckCircle size={12} /> },
  done:      { label: '완료',     color: 'bg-green-100 text-green-700',  icon: <CheckCircle size={12} /> },
  cancelled: { label: '취소',     color: 'bg-gray-100 text-gray-500',    icon: <XCircle size={12} /> },
};

export default function AdminTaxPage() {
  const [reservations, setReservations] = useState<TaxReservation[]>([]);
  const [tab, setTab] = useState<'reservations' | 'deadlines' | 'stats'>('reservations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tax/reservations')
      .then(r => r.json())
      .then(d => setReservations(d.reservations))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatus(id: string, status: TaxReservation['status']) {
    await fetch('/api/tax/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const pending = reservations.filter(r => r.status === 'pending').length;
  const upcoming = TAX_DEADLINES.filter(d => d.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date));
  const urgent = upcoming.filter(d => {
    const days = Math.ceil((new Date(d.date).getTime() - new Date(TODAY).getTime()) / 86400000);
    return days <= 30;
  });

  const STATS = [
    { icon: Users,        label: '전체 고객',     value: `${reservations.length}명`,  sub: '누적 상담 예약', color: 'bg-slate-100 text-slate-600' },
    { icon: Clock,        label: '대기 예약',      value: `${pending}건`,              sub: '확인 필요',       color: 'bg-amber-100 text-amber-600' },
    { icon: CalendarDays, label: '신고 기한 (1개월)', value: `${urgent.length}건`,    sub: '주의 필요',       color: 'bg-red-100 text-red-600' },
    { icon: TrendingUp,   label: '이번 달 완료',   value: `${reservations.filter(r => r.status === 'done').length}건`, sub: '상담 완료', color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-blue-800 flex items-center justify-center">
              <Scale size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">세무법인 아이젯 관리</h1>
          </div>
          <p className="text-sm text-gray-400">고객 상담 · 신고 기한 · 통계</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <AlertTriangle size={12} />
            사업자 정보 준비중
          </div>
          <Link href="/tax" target="_blank"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <ExternalLink size={14} />
            사이트 보기
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div className="text-xl font-black text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Urgent deadline alert */}
      {urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800 text-sm mb-1">30일 내 신고 기한 {urgent.length}건</div>
            <div className="flex flex-wrap gap-2">
              {urgent.map(d => {
                const days = Math.ceil((new Date(d.date).getTime() - new Date(TODAY).getTime()) / 86400000);
                const ti = DEADLINE_TYPE_LABELS[d.type];
                return (
                  <span key={d.id} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${d.bg} ${d.color}`}>
                    D-{days} {ti.label}: {d.title.slice(0, 12)}…
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'reservations', label: '상담 예약', icon: CalendarClock },
          { key: 'deadlines',    label: '신고 기한', icon: CalendarDays },
          { key: 'stats',        label: '통계',      icon: TrendingUp },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-slate-50'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Reservations */}
      {tab === 'reservations' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">로딩 중...</div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[80px_100px_80px_100px_140px_90px_80px_110px] gap-3 px-5 py-3 text-xs font-semibold text-gray-400 border-b border-gray-100 bg-gray-50">
                <span>예약번호</span><span>성함</span><span>업종</span><span>상담주제</span><span>일시</span><span>연락처</span><span>상태</span><span>처리</span>
              </div>
              <div className="divide-y divide-gray-50">
                {reservations.map(r => {
                  const s = STATUS_MAP[r.status];
                  return (
                    <div key={r.id} className="grid grid-cols-1 sm:grid-cols-[80px_100px_80px_100px_140px_90px_80px_110px] gap-2 sm:gap-3 px-5 py-4 hover:bg-slate-50/40 transition-colors">
                      <span className="text-xs font-mono text-gray-400">{r.id}</span>
                      <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                      <span className="text-xs text-gray-500">{r.businessType || '-'}</span>
                      <span className="text-xs font-medium text-gray-700">{r.topic}</span>
                      <span className="text-xs text-gray-600">{r.date} {r.time}</span>
                      <span className="text-xs text-gray-500">{r.phone}</span>
                      <div>
                        <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', s.color)}>
                          {s.icon}{s.label}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {r.status === 'pending' && (
                          <button onClick={() => handleStatus(r.id, 'confirmed')}
                            className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">확정</button>
                        )}
                        {r.status === 'confirmed' && (
                          <button onClick={() => handleStatus(r.id, 'done')}
                            className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">완료</button>
                        )}
                        {r.status !== 'cancelled' && r.status !== 'done' && (
                          <button onClick={() => handleStatus(r.id, 'cancelled')}
                            className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">취소</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {reservations.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">예약이 없습니다.</div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
                총 {reservations.length}건
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Deadlines */}
      {tab === 'deadlines' && (
        <div className="space-y-3">
          {TAX_DEADLINES.sort((a, b) => a.date.localeCompare(b.date)).map(d => {
            const ti = DEADLINE_TYPE_LABELS[d.type];
            const isPast = d.date < TODAY;
            const days = Math.ceil((new Date(d.date).getTime() - new Date(TODAY).getTime()) / 86400000);
            return (
              <div key={d.id} className={clsx('bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4', isPast ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:shadow-md transition-shadow')}>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-400">{d.date.slice(5,7)}월</span>
                  <span className="text-lg font-black text-slate-900 leading-none">{d.date.slice(8)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ti.bg} ${ti.color}`}>{ti.label}</span>
                    {!isPast && days <= 30 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${days <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>D-{days}</span>
                    )}
                    {isPast && <span className="text-[10px] text-gray-400">마감</span>}
                  </div>
                  <div className="font-bold text-sm text-gray-900 truncate">{d.title}</div>
                  <div className="text-xs text-gray-500">{d.period} · {d.target}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">상담 주제 분포</h3>
            {Object.entries(
              reservations.reduce((acc, r) => { acc[r.topic] = (acc[r.topic] ?? 0) + 1; return acc; }, {} as Record<string, number>)
            ).map(([topic, cnt]) => (
              <div key={topic} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 w-24 shrink-0">{topic}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-slate-700 h-2 rounded-full" style={{ width: `${(cnt / reservations.length) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{cnt}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">상태별 현황</h3>
            {Object.entries(STATUS_MAP).map(([key, s]) => {
              const cnt = reservations.filter(r => r.status === key).length;
              return (
                <div key={key} className="flex items-center justify-between mb-3">
                  <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', s.color)}>
                    {s.icon}{s.label}
                  </span>
                  <span className="text-lg font-black text-gray-900">{cnt}건</span>
                </div>
              );
            })}
          </div>
          <div className="sm:col-span-2 bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-3 text-sm">업종별 분포</h3>
            <div className="grid grid-cols-5 gap-2">
              {['개인사업자', '법인', '프리랜서', '스타트업', '기타'].map(bt => {
                const cnt = reservations.filter(r => r.businessType === bt).length;
                return (
                  <div key={bt} className="text-center">
                    <div className="text-2xl font-black mb-1">{cnt}</div>
                    <div className="text-xs opacity-70">{bt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
