'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Home, CalendarClock, MessageCircle, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/clinic', label: '홈', icon: Home, exact: true },
  { href: '/clinic/reservation', label: '진료 예약', icon: CalendarClock },
  { href: '/clinic/chat', label: 'AI 증상 상담', icon: MessageCircle },
];

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-emerald-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/clinic" className="flex items-center gap-2.5 font-black text-emerald-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm">
              <Leaf size={15} className="text-white" />
            </div>
            <span className="text-base tracking-tight">자연한의원</span>
            <span className="text-sm font-normal text-emerald-600 hidden sm:inline">자연치유·전통한방</span>
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
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900'
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
      <footer className="border-t border-emerald-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-emerald-800 mb-2">
            <Leaf size={14} />
            <span>자연한의원</span>
            <span className="font-normal text-slate-500">by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p>사업자등록번호: 준비중 | 한의사 면허번호: 준비중</p>
          <p className="text-xs text-slate-400 mt-2">본 페이지는 AIZET 플랫폼 한의원 데모입니다. 실제 진료·처방이 제공되지 않으며, 표시된 가격과 정보는 기획안 기반 예시입니다. 의료적 판단은 반드시 전문 의료인과 상담하세요.</p>
        </div>
      </footer>
    </div>
  );
}
