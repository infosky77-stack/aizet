'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Printer, LayoutDashboard, ClipboardList, ArrowLeft, Folder, Tag } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/admin/print', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/print/orders', label: '주문 관리', icon: ClipboardList },
];

const CUSTOMER_LINKS = [
  { href: '/print/files', label: '거래처 파일 관리', icon: Folder },
  { href: '/print/labels', label: '라벨 생성기', icon: Tag },
];

export function PrintAdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-stone-900 text-stone-100 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Printer size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">AIZET 인쇄</p>
            <p className="text-[10px] text-stone-500">관리자 모드</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-stone-800 flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest px-3 mb-1">고객 기능</p>
        {CUSTOMER_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
        <Link
          href="/print"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors mt-1"
        >
          <ArrowLeft size={16} />
          고객 화면으로
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft size={16} />
          식당 어드민
        </Link>
      </div>
    </aside>
  );
}
