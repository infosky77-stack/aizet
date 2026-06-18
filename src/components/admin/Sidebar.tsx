'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, CalendarClock, Bot, ArrowLeft, CreditCard, Printer, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: '주문 관리', icon: ClipboardList },
  { href: '/admin/payments', label: '결제 관리', icon: CreditCard },
  { href: '/admin/robots', label: '서빙 로봇', icon: Bot },
  { href: '/admin/menu', label: '메뉴 관리', icon: UtensilsCrossed },
  { href: '/admin/reservations', label: '예약 관리', icon: CalendarClock },
  { href: '/admin/menu-print', label: '메뉴판 인쇄', icon: Printer },
  { href: '/admin/korean', label: '한국어 학습', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-stone-900 text-stone-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">AIZET</p>
            <p className="text-[10px] text-stone-500">관리자 모드</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
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

      {/* Footer */}
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
  );
}
