'use client';

import { useState } from 'react';
import { LayoutDashboard, Trophy, Flame, Calendar, BookOpen, Star, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { CURRICULUM, STAGE_LABELS } from '@/lib/korean/curriculum';
import { Stage } from '@/types/korean';
import clsx from 'clsx';

const DEMO_STUDENT = {
  name: 'Emily Chen',
  lang: '🇺🇸 English',
  level: 'elementary',
  joinedAt: '2026-05-01',
  attendanceDays: 34,
  streak: 7,
  totalScore: 91,
  completedUnits: ['consonant-basic', 'vowel-basic', 'word-greetings'],
  scores: { 'consonant-basic': 92, 'vowel-basic': 88, 'word-greetings': 95 },
};

const LEVEL_LABELS: Record<string, { ko: string; color: string }> = {
  beginner:     { ko: '입문', color: 'bg-gray-100 text-gray-600' },
  elementary:   { ko: '초급', color: 'bg-green-100 text-green-700' },
  intermediate: { ko: '중급', color: 'bg-blue-100 text-blue-700' },
  advanced:     { ko: '고급', color: 'bg-violet-100 text-violet-700' },
};

const STAGE_ORDER: Stage[] = ['consonant', 'vowel', 'word', 'sentence', 'conversation'];

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
        {icon}
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [student] = useState(DEMO_STUDENT);
  const levelInfo = LEVEL_LABELS[student.level];
  const totalUnits = CURRICULUM.length;
  const completedCount = student.completedUnits.length;
  const progressPct = Math.round((completedCount / totalUnits) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
          {student.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">{student.name}</div>
          <div className="text-sm opacity-75">{student.lang}</div>
          <div className="text-xs opacity-60 mt-0.5">가입일: {student.joinedAt}</div>
        </div>
        <div className="text-right">
          <div className={clsx('inline-block px-3 py-1 rounded-full text-xs font-bold mb-1', levelInfo.color.replace('text-', 'bg-white text-').replace('bg-', ''))}>
            {levelInfo.ko}
          </div>
          <div className="text-2xl font-black">{student.totalScore}점</div>
          <div className="text-xs opacity-70">평균 점수</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Calendar size={18} />}
          value={student.attendanceDays}
          label="출석일"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Flame size={18} />}
          value={`${student.streak}일`}
          label="연속 학습"
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          icon={<BookOpen size={18} />}
          value={`${completedCount}/${totalUnits}`}
          label="완료 단원"
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={<Trophy size={18} />}
          value={`${student.totalScore}점`}
          label="평균 점수"
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" />
            전체 학습 진도
          </div>
          <span className="text-sm font-bold text-indigo-600">{progressPct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage progress */}
        <div className="space-y-3">
          {STAGE_ORDER.map(stage => {
            const stageUnits = CURRICULUM.filter(u => u.stage === stage);
            const completed = stageUnits.filter(u => student.completedUnits.includes(u.id)).length;
            const pct = stageUnits.length ? Math.round((completed / stageUnits.length) * 100) : 0;
            return (
              <div key={stage}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{STAGE_LABELS[stage].ko} / {STAGE_LABELS[stage].en}</span>
                  <span>{completed}/{stageUnits.length}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit scores */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
          <Star size={16} className="text-yellow-500" />
          완료한 단원별 점수
        </div>
        <div className="space-y-3">
          {student.completedUnits.map(unitId => {
            const unit = CURRICULUM.find(u => u.id === unitId);
            const score = student.scores[unitId as keyof typeof student.scores] ?? 0;
            return unit ? (
              <div key={unitId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{unit.titleKo}</div>
                  <div className="text-xs text-gray-400">{STAGE_LABELS[unit.stage].ko}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full', score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-400' : 'bg-red-400')}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={clsx('text-sm font-bold w-10 text-right', score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-500')}>
                    {score}점
                  </span>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/korean/learn"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
        >
          학습 계속하기 <ChevronRight size={16} />
        </Link>
        <Link
          href="/korean/chat"
          className="flex-1 border border-indigo-200 text-indigo-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors text-sm"
        >
          AI 회화 연습 <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
