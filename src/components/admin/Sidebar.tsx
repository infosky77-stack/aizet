'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, CalendarClock, Bot,
  ArrowLeft, CreditCard, Printer, BookOpen, Leaf, Scale, BarChart3,
  Menu, X, Cloud, LogOut, ChevronDown, Shield, Zap, Crown, Globe, Settings, Wand2, Building2, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from '@/hooks/useSession';
import { AizetLogo } from '@/components/AizetLogo';
import type { UserPlan } from '@/types/auth';

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
  { href: '/admin/tax', label: '세무법인', icon: Scale, exact: true },
  { href: '/admin/tax/clients', label: '거래처 관리', icon: Building2 },
  { href: '/admin/tax/filings', label: '신고 현황',   icon: FileText  },
  { href: '/admin/editor', label: '홈페이지 편집', icon: Wand2 },
  { href: '/admin/domain', label: '도메인 관리', icon: Globe },
  { href: '/admin/settings', label: '가게 정보 설정', icon: Settings },
];

const PLAN_META: Record<UserPlan, { label: string; icon: React.ReactNode; color: string }> = {
  free:     { label: '무료', icon: <Shield size={9} />,  color: 'bg-stone-600 text-stone-300' },
  pro:      { label: 'Pro',  icon: <Zap size={9} />,    color: 'bg-amber-600 text-amber-100' },
  business: { label: 'Biz',  icon: <Crown size={9} />,  color: 'bg-violet-600 text-violet-100' },
};

function UserCard({ onSignOut }: { onSignOut: () => void }) {
  const { session, status } = useSession();
  const [expanded, setExpanded] = useState(false);

  if (status === 'loading') {
    return (
      <div className="px-3 py-3 border-t border-stone-800">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-stone-700 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2.5 w-20 bg-stone-700 rounded animate-pulse" />
            <div className="h-2 w-28 bg-stone-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-3 py-3 border-t border-stone-800 flex flex-col gap-1">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft size={16} />
          고객 화면으로
        </Link>
      </div>
    );
  }

  const plan = PLAN_META[session.plan] ?? PLAN_META.free;

  return (
    <div className="px-3 py-3 border-t border-stone-800 flex flex-col gap-1">
      {/* User card */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-800 transition-colors text-left"
      >
        {/* Avatar */}
        {session.picture ? (
          <img
            src={session.picture}
            alt={session.name}
            className="w-8 h-8 rounded-full shrink-0 object-cover ring-2 ring-stone-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
            {session.name?.[0] ?? '?'}
          </div>
        )}
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-stone-100 truncate">{session.name}</p>
            <span className={clsx('inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', plan.color)}>
              {plan.icon}{plan.label}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 truncate">{session.email}</p>
        </div>
        <ChevronDown size={12} className={clsx('text-stone-500 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mx-1 mb-1 rounded-xl bg-stone-800 border border-stone-700 overflow-hidden">
          {/* Drive status */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-700">
            <Cloud size={12} className={session.driveConnected ? 'text-blue-400' : 'text-stone-600'} />
            <span className="text-[11px] text-stone-400">
              {session.driveConnected ? '구글 드라이브 연동됨' : '드라이브 미연동'}
            </span>
            {session.driveConnected && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </div>
          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-rose-400 hover:bg-stone-700 transition-colors"
          >
            <LogOut size={12} />
            로그아웃
          </button>
        </div>
      )}

      {/* Back to home */}
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
      >
        <ArrowLeft size={14} />
        고객 화면으로
      </Link>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const [open, setOpen] = useState(false);

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
          'md:sticky md:top-0 md:translate-x-0 md:z-auto',
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
              <AizetLogo className="font-bold text-sm tracking-tight" />
              <p className="text-[10px] text-stone-500">관리자 모드</p>
            </div>
          </div>
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

        {/* 하단 유저 카드 */}
        <UserCard onSignOut={signOut} />
      </aside>
    </>
  );
}
