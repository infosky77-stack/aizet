'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Home, CalendarClock, MessageCircle, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/fitness', label: '홈', icon: Home, exact: true },
  { href: '/fitness/reservation', label: '예약', icon: CalendarClock },
  { href: '/fitness/chat', label: 'AI 운동 상담', icon: MessageCircle },
];

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-violet-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/fitness" className="flex items-center gap-2.5 font-black text-violet-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
              <Dumbbell size={15} className="text-white" />
            </div>
            <span className="text-base tracking-tight">코어핏 필라테스</span>
            <span className="text-sm font-normal text-violet-500 hidden sm:inline">해운대 · 기구·매트·PT</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-violet-700 text-white'
                      : 'text-violet-800 hover:bg-violet-50 hover:text-violet-900'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-violet-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-violet-800 mb-2">
            <Dumbbell size={14} />
            <span>코어핏 필라테스</span>
            <span className="font-normal text-slate-500">by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p>사업자등록번호: 준비중 | 부산광역시 해운대구 해운대로 123 코어핏빌딩 2층</p>
          <p className="text-xs text-slate-400 mt-2">본 페이지는 AIZET 플랫폼 필라테스 스튜디오 데모입니다. 표시된 가격과 정보는 기획안 기반 예시이며 실제 수업이 제공되지 않습니다.</p>
        </div>
      </footer>
    </div>
  );
}
