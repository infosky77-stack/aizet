'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, Home, CalendarDays, Calculator, MessageCircle, CalendarClock, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/tax', label: '홈', icon: Home, exact: true },
  { href: '/tax/calendar', label: '신고 캘린더', icon: CalendarDays },
  { href: '/tax/calculator', label: '세금 계산기', icon: Calculator },
  { href: '/tax/chat', label: 'AI 세무 상담', icon: MessageCircle },
  { href: '/tax/reservation', label: '상담 예약', icon: CalendarClock },
];

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tax" className="flex items-center gap-2.5 font-black text-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-blue-800 flex items-center justify-center shadow-sm">
              <Scale size={15} className="text-white" />
            </div>
            <span className="text-base tracking-tight">세무법인 에이젯</span>
            <span className="text-sm font-normal text-slate-600 hidden sm:inline">AI 세무 서비스</span>
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
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
      <footer className="border-t border-slate-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-700 mb-2">
            <Scale size={14} />
            <span>세무법인 에이젯</span>
            <span className="font-normal text-slate-600">by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p>사업자등록번호: 준비중 | 세무사 등록번호: 준비중</p>
          <p className="text-sm text-slate-500 mt-2">본 페이지는 AIZET 플랫폼 데모입니다. 실제 세무 서비스를 제공하지 않습니다. 세금 계산 결과는 참고용이며 실제 납부세액과 다를 수 있습니다.</p>
        </div>
      </footer>
    </div>
  );
}
