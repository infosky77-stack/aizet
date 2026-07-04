'use client';

// "상세페이지 생성" 버튼 + 미리보기 오버레이 — 섹션 스냅샷을 buildProductDetailImage로
// 브라우저에서 긴 세로 JPEG로 합성해 미리보기하고 다운로드한다(서버 왕복 0,
// MagazinePdfButton과 같은 로컬 경로·같은 오버레이 골격). 세로로 긴 산출물이라
// 콘텐츠 슬롯은 스크롤 컨테이너, 팝업 폭은 산출물 비율에 맞춰 좁게(max-w-3xl) 쓴다.

import { useEffect, useState } from 'react';
import { ImageDown, Loader2, Store } from 'lucide-react';
import type { ProductDetailSnapshot } from '@/lib/super-editor/product/types';
import { buildProductDetailImage } from '@/lib/super-editor/product/buildProductDetailImage';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';

interface Props {
  orderId:  string;
  title:    string;
  snapshot: ProductDetailSnapshot | null;
  /** 이 콘텐츠에 연결된 쇼핑몰 상품 id — 있으면 미리보기 헤더에 "상품에 게시" 액션 노출 */
  publishProductId?: string | null;
}

interface PreviewState {
  url:      string;
  blob:     Blob;
  notices:  OutputNotice[];
  widthPx:  number;
  heightPx: number;
}

type PublishState = 'idle' | 'publishing' | 'done' | 'error';

export function ProductDetailButton({ orderId, title, snapshot, publishProductId }: Props) {
  const [busy, setBusy]       = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [publish, setPublish] = useState<PublishState>('idle');

  // 닫을 때(및 언마운트 시) blob URL 정리
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  async function handleGenerate() {
    if (!snapshot || busy) return;
    setBusy(true);
    try {
      // 원장 하이드레이션 보장 — 파일 화면을 안 거쳐도 ledgerRef 이미지를 찾을 수 있게(멱등)
      const ledger = useFileLedgerStore.getState();
      await Promise.all([
        ledger.hydrateFromLocalIndex(orderId),
        ledger.refreshFromServer(orderId),
      ]);
      const entries = useFileLedgerStore.getState().entries;

      const result = await buildProductDetailImage(snapshot, entries);
      const blob = new Blob([result.bytes as BlobPart], { type: 'image/jpeg' });
      setPublish('idle');
      setPreview({
        url: URL.createObjectURL(blob), blob, notices: result.notices,
        widthPx: result.widthPx, heightPx: result.heightPx,
      });
    } catch (e) {
      console.error('[ProductDetailButton] 상세페이지 생성 실패:', e);
      alert('상세페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  // "상품에 게시" — 게시 라우트가 공개 사본 저장·썸네일 복사·상품 연결까지 처리한다
  async function handlePublish() {
    if (!preview || !publishProductId || publish === 'publishing') return;
    setPublish('publishing');
    try {
      const form = new FormData();
      form.append('detail', preview.blob, 'detail.jpg');
      const res = await fetch(`/api/admin/shop/products/${publishProductId}/publish`, {
        method: 'POST', body: form,
      });
      if (!res.ok) throw new Error(`publish ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        alert(`게시 완료. 참고:\n- ${data.warnings.join('\n- ')}`);
      }
      setPublish('done');
    } catch (e) {
      console.error('[ProductDetailButton] 게시 실패:', e);
      setPublish('error');
    }
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={!snapshot || busy}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 disabled:opacity-50 disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-colors"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
        상세페이지 생성
      </button>

      {preview && (
        <OutputPreviewOverlay
          title="상세페이지 미리보기"
          subtitle={`${title || '제목 없음'} · ${preview.widthPx}×${preview.heightPx.toLocaleString()}px`}
          downloadUrl={preview.url}
          downloadName={`${title || '제품'}-상세페이지.jpg`}
          notices={preview.notices}
          onClose={() => setPreview(null)}
          maxWidthClass="max-w-3xl"
          headerExtra={publishProductId ? (
            <button
              onClick={handlePublish}
              disabled={publish === 'publishing' || publish === 'done'}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-colors"
            >
              {publish === 'publishing' ? <Loader2 size={14} className="animate-spin" /> : <Store size={14} />}
              {publish === 'done' ? '게시됨' : publish === 'error' ? '게시 실패 — 다시 시도' : '상품에 게시'}
            </button>
          ) : undefined}
        >
          <div className="flex-1 overflow-y-auto bg-stone-100 flex justify-center">
            {/* 세로로 긴 blob 이미지 — next/image 최적화 대상 아님 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt="상세페이지 미리보기" className="w-full max-w-[560px] h-auto self-start shadow-lg" />
          </div>
        </OutputPreviewOverlay>
      )}
    </>
  );
}
