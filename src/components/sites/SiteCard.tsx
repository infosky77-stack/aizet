'use client';

// 홈페이지(사업장) 카드 — 재사용 표시 전용 컴포넌트. 폴더를 여는 느낌의 깔끔한 카드.
// 데이터는 상위(page)가 넘기고, 클릭 동작(onOpen)도 주입받는다(이 단계에선 콘솔 로그만).

import { Folder } from 'lucide-react';
import type { MemberSite } from '@/lib/registry/registryDb';

// 테넌시 업종(order_type) → 표시 라벨. 화면 지역 매핑(기존 페이지들도 각자 로컬 정의).
const INDUSTRY_LABEL: Record<string, string> = {
  catalog:  '도록·작품집',
  education: '한국어교육',
  magazine: '잡지',
  video:    '영상',
  print:    '인쇄',
  product:  '제품상세',
  beauty:   '뷰티',
};

/** lastEditedAt(ms) → "2026. 7. 5." 형식. 없으면 null */
function fmtEdited(ms: number | null): string | null {
  if (!ms) return null;
  const d = new Date(ms);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function SiteCard({
  site,
  onOpen,
}: {
  site: MemberSite;
  onOpen?: (siteId: string) => void;
}) {
  const edited = fmtEdited(site.lastEditedAt);
  const industryLabel = INDUSTRY_LABEL[site.industry] ?? site.industry;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(site.siteId)}
      className="group flex flex-col text-left bg-white border border-stone-200 rounded-2xl p-5
                 shadow-sm hover:shadow-md hover:border-amber-300 transition
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center
                      group-hover:bg-amber-100 transition mb-3">
        <Folder size={22} strokeWidth={2} />
      </div>

      {/* 주(主): 업종 — 같은 회원의 여러 홈페이지를 한눈에 구분 */}
      <h3 className="text-lg font-bold text-stone-800 leading-snug line-clamp-2">
        {industryLabel}
      </h3>

      {/* 부(副): 상호 — 회원/사업체 단위 공유 값(shop_name) */}
      <p className="text-xs font-semibold text-stone-500 mt-1 truncate">{site.shopName}</p>

      {site.slug && (
        <p className="text-xs text-stone-400 mt-1 truncate">/{site.slug}</p>
      )}

      {edited && (
        <p className="text-[11px] text-stone-400 mt-3">최근 편집: {edited}</p>
      )}
    </button>
  );
}
