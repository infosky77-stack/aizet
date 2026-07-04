'use client';

// "상세페이지 생성" 버튼 + 미리보기 오버레이 — 섹션 스냅샷을 buildProductDetailImage로
// 브라우저에서 긴 세로 JPEG로 합성해 미리보기하고 다운로드한다(서버 왕복 0,
// MagazinePdfButton과 같은 로컬 경로·같은 오버레이 골격). 세로로 긴 산출물이라
// 콘텐츠 슬롯은 스크롤 컨테이너, 팝업 폭은 산출물 비율에 맞춰 좁게(max-w-3xl) 쓴다.

import { useEffect, useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import type { ProductDetailSnapshot } from '@/lib/super-editor/product/types';
import { buildProductDetailImage } from '@/lib/super-editor/product/buildProductDetailImage';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';

interface Props {
  orderId:  string;
  title:    string;
  snapshot: ProductDetailSnapshot | null;
}

interface PreviewState {
  url:      string;
  notices:  OutputNotice[];
  widthPx:  number;
  heightPx: number;
}

export function ProductDetailButton({ orderId, title, snapshot }: Props) {
  const [busy, setBusy]       = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

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
      setPreview({
        url: URL.createObjectURL(blob), notices: result.notices,
        widthPx: result.widthPx, heightPx: result.heightPx,
      });
    } catch (e) {
      console.error('[ProductDetailButton] 상세페이지 생성 실패:', e);
      alert('상세페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
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
