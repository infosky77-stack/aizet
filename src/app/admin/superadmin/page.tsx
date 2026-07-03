'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  Shield, ExternalLink, Settings,
  Scale, HeartPulse, Scissors, Dumbbell, Home,
  ShoppingBag, UtensilsCrossed, Leaf, Printer, BookOpen, Landmark, Sparkles,
  // 새 데모 추가 시 필요한 아이콘을 여기에 import
} from 'lucide-react';
import { DEMO_REGISTRY, DemoEntry } from '@/lib/demoRegistry';

/* ── 아이콘 맵 (demoRegistry의 icon 문자열 → 컴포넌트) ─────────────────────── */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Scale, HeartPulse, Scissors, Dumbbell, Home,
  ShoppingBag, UtensilsCrossed, Leaf, Printer, BookOpen, Landmark, Sparkles,
};

/* ── 관리자 종류 뱃지 ─────────────────────────────────────────────────────────── */
function AdminBadge({ kind }: { kind: DemoEntry['adminKind'] }) {
  if (kind === 'dedicated') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
        전용
      </span>
    );
  }
  if (kind === 'shared') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
        공용
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
      미구현
    </span>
  );
}

/* ── 데모 카드 ─────────────────────────────────────────────────────────────────── */
function DemoCard({ demo }: { demo: DemoEntry }) {
  const Icon = ICON_MAP[demo.icon] ?? Shield;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* 헤더: 아이콘 + 이름 + 뱃지 */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${demo.color}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 text-sm">{demo.name}</p>
          <p className="text-xs text-stone-400">{demo.publicPath}</p>
        </div>
        <AdminBadge kind={demo.adminKind} />
      </div>

      {/* 버튼 행 */}
      <div className="flex gap-2">
        {/* 관리자 버튼 (있으면 해당 경로, 없으면 비활성) */}
        {demo.adminPath ? (
          <a
            href={demo.adminPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-white text-xs font-semibold transition-colors"
          >
            <Settings size={12} />
            관리자
          </a>
        ) : (
          <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 text-stone-400 text-xs font-medium cursor-not-allowed">
            관리자 미구현
          </span>
        )}

        {/* 데모 보기 버튼 */}
        <a
          href={demo.publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors"
        >
          <ExternalLink size={12} />
          데모
        </a>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ────────────────────────────────────────────────────────────────── */
export default function SuperAdminPage() {
  const router = useRouter();
  const { session, status } = useSession();

  // ── 아래 주석 블록: "실제 가입 회원" 목록 기능 (숨김 처리, 코드 보존) ──────────
  /*
  interface MemberRow {
    id: string; email: string; name: string; picture: string;
    shop_name: string; industry: string; slug: string;
    plan: string; created_at: number;
  }

  const INDUSTRY_LABEL: Record<string, string> = {
    restaurant:'음식점', cafe:'카페', beauty:'미용실', fitness:'헬스/피트니스',
    retail:'소매점', consulting:'컨설팅', tax:'세무사', clinic:'클리닉/의원',
    fashion:'패션/의류', pension:'펜션/숙박', print:'인쇄/출력',
    accommodation:'숙박업', education:'교육', shopping:'쇼핑/유통',
  };

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberLoading, setMemberLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);

  // fetch /api/admin/superadmin/users → setMembers
  // handleEnter(userId) → POST /api/admin/superadmin/impersonate → window.location.href='/admin'
  */
  // ────────────────────────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.isSuperAdmin) {
      router.replace('/admin');
      return;
    }
    setLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
        로딩 중...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">전체 데모 보기</h1>
          <p className="text-sm text-stone-500">고정 데모 {DEMO_REGISTRY.length}개 — 새 데모는 demoRegistry.ts에 추가</p>
        </div>
      </div>

      {/* 데모 카드 그리드 (DEMO_REGISTRY 자동 렌더링) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_REGISTRY.map(demo => (
          <DemoCard key={demo.slug} demo={demo} />
        ))}
      </div>

      {/* 뱃지 범례 */}
      <div className="mt-8 flex items-center gap-4 text-xs text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400" />전용: 이 데모 전용 관리자
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-stone-400" />공용: 공용 관리자 페이지
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />미구현: 공개 페이지만
        </span>
      </div>
    </div>
  );
}
