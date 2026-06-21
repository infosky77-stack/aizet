'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, CalendarClock, Bot, ArrowLeft, CreditCard, Printer, BookOpen, Leaf, Scale, BarChart3, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: '주문 관리', icon: ClipboardList },
  { href: '/admin/payments', label: '결제 관리', icon: CreditCard },
  { href: '/admin/settlement', label: '매출 정산', icon: BarChart3 },
  { href: '/admin/robots', label: '서빙 로봇', icon: Bot },
  { href: '/admin/menu', label: '메뉴 관리', icon: UtensilsCrossed },
  { href: '/admin/reservations', label: '예약 관리', icon: CalendarClock },
  { href: '/admin/menu-print', label: '메뉴판 인쇄', icon: Printer },
  { href: '/admin/korean', label: '한국어 학습', icon: BookOpen },
  { href: '/admin/hancandy', label: 'HanCandy', icon: Leaf },
  { href: '/admin/tax', label: '세무법인', icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 페이지 이동 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center shadow-lg"
        aria-label="메뉴 열기"
      >
        <Menu size={18} />
      </button>

      {/* 모바일 뒷배경 */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={clsx(
          'w-56 shrink-0 bg-stone-900 text-stone-100 flex flex-col h-screen',
          // 데스크탑: flex 흐름 안에서 sticky
          'md:sticky md:top-0 md:translate-x-0 md:z-auto',
          // 모바일: fixed 오버레이, 슬라이드 애니메이션
          'fixed top-0 left-0 z-50 transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* 로고 */}
        <div className="px-5 py-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <UtensilsCrossed size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">AIZET</p>
              <p className="text-[10px] text-stone-500">관리자 모드</p>
            </div>
          </div>
          {/* 모바일 닫기 버튼 */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
            aria-label="메뉴 닫기"
          >
            <X size={14} />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 */}
        <div className="px-3 py-4 border-t border-stone-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft size={16} />
            고객 화면으로
          </Link>
        </div>
      </aside>
    </>
  );
}
