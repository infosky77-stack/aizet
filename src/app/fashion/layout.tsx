'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Home, Bot, ShoppingCart, Ruler, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/fashion', label: '홈', icon: Home, exact: true },
  { href: '/fashion/chat', label: 'AI 스타일 추천', icon: Bot },
  { href: '/fashion/cart', label: '장바구니', icon: ShoppingCart },
  { href: '/fashion/size-guide', label: '사이즈 가이드', icon: Ruler },
];

export default function FashionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-orange-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-orange-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/fashion" className="flex items-center gap-2.5 font-black text-stone-900">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm">
              <ShoppingBag size={15} className="text-white" />
            </div>
            <span className="text-base tracking-tight">Mode Fashion</span>
            <span className="text-sm font-normal text-orange-500 hidden sm:inline">모던 패션 편집샵</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-stone-700 hover:bg-orange-50 hover:text-orange-900'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                  {Icon === ShoppingCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-orange-100 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-600 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-stone-800 mb-2">
            <ShoppingBag size={14} />
            <span>Mode Fashion</span>
            <span className="font-normal text-slate-500">by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p>사업자등록번호: 준비중 | 통신판매업신고번호: 준비중</p>
          <p className="text-xs text-slate-400 mt-2">본 페이지는 AIZET 플랫폼 의류 쇼핑몰 데모입니다. 표시된 상품과 가격은 기획안 기반 예시이며 실제 구매가 이루어지지 않습니다.</p>
        </div>
      </footer>
    </div>
  );
}
