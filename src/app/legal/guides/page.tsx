'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, CalendarClock } from 'lucide-react';
import { LEGAL_SERVICES, SERVICE_CATEGORY_LABELS, LegalService } from '@/lib/legal/data';

type Category = LegalService['category'] | 'all';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'registration', label: '소유권 등기' },
  { key: 'corporate', label: '법인 등기' },
  { key: 'inheritance', label: '상속·증여' },
  { key: 'auction', label: '경매·공매' },
  { key: 'bankruptcy', label: '회생·파산' },
  { key: 'preservation', label: '보전처분' },
  { key: 'document', label: '법률서류' },
];

export default function LegalGuidesPage() {
  const [category, setCategory] = useState<Category>('all');
  const [selected, setSelected] = useState<LegalService | null>(null);

  const filtered = category === 'all' ? LEGAL_SERVICES : LEGAL_SERVICES.filter(s => s.category === category);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-cyan-600" />
          <h1 className="text-2xl font-black text-slate-900">서비스 안내</h1>
        </div>
        <p className="text-slate-700 text-base">법무사 에이젯이 제공하는 전체 법무 서비스를 확인하세요</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              category === c.key
                ? 'border-slate-700 bg-slate-800 text-white'
                : 'border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 서비스 목록 */}
      <div className="grid gap-4 mb-10">
        {filtered.map(s => {
          const cat = SERVICE_CATEGORY_LABELS[s.category];
          const isSelected = selected?.id === s.id;
          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(isSelected ? null : s)}
            >
              <div className="p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
                <ArrowRight
                  size={16}
                  className={`shrink-0 text-slate-400 transition-transform mt-0.5 ${isSelected ? 'rotate-90' : ''}`}
                />
              </div>
              {isSelected && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{s.detail}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyan-700 font-semibold bg-cyan-50 px-3 py-1.5 rounded-xl">
                      💰 {s.fee}
                    </span>
                    <Link
                      href="/legal/reservation"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-sm font-bold bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      상담 예약 <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-slate-800 to-cyan-900 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap text-white">
        <div>
          <p className="font-bold text-base mb-0.5">어떤 서비스가 필요하신지 모르겠다면?</p>
          <p className="text-sm opacity-80">AI 법무 상담으로 먼저 파악하거나, 법무사와 직접 상담하세요.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/legal/chat" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
            AI 상담 <ArrowRight size={13} />
          </Link>
          <Link href="/legal/reservation" className="flex items-center gap-1.5 bg-white text-slate-800 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
            <CalendarClock size={13} />
            예약하기
          </Link>
        </div>
      </div>
    </div>
  );
}
