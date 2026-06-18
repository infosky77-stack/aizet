'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, TrendingUp, BarChart3, Search, Globe, Flame } from 'lucide-react';
import clsx from 'clsx';

interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  lang: string;
  level: string;
  joinedAt: string;
  lastActiveAt: string;
  attendanceDays: number;
  completedUnits: string[];
  scores: Record<string, number>;
  totalScore: number;
  streak: number;
}

interface Stats {
  total: number;
  levelCounts: Record<string, number>;
  langCounts: Record<string, number>;
  avgScore: number;
  avgAttendance: number;
  activeToday: number;
}

const LEVEL_LABELS: Record<string, { ko: string; color: string }> = {
  beginner:     { ko: '입문', color: 'bg-gray-100 text-gray-600' },
  elementary:   { ko: '초급', color: 'bg-green-100 text-green-700' },
  intermediate: { ko: '중급', color: 'bg-blue-100 text-blue-700' },
  advanced:     { ko: '고급', color: 'bg-violet-100 text-violet-700' },
};

const LANG_FLAGS: Record<string, string> = { en: '🇺🇸', zh: '🇨🇳', ja: '🇯🇵', vi: '🇻🇳' };

export default function AdminKoreanPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'name' | 'totalScore' | 'attendanceDays' | 'streak'>('totalScore');

  useEffect(() => {
    fetch('/api/korean/students')
      .then(r => r.json())
      .then(d => { setStudents(d.students); setStats(d.stats); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = students
    .filter(s =>
      (levelFilter === 'all' || s.level === levelFilter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return (b[sortKey] as number) - (a[sortKey] as number);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">한국어 학습 관리</h1>
        <p className="text-sm text-gray-400">수강생 진도 · 성적 · 통계</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { icon: <Users size={16} />, value: stats.total, label: '전체 수강생', color: 'bg-indigo-100 text-indigo-600' },
            { icon: <TrendingUp size={16} />, value: `${stats.avgScore}점`, label: '평균 점수', color: 'bg-green-100 text-green-600' },
            { icon: <Calendar size={16} />, value: `${stats.avgAttendance}일`, label: '평균 출석', color: 'bg-blue-100 text-blue-600' },
            { icon: <Flame size={16} />, value: stats.activeToday, label: '오늘 접속', color: 'bg-orange-100 text-orange-600' },
            { icon: <Trophy size={16} />, value: stats.levelCounts['advanced'] ?? 0, label: '고급 수강생', color: 'bg-violet-100 text-violet-600' },
            { icon: <Globe size={16} />, value: Object.keys(stats.langCounts).length, label: '사용 언어', color: 'bg-sky-100 text-sky-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', s.color)}>
                {s.icon}
              </div>
              <div className="text-lg font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Level distribution */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-indigo-500" />
            <span className="font-semibold text-sm text-gray-800">레벨별 분포</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['beginner', 'elementary', 'intermediate', 'advanced'] as const).map(lvl => {
              const cnt = stats.levelCounts[lvl] ?? 0;
              const pct = stats.total ? Math.round((cnt / stats.total) * 100) : 0;
              const info = LEVEL_LABELS[lvl];
              return (
                <div key={lvl} className="text-center">
                  <div className="text-xs font-semibold text-gray-400 mb-2">{info.ko}</div>
                  <div className="h-16 bg-gray-50 rounded-lg flex items-end justify-center overflow-hidden mb-1">
                    <div
                      className={clsx('w-8 rounded-t-md transition-all', info.color.replace('text-', 'bg-').split(' ')[0])}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-gray-700">{cnt}명</div>
                  <div className="text-xs text-gray-400">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름·이메일 검색"
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="all">전체 레벨</option>
          <option value="beginner">입문</option>
          <option value="elementary">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as typeof sortKey)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="totalScore">점수 순</option>
          <option value="attendanceDays">출석 순</option>
          <option value="streak">연속 학습 순</option>
          <option value="name">이름 순</option>
        </select>
      </div>

      {/* Student table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_80px_70px_60px_60px_80px_90px] gap-4 px-5 py-3 text-xs font-semibold text-gray-400 border-b border-gray-100 bg-gray-50">
          <span>수강생</span>
          <span>레벨</span>
          <span className="text-right">점수</span>
          <span className="text-right">출석</span>
          <span className="text-right">연속</span>
          <span className="text-right">완료 단원</span>
          <span className="text-right">최근 접속</span>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">검색 결과가 없습니다.</div>
          )}
          {filtered.map(s => {
            const lvlInfo = LEVEL_LABELS[s.level];
            return (
              <div key={s.studentId} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_70px_60px_60px_80px_90px] gap-2 sm:gap-4 px-5 py-4 hover:bg-indigo-50/30 transition-colors">
                {/* Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 text-sm truncate">{s.name}</span>
                      <span>{LANG_FLAGS[s.lang] ?? '🌐'}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{s.email}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', lvlInfo.color)}>{lvlInfo.ko}</span>
                </div>
                <div className="text-right">
                  <span className={clsx('text-sm font-bold', s.totalScore >= 90 ? 'text-green-600' : s.totalScore >= 70 ? 'text-blue-600' : 'text-gray-600')}>
                    {s.totalScore}점
                  </span>
                </div>
                <div className="text-right text-sm font-medium text-gray-700">{s.attendanceDays}일</div>
                <div className="text-right text-sm text-orange-500 font-medium">🔥{s.streak}</div>
                <div className="text-right text-sm text-gray-600">{s.completedUnits.length}단원</div>
                <div className="text-right text-xs text-gray-400">{s.lastActiveAt}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-right">총 {filtered.length}명 표시 / 전체 {students.length}명</div>
    </div>
  );
}
