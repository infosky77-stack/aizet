'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Home, CalendarClock, MessageCircle, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/salon', label: '홈', icon: Home, exact: true },
  { href: '/salon/reservation', label: '예약', icon: CalendarClock },
  { href: '/salon/chat', label: 'AI 스타일 상담', icon: MessageCircle },
];

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/salon" className="flex items-center gap-2.5 font-black text-rose-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Scissors size={15} className="text-white" />
            </div>
            <span className="text-base tracking-tight">블루밍 헤어</span>
            <span className="text-sm font-normal text-rose-500 hidden sm:inline">프리미엄 헤어살롱</span>
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
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-800 hover:bg-rose-50 hover:text-rose-900'
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
      <footer className="border-t border-rose-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-rose-800 mb-2">
            <Scissors size={14} />
            <span>블루밍 헤어</span>
            <span className="font-normal text-slate-500">by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p>사업자등록번호: 준비중 | 미용사 면허번호: 준비중</p>
          <p className="text-xs text-slate-400 mt-2">본 페이지는 AIZET 플랫폼 헤어살롱 데모입니다. 표시된 가격과 정보는 기획안 기반 예시이며 실제 시술이 제공되지 않습니다.</p>
        </div>
      </footer>
    </div>
  );
}
