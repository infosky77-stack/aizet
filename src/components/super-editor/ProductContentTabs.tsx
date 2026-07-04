'use client';

// 제품 상세페이지 콘텐츠 하나를 열었을 때의 메인 화면 — 기본은 섹션 목록(ProductSectionPanel).
// VideoContentTabs와 대칭 구조: 파일 관리는 z-[120] 두 번째 전체화면 오버레이,
// 열림 여부는 부모(URL ?view=files)가 소유. 스냅샷의 소유자는 이 컴포넌트다(1.5초 디바운스 저장).
//
// 다른 도메인과 달리 "전체 편집기에서 열기"가 없다 — 전체 편집기는 catalog/video 캔버스 전제라
// product는 이 팝업 안 섹션 편집이 전부다(의도된 v1 범위).
// "AI 다듬기"는 자리만 있다 — productAiRefiner.available이 false인 동안 비활성이며,
// 회원 API 키 연동 시 aiRefine.ts의 구현체만 교체하면 이 버튼이 살아난다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Files, Loader2, Sparkles, X } from 'lucide-react';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { ProductSectionPanel } from '@/components/super-editor/ProductSectionPanel';
import { ProductDetailButton } from '@/components/super-editor/ProductDetailButton';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import {
  ProductDetailSnapshot, ProductSection, isProductDetailSnapshot, emptyProductDetail,
} from '@/lib/super-editor/product/types';
import { PRODUCT_TEMPLATES } from '@/lib/super-editor/product/templates';
import { productAiRefiner } from '@/lib/super-editor/product/aiRefine';

interface Props {
  orderId: string;
  title:   string;
  isPaid:  boolean;
  /** 파일 관리 오버레이 열림 여부 — 출처는 부모(URL) */
  filesOpen: boolean;
  onFilesOpenChange: (open: boolean) => void;
  onBack: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function ProductContentTabs({
  orderId, title, isPaid, filesOpen, onFilesOpenChange, onBack,
}: Props) {
  const [snapshot, setSnapshot] = useState<ProductDetailSnapshot | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  // 이 콘텐츠에 연결된 쇼핑몰 상품 — 있으면 미리보기에 "상품에 게시" 액션이 붙는다
  const [linkedProductId, setLinkedProductId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/shop/products?detailOrderId=${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setLinkedProductId(data?.product?.id ?? null); });
    return () => { cancelled = true; };
  }, [orderId]);

  // 원장 하이드레이션 — 섹션 이미지 선택기/썸네일이 파일 화면을 안 거쳐도 원장을 읽을 수 있게(멱등)
  useEffect(() => {
    const ledger = useFileLedgerStore.getState();
    void ledger.hydrateFromLocalIndex(orderId);
    void ledger.refreshFromServer(orderId);
  }, [orderId]);

  // 스냅샷 로드 — 형식이 아니면(새 콘텐츠 포함) 기본 5섹션 골격으로 시작
  useEffect(() => {
    let cancelled = false;
    setSnapshot(null);
    fetch(`/api/admin/super-editor?orderId=${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.order) return;
        let raw: unknown = {};
        try { raw = JSON.parse(data.order.snapshot || '{}'); } catch { /* 빈 골격으로 */ }
        setSnapshot(isProductDetailSnapshot(raw) ? raw : emptyProductDetail(data.order.title || title));
      });
    return () => { cancelled = true; };
  }, [orderId, title]);

  const persist = useCallback(async (next: ProductDetailSnapshot) => {
    setSaveStatus('saving');
    const res = await fetch('/api/admin/super-editor', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, snapshot: next, title: next.title }),
    }).catch(() => null);
    setSaveStatus(res?.ok ? 'saved' : 'error');
    if (res?.ok) setTimeout(() => setSaveStatus('idle'), 2000);
  }, [orderId]);

  function applyChange(patch: Partial<ProductDetailSnapshot>) {
    if (!snapshot) return;
    const next = { ...snapshot, ...patch };
    setSnapshot(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void persist(next); }, 1500);
  }

  // 언마운트 시 대기 중인 저장 타이머 정리(마지막 변경은 이미 state에 반영돼 다음 열람 때 저장됨)
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 폴더로
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">
            {title || '제목 없음'}
            {saveStatus === 'saving' && <span className="ml-2 text-[11px] font-medium text-stone-400">저장 중…</span>}
            {saveStatus === 'saved'  && <span className="ml-2 text-[11px] font-medium text-emerald-600">저장됨</span>}
            {saveStatus === 'error'  && <span className="ml-2 text-[11px] font-medium text-red-500">저장 실패 — 변경 시 재시도</span>}
          </p>

          {/* 템플릿 선택 — 색/타이포 프리셋(templates.ts) */}
          <select
            value={snapshot?.templateId ?? 'clean'}
            disabled={!snapshot || isPaid}
            onChange={(e) => applyChange({ templateId: e.target.value })}
            className="shrink-0 text-xs border border-stone-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
            title="상세페이지 색·서체 템플릿"
          >
            {Object.values(PRODUCT_TEMPLATES).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* AI 다듬기 — 회원 API 키 연동 전까지 비활성(자리/인터페이스만) */}
          <button
            disabled={!productAiRefiner.available}
            title={productAiRefiner.available ? undefined : productAiRefiner.unavailableReason}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 disabled:opacity-50 transition-colors shrink-0"
          >
            <Sparkles size={14} /> AI 다듬기
          </button>

          <button
            onClick={() => onFilesOpenChange(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors shrink-0"
          >
            <Files size={14} /> 파일 관리
          </button>
          <ProductDetailButton orderId={orderId} title={title} snapshot={snapshot} publishProductId={linkedProductId} />
        </div>

        {snapshot === null ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : (
          <ProductSectionPanel
            orderId={orderId}
            sections={snapshot.sections}
            onChange={(sections: ProductSection[]) => applyChange({ sections })}
            locked={isPaid}
          />
        )}
      </div>

      {/* 파일 관리 — 폴더 팝업과 같은 전체화면 오버레이, 한 겹 위(z-120) */}
      {filesOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-800">파일 관리</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{title || '제목 없음'}</p>
              </div>
              <button
                onClick={() => onFilesOpenChange(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ContentFileViewer
                orderId={orderId}
                title={title}
                isPaid={isPaid}
                onBack={() => onFilesOpenChange(false)}
                onOpenFullEditor={() => { /* product는 전체 편집기 미지원(v1) — hideHeader라 노출 안 됨 */ }}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
