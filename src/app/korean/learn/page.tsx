'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, ChevronDown, ChevronRight, Volume2, BookOpen, Lightbulb } from 'lucide-react';
import { CURRICULUM, STAGE_LABELS } from '@/lib/korean/curriculum';
import { Stage, CurriculumUnit, StudyLang } from '@/types/korean';
import clsx from 'clsx';

type Lang = StudyLang;
const LANG_LABELS: Record<Lang, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  ja: { label: '日本語', flag: '🇯🇵' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
};

const STAGES: Stage[] = ['consonant', 'vowel', 'word', 'sentence', 'conversation'];

function UnitCard({ unit, lang, defaultOpen }: { unit: CurriculumUnit; lang: Lang; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {unit.order}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{unit.titleKo}</div>
            <div className="text-xs text-gray-400">{unit.title[lang]}</div>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-4 italic">{unit.description[lang]}</p>
          <div className="space-y-3">
            {unit.content.map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-indigo-700 w-8">{item.korean}</span>
                    <span className="text-xs text-gray-400 font-mono">[{item.romanization}]</span>
                    <span className="text-sm text-gray-600">{item.meaning[lang]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={13} className="text-gray-300" />
                    {expandedItem === i
                      ? <ChevronDown size={13} className="text-gray-400" />
                      : <ChevronRight size={13} className="text-gray-400" />}
                  </div>
                </button>
                {expandedItem === i && (
                  <div className="px-4 pb-4 bg-indigo-50 border-t border-indigo-100 space-y-2">
                    {item.example && (
                      <div className="text-sm mt-3">
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">예문 / Example</span>
                        <div className="mt-1 text-gray-800 font-medium">{item.example}</div>
                      </div>
                    )}
                    {item.tip && (
                      <div className="flex items-start gap-2 mt-2 text-sm">
                        <Lightbulb size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600">{item.tip[lang]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LearnContent() {
  const searchParams = useSearchParams();
  const initialUnit = searchParams.get('unit') ?? '';
  const initialStage = CURRICULUM.find(u => u.id === initialUnit)?.stage ?? 'consonant';

  const [lang, setLang] = useState<Lang>('en');
  const [stage, setStage] = useState<Stage>(initialStage);

  const units = CURRICULUM.filter(u => u.stage === stage).sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">단계별 학습</h1>
          <p className="text-xs text-gray-400">자음 · 모음 · 단어 · 문장 · 회화</p>
        </div>
        {/* Lang selector */}
        <div className="ml-auto flex gap-1">
          {(Object.entries(LANG_LABELS) as [Lang, { label: string; flag: string }][]).map(([code, info]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={clsx(
                'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                lang === code ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {info.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={clsx(
              'px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors',
              stage === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
            )}
          >
            {STAGE_LABELS[s].ko} / {STAGE_LABELS[s].en}
          </button>
        ))}
      </div>

      {/* Units */}
      <div className="space-y-3">
        {units.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">이 단계에 학습 콘텐츠가 없습니다.</p>
          </div>
        )}
        {units.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            lang={lang}
            defaultOpen={unit.id === initialUnit}
          />
        ))}
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">로딩 중...</div>}>
      <LearnContent />
    </Suspense>
  );
}
