'use client';

import Link from 'next/link';
import { BookOpen, TestTube, GraduationCap, MessageCircle, LayoutDashboard, Globe, Star, ArrowRight, Users } from 'lucide-react';

const LANG_FLAGS = [
  { flag: '🇺🇸', lang: 'English', code: 'en' },
  { flag: '🇨🇳', lang: '中文', code: 'zh' },
  { flag: '🇯🇵', lang: '日本語', code: 'ja' },
  { flag: '🇻🇳', lang: 'Tiếng Việt', code: 'vi' },
];

const STEPS = [
  { icon: <TestTube size={22} />, title: '레벨 테스트', sub: 'AI가 현재 수준을 진단', href: '/korean/test', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { icon: <GraduationCap size={22} />, title: '단계별 학습', sub: '자음→모음→단어→문장→회화', href: '/korean/learn', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { icon: <MessageCircle size={22} />, title: 'AI 회화 연습', sub: '발음·문법 피드백 실시간 제공', href: '/korean/chat', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { icon: <LayoutDashboard size={22} />, title: '나의 진도', sub: '출석·점수·완료 단원 확인', href: '/korean/dashboard', color: 'bg-sky-100 text-sky-700 border-sky-200' },
];

const FEATURES = [
  { icon: <Globe size={18} />, title: '4개국어 설명', desc: '영어·중국어·일본어·베트남어로 학습 내용 설명' },
  { icon: <Star size={18} />, title: 'AI 발음 피드백', desc: '입력한 문장에 발음·문법 교정을 즉시 제공' },
  { icon: <Users size={18} />, title: '수강생 관리', desc: '관리자 대시보드에서 학생 진도·성적 통합 관리' },
  { icon: <BookOpen size={18} />, title: '체계적 커리큘럼', desc: '자음모음부터 일상 회화까지 5단계 체계 구성' },
];

export default function KoreanHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <BookOpen size={14} />
          한국어 교육 플랫폼 데모
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
          한국어, 이제<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI와 함께</span> 배우세요
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6">
          외국인 학습자를 위한 스마트 한국어 학습 플랫폼.<br />
          AI 레벨 진단부터 회화 피드백까지 완벽하게.
        </p>

        {/* Language flags */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {LANG_FLAGS.map(l => (
            <div key={l.code} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm shadow-sm">
              <span>{l.flag}</span>
              <span className="text-gray-600">{l.lang}</span>
            </div>
          ))}
        </div>

        <Link
          href="/korean/test"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors"
        >
          레벨 테스트 시작하기
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {STEPS.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex flex-col items-center text-center gap-2 p-5 rounded-2xl border-2 ${s.color} hover:shadow-md transition-all group`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs font-semibold text-gray-400">STEP {i + 1}</div>
            <div className="font-bold text-sm">{s.title}</div>
            <div className="text-xs opacity-80">{s.sub}</div>
            <ArrowRight size={14} className="mt-1 opacity-40 group-hover:opacity-80 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">플랫폼 주요 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                {f.icon}
              </div>
              <div className="font-semibold text-sm text-gray-800">{f.title}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample phrases */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white text-center">
        <div className="text-sm font-medium opacity-80 mb-3">오늘의 표현</div>
        <div className="text-3xl font-bold mb-1">안녕하세요! 잘 부탁드립니다.</div>
        <div className="text-sm opacity-75">Hello! I look forward to working with you.</div>
        <div className="mt-4">
          <Link href="/korean/learn" className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            학습 시작 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
