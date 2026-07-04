'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Home, Package, MessageCircle, Leaf, ChevronLeft } from 'lucide-react';
import { useCartItems } from '@/store/shopCart';

export default function HancandyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 범용 쇼핑몰 장바구니(slug 스코프) — candyCart 대체
  const itemCount = useCartItems('hancandy').reduce((sum, i) => sum + i.qty, 0);

  const navLinks = [
    { href: '/hancandy', label: '홈', icon: Home, exact: true },
    { href: '/hancandy/products', label: '제품', icon: Package },
    { href: '/hancandy/chat', label: 'AI 상담', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      <header className="bg-white/90 backdrop-blur border-b border-green-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/hancandy" className="flex items-center gap-2.5 font-black text-green-700">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="text-lg tracking-tight">HanCandy</span>
            <span className="text-xs font-normal text-green-400 hidden sm:inline">무설탕 건강 캔디</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            <Link
              href="/hancandy/cart"
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/hancandy/cart'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">장바구니</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-green-100 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-400 space-y-1">
          <div className="flex items-center justify-center gap-2 font-bold text-green-700 mb-2">
            <Leaf size={14} />
            <span>HanCandy</span>
            <span className="font-normal text-gray-400">by 주식회사 에이젯</span>
          </div>
          <p>사업자 정보: <span className="font-medium text-gray-500">준비중</span> | 통신판매업 신고: <span className="font-medium text-gray-500">준비중</span></p>
          <p>aizet.co.kr · hancandy.co.kr</p>
          <p className="text-xs mt-2 text-gray-300">본 제품은 의약품이 아니며 질병 예방·치료를 목적으로 하지 않습니다.</p>
        </div>
      </footer>
    </div>
  );
}
