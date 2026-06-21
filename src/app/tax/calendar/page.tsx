'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Filter, AlertTriangle, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { TAX_DEADLINES, DEADLINE_TYPE_LABELS } from '@/lib/tax/data';

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const _today = new Date();
const TODAY = _today.toISOString().slice(0, 10);
const CURRENT_YEAR = _today.getFullYear();

export default function TaxCalendarPage() {
  const [filter, setFilter] = useState<string>('all');
  const [viewMonth, setViewMonth] = useState(_today.getMonth());

  const filtered = filter === 'all' ? TAX_DEADLINES : TAX_DEADLINES.filter(d => d.type === filter);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  const monthDeadlines = sorted.filter(d => {
    const m = parseInt(d.date.slice(5, 7)) - 1;
    const y = parseInt(d.date.slice(0, 4));
    return y === CURRENT_YEAR && m === viewMonth;
  });

  const upcomingAll = sorted.filter(d => d.date >= TODAY);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={20} className="text-blue-600" />
          <h1 className="text-2xl font-black text-slate-900">세금 신고 기한 캘린더</h1>
        </div>
        <p className="text-slate-500 text-sm">국세청 기준 주요 세금 신고 일정 · 기한을 놓치면 무신고 가산세 20% 부과</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Filter size={14} className="text-slate-400 self-center shrink-0" />
        {[{ key: 'all', label: '전체' }, ...Object.entries(DEADLINE_TYPE_LABELS).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all ${
              filter === f.key ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {f.key !== 'all' && <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${DEADLINE_TYPE_LABELS[f.key]?.dot}`} />}
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month navigator + mini calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewMonth(m => Math.max(0, m - 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <span className="font-bold text-slate-800">{CURRENT_YEAR}년 {MONTHS[viewMonth]}</span>
              <button onClick={() => setViewMonth(m => Math.min(11, m + 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            {monthDeadlines.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">이 달은 주요 신고 기한이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {monthDeadlines.map(d => {
                  const typeInfo = DEADLINE_TYPE_LABELS[d.type];
                  const isPast = d.date < TODAY;
                  return (
                    <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isPast ? 'opacity-50 bg-gray-50 border-gray-100' : d.bg}`}>
                      <div className="w-8 h-8 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm shrink-0">
                        <span className="text-[9px] font-bold text-slate-400">{d.date.slice(5, 7)}/{d.date.slice(8)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[10px] font-bold ${typeInfo.color}`}>{typeInfo.label}</div>
                        <div className="text-xs font-semibold text-slate-800 leading-tight truncate">{d.title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Penalty notice */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-sm font-bold text-red-700">가산세 안내</span>
            </div>
            <div className="text-xs text-red-600 space-y-1 leading-relaxed">
              <p>• 무신고 가산세: 납부세액의 <strong>20%</strong></p>
              <p>• 부정 무신고: <strong>40%</strong></p>
              <p>• 납부지연 가산세: 1일 <strong>0.022%</strong></p>
              <p>• 세금계산서 미발급: 공급가액 <strong>2%</strong></p>
            </div>
          </div>
        </div>

        {/* Full deadline list */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-slate-700 text-sm mb-3">전체 신고 일정 ({upcomingAll.length}건 예정)</h2>
          <div className="space-y-3">
            {sorted.map(d => {
              const typeInfo = DEADLINE_TYPE_LABELS[d.type];
              const isPast = d.date < TODAY;
              const deadlineDate = new Date(d.date);
              const today = new Date(TODAY);
              const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);

              return (
                <div key={d.id} className={`rounded-2xl border p-5 transition-all ${isPast ? 'opacity-50 bg-gray-50 border-gray-100' : `${d.bg} hover:shadow-md`}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm shrink-0 border border-white">
                      <span className="text-xs font-bold text-slate-400">{d.date.slice(5, 7)}월</span>
                      <span className="text-2xl font-black text-slate-900 leading-none">{d.date.slice(8)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {!isPast && daysLeft <= 30 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            D-{daysLeft}
                          </span>
                        )}
                        {isPast && <span className="text-[10px] text-slate-400 font-semibold">마감</span>}
                      </div>
                      <div className="font-bold text-slate-900 mb-1">{d.title}</div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>📅 신고 기간: {d.period}</p>
                        <p>👤 대상: {d.target}</p>
                        <p>⚠️ {d.penalty}</p>
                      </div>
                    </div>
                    {!isPast && (
                      <Link href="/tax/reservation" className="shrink-0 text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1">
                        <CalendarClock size={12} />
                        예약
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
