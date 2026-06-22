'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Calculator, MessageCircle, CalendarClock, CheckCircle, Shield, Award, Users } from 'lucide-react';
import { TAX_DEADLINES, DEADLINE_TYPE_LABELS } from '@/lib/tax/data';

const SERVICES = [
  { icon: CalendarDays, title: '신고 기한 캘린더', desc: '부가세·소득세·법인세 신고일정을 한눈에', href: '/tax/calendar', color: 'bg-blue-100 text-blue-700' },
  { icon: Calculator,   title: '세금 계산기',     desc: '실제 세율 구간 적용 소득세·부가세 계산', href: '/tax/calculator', color: 'bg-emerald-100 text-emerald-700' },
  { icon: MessageCircle,title: 'AI 세무 상담',    desc: '세금 질문에 즉시 답변, 절세 전략 안내', href: '/tax/chat',       color: 'bg-violet-100 text-violet-700' },
  { icon: CalendarClock,title: '상담 예약',        desc: '전문 세무사와 1:1 맞춤 상담 예약',     href: '/tax/reservation', color: 'bg-amber-100 text-amber-700' },
];

const STRENGTHS = [
  { icon: Shield, title: '20년+ 세무 경력', desc: '개인사업자부터 대기업까지 다양한 세무 경험' },
  { icon: Award,  title: 'AI 기반 절세 분석', desc: 'AI가 수천 개 케이스를 분석해 최적 절세안 제시' },
  { icon: Users,  title: '1,200+ 고객사', desc: '신뢰할 수 있는 세무 파트너로 함께 성장' },
  { icon: CheckCircle, title: '가산세 제로 보장', desc: '신고기한 알림 시스템으로 기한 내 신고 완벽 지원' },
];

const TODAY_STR = new Date().toISOString().slice(0, 10);

const UPCOMING = TAX_DEADLINES
  .filter(d => d.date >= TODAY_STR)
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(0, 3);

export default function TaxHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
          카드 내역 자동 정리로,<br />
          기장료 부담을 줄이세요.
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
          카드 사용 비율이 90% 이상이라면 거래 내역이 자동 분류·장부화되어<br />
          월 기장료(8~10만원)를 절감할 수 있습니다.
        </p>
        <Link
          href="/tax/reservation"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl transition-colors"
        >
          기장료 절감 상담받기 <ArrowRight size={16} />
        </Link>
      </section>

      {/* Services */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {SERVICES.map(s => (
          <Link key={s.href} href={s.href} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="font-bold text-sm text-slate-800 mb-1">{s.title}</div>
            <div className="text-xs text-slate-600 leading-relaxed">{s.desc}</div>
            <ArrowRight size={13} className="mt-3 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </Link>
        ))}
      </section>

      {/* Upcoming deadlines */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">다가오는 신고 기한</h2>
            <p className="text-xs text-slate-400 mt-0.5">놓치면 가산세가 부과됩니다</p>
          </div>
          <Link href="/tax/calendar" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            전체 일정 <ArrowRight size={13} />
          </Link>
        </div>
        <div className="space-y-3">
          {UPCOMING.map(d => {
            const typeInfo = DEADLINE_TYPE_LABELS[d.type];
            const deadlineDate = new Date(d.date);
            const today = new Date();
            const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
            return (
              <div key={d.id} className={`rounded-2xl border p-4 flex items-center gap-4 ${d.bg}`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-white shadow-sm`}>
                  <span className="text-xs font-bold text-slate-600">{d.date.slice(5, 7)}월</span>
                  <span className="text-lg font-black text-slate-900 leading-none">{d.date.slice(8)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {daysLeft <= 30 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        D-{daysLeft}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-800 truncate">{d.title}</div>
                  <div className="text-xs text-slate-600">{d.period} · {d.target}</div>
                </div>
                <Link href="/tax/reservation" className="shrink-0 text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  상담 예약
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strengths */}
      <section className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl p-8 md:p-12 mb-14 text-white">
        <h2 className="text-2xl font-black text-center mb-8">세무법인 아이젯을 선택하는 이유</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STRENGTHS.map(s => (
            <div key={s.title} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <s.icon size={20} className="text-white" />
              </div>
              <div className="font-bold text-sm mb-1">{s.title}</div>
              <div className="text-xs text-slate-300 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Chat CTA */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <div className="text-3xl mb-3">🤖</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">세금 질문이 있으신가요?</h2>
        <p className="text-slate-600 text-sm mb-5 max-w-md mx-auto">
          AI 세무 상담사가 24시간 답변합니다. 부가세, 소득세, 절세 전략까지.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['"종합소득세 신고 어떻게 하나요?"', '"부가세 환급 받을 수 있나요?"', '"법인세 절세 방법이 있나요?"'].map(ex => (
            <span key={ex} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full font-medium">{ex}</span>
          ))}
        </div>
        <Link href="/tax/chat" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          AI 세무 상담 시작 <ArrowRight size={15} />
        </Link>
      </section>

      <div className="mt-8 flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 세무사 플랫폼 데모입니다. 표시된 정보는 참고용이며 실제 세무 서비스가 제공되지 않습니다. 세금 납부 전 반드시 전문가와 상담하세요.</p>
      </div>
    </div>
  );
}
