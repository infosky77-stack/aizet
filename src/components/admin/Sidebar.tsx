'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, CalendarClock, Bot,
  ArrowLeft, CreditCard, Printer, BookOpen, Leaf, Scale, BarChart3,
  Menu, X, Cloud, LogOut, ChevronDown, Shield, Zap, Crown, Globe, Settings, Wand2, Building2, FileText, FolderOpen,
  Users, ChevronLeft, Film, ListVideo, Landmark,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from '@/hooks/useSession';
import { AizetLogo } from '@/components/AizetLogo';
import type { UserPlan } from '@/types/auth';

type NavItem = {
  href:       string;
  label:      string;
  icon:       React.ComponentType<{ size?: number }>;
  exact?:     boolean;
  /** undefined = 공통(항상 표시). 배열 = 해당 업종일 때만 표시. */
  industries?: string[];
};

const NAV: NavItem[] = [
  // ── 공통 ──────────────────────────────────────────────────
  { href: '/admin',            label: '대시보드',       icon: LayoutDashboard, exact: true },
  { href: '/admin/payments',   label: '결제 관리',      icon: CreditCard },
  { href: '/admin/settlement', label: '매출 정산',      icon: BarChart3 },
  { href: '/admin/editor',     label: '홈페이지 편집',  icon: Wand2 },
  { href: '/admin/domain',     label: '도메인 관리',    icon: Globe },
  { href: '/admin/settings',   label: '가게 정보 설정', icon: Settings },

  // ── 식당 / 카페 ────────────────────────────────────────────
  { href: '/admin/orders',       label: '주문 관리',   icon: ClipboardList,   industries: ['restaurant', 'cafe'] },
  { href: '/admin/robots',       label: '서빙 로봇',   icon: Bot,             industries: ['restaurant', 'cafe'] },
  { href: '/admin/menu',         label: '메뉴 관리',   icon: UtensilsCrossed, industries: ['restaurant', 'cafe'] },
  { href: '/admin/menu-print',   label: '메뉴판 인쇄', icon: Printer,         industries: ['restaurant', 'cafe'] },

  // ── 예약 계열 ──────────────────────────────────────────────
  { href: '/admin/reservations', label: '예약 관리',   icon: CalendarClock,   industries: ['beauty', 'fitness', 'clinic', 'pension'] },

  // ── 세무사 ────────────────────────────────────────────────
  { href: '/admin/tax',           label: '세무법인',    icon: Scale,      exact: true, industries: ['tax'] },
  { href: '/admin/tax/clients',   label: '거래처 관리', icon: Building2,               industries: ['tax'] },
  { href: '/admin/tax/filings',   label: '신고 현황',   icon: FileText,                industries: ['tax'] },
  { href: '/admin/tax/documents', label: '문서 보관',   icon: FolderOpen,              industries: ['tax'] },

  // ── 법무사 ────────────────────────────────────────────────
  { href: '/admin/legal',         label: '법무사무소',  icon: Landmark,   exact: true, industries: ['legal'] },

  // ── 데모 전용 ─────────────────────────────────────────────
  { href: '/admin/korean',   label: '한국어 학습', icon: BookOpen, industries: ['demo'] },
  { href: '/admin/hancandy', label: 'HanCandy',   icon: Leaf,     industries: ['demo'] },

  // ── 자동화 엔진 (공통) ────────────────────────────────────
  { href: '/admin/super-editor', label: '슈퍼에디터', icon: Film },
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

// ── super_admin 전용 NAV ────────────────────────────────────────────────────
const SUPER_NAV: NavItem[] = [
  { href: '/admin/superadmin',   label: '회원 사이트 목록', icon: Users,     exact: true },
  { href: '/admin/render-queue', label: '렌더 큐',          icon: ListVideo, exact: true },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { session, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isSuperAdmin    = session?.isSuperAdmin    ?? false;
  const isImpersonating = session?.isImpersonating ?? false;
  const industry        = session?.industry        ?? '';

  // ── NAV 결정 ──────────────────────────────────────────────────────────────
  // super_admin 비-impersonation: 전체관리 전용 메뉴
  // super_admin impersonating: 해당 업종 메뉴 (배너 따로 표시)
  // 일반 유저: industry 필터 (기존 동작 유지)
  // !industry (빈 문자열)가 true가 되어 모든 메뉴가 표시되는 버그 수정
  // 업종 미설정 시 공통 메뉴(industries 없는 항목)만 표시
  const visibleNav = (isSuperAdmin && !isImpersonating)
    ? SUPER_NAV
    : NAV.filter(({ industries }) =>
        !industries || (!!industry && industries.includes(industry))
      );

  async function handleExitImpersonate() {
    setExiting(true);
    await fetch('/api/admin/superadmin/exit', { method: 'POST' });
    // window.location.replace: 현재 히스토리 엔트리(/admin)를 /admin/superadmin으로
    // 교체하므로 뒤로가기로 /admin에 돌아와 AdminDashboard가 잘못된 replace를
    // 재실행하는 상황이 생기지 않는다.
    window.location.replace('/admin/superadmin');
  }

  // ── 로고 아이콘 결정 ───────────────────────────────────────────────────────
  const LogoIcon = (isSuperAdmin && !isImpersonating) ? Shield : UtensilsCrossed;
  const logoColor = (isSuperAdmin && !isImpersonating) ? 'bg-violet-600' : 'bg-amber-600';
  const logoSubtitle = (isSuperAdmin && !isImpersonating) ? '통합 관리자' : '관리자 모드';

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
        {/* impersonation 배너 */}
        {isSuperAdmin && isImpersonating && (
          <div className="px-3 pt-3">
            <button
              onClick={handleExitImpersonate}
              disabled={exiting}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-violet-100 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <ChevronLeft size={13} />
              {exiting ? '돌아가는 중...' : '전체 관리로 돌아가기'}
            </button>
          </div>
        )}

        {/* 로고 */}
        <div className="px-5 py-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', logoColor)}>
              <LogoIcon size={15} className="text-white" />
            </div>
            <div>
              <AizetLogo className="font-bold text-sm tracking-tight" />
              <p className="text-[10px] text-stone-500">{logoSubtitle}</p>
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
          {visibleNav.map(({ href, label, icon: Icon, exact }) => {
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
