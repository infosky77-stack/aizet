'use client';

// "상세페이지 생성" 버튼 + 미리보기 오버레이 — 섹션 스냅샷을 브라우저에서 직접 산출물로
// 만든다(서버 왕복 0, MagazinePdfButton과 같은 로컬 경로·같은 오버레이 골격).
// 산출물 두 가지를 탭으로 미리본다:
//   통이미지 JPEG(buildProductDetailImage) — 쿠팡/네이버 등 외부 업로드용(다운로드)
//   칸칸 HTML(ProductDetailSections)      — AIZET 쇼핑몰 표시용(게시 대상, 확대해도 선명)
// "상품에 게시"는 JPEG + 섹션 스냅샷 JSON + 섹션 이미지 blob을 함께 보낸다 —
// 서버는 저장만 하고(공개 사본), 원장 해석은 전부 여기(브라우저)서 끝낸다.

import { useEffect, useState } from 'react';
import { ImageDown, Loader2, Store } from 'lucide-react';
import type { ProductDetailSnapshot } from '@/lib/super-editor/product/types';
import { buildProductDetailImage } from '@/lib/super-editor/product/buildProductDetailImage';
import { toPublishedDetail, type PublishedProductDetail } from '@/lib/super-editor/product/published';
import { resolveLedgerRefBlob } from '@/lib/super-editor/media/resolveImageBytes';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';
import { ProductDetailSections } from '@/components/product-detail/ProductDetailSections';

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
  /** 칸칸 HTML 미리보기용 — 이미지 src는 세션 한정 blob URL */
  htmlDetail: PublishedProductDetail;
  /** 게시 페이로드용 섹션 이미지 원본 + 정리용 blob URL 목록 */
  imageBlobs:  Record<string, Blob>;
  sectionUrls: string[];
}

type PublishState = 'idle' | 'publishing' | 'done' | 'error';
type PreviewTab   = 'jpeg' | 'html';

export function ProductDetailButton({ orderId, title, snapshot, publishProductId }: Props) {
  const [busy, setBusy]       = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [publish, setPublish] = useState<PublishState>('idle');
  const [tab, setTab]         = useState<PreviewTab>('jpeg');

  // 닫을 때(및 언마운트 시) blob URL 정리 — JPEG + 섹션 이미지 전부
  useEffect(() => {
    return () => {
      if (!preview) return;
      URL.revokeObjectURL(preview.url);
      for (const u of preview.sectionUrls) URL.revokeObjectURL(u);
    };
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

      // 칸칸 HTML 미리보기 재료 — 이미지 섹션의 원장 blob을 한 번만 해석해
      // 미리보기(src)와 게시 페이로드(imageBlobs)가 같은 원본을 쓴다
      const srcBySection: Record<string, string> = {};
      const imageBlobs:   Record<string, Blob> = {};
      const sectionUrls:  string[] = [];
      for (const section of snapshot.sections) {
        if (section.kind !== 'image') continue;
        const imageBlob = await resolveLedgerRefBlob(section.ledgerRef, entries);
        if (!imageBlob) continue; // 해석 실패는 JPEG 빌더 notices가 이미 보고
        const url = URL.createObjectURL(imageBlob);
        srcBySection[section.id] = url;
        imageBlobs[section.id]   = imageBlob;
        sectionUrls.push(url);
      }
      const { detail: htmlDetail } = toPublishedDetail(snapshot, srcBySection);

      setPublish('idle');
      setTab('jpeg');
      setPreview({
        url: URL.createObjectURL(blob), blob, notices: result.notices,
        widthPx: result.widthPx, heightPx: result.heightPx,
        htmlDetail, imageBlobs, sectionUrls,
      });
    } catch (e) {
      console.error('[ProductDetailButton] 상세페이지 생성 실패:', e);
      alert('상세페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  // "상품에 게시" — 게시 라우트가 공개 사본 저장·썸네일 복사·상품 연결까지 처리한다.
  // JPEG(외부용) + 스냅샷 JSON·섹션 이미지(칸칸 HTML용)를 한 번에 보낸다.
  async function handlePublish() {
    if (!preview || !snapshot || !publishProductId || publish === 'publishing') return;
    setPublish('publishing');
    try {
      const form = new FormData();
      form.append('detail', preview.blob, 'detail.jpg');
      form.append('snapshot', JSON.stringify(snapshot));
      for (const [sectionId, blob] of Object.entries(preview.imageBlobs)) {
        form.append(`image-${sectionId}`, blob, sectionId);
      }
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

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
    }`;

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
          {/* 산출물 탭 — 통이미지(외부 업로드용 다운로드) / 칸칸 HTML(쇼핑몰 게시본 그대로) */}
          <div className="flex items-center gap-1 px-6 py-2 border-b border-stone-100 bg-stone-50 shrink-0">
            <button onClick={() => setTab('jpeg')} className={tabClass(tab === 'jpeg')}>
              통이미지 JPEG
            </button>
            <button onClick={() => setTab('html')} className={tabClass(tab === 'html')}>
              칸칸 HTML
            </button>
            <span className="ml-auto text-[11px] text-stone-400">
              {tab === 'jpeg' ? '쿠팡/네이버 업로드용' : '쇼핑몰에 게시되는 모습'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-stone-100 flex justify-center">
            {tab === 'jpeg' ? (
              /* 세로로 긴 blob 이미지 — next/image 최적화 대상 아님 */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={preview.url} alt="상세페이지 미리보기" className="w-full max-w-[560px] h-auto self-start shadow-lg" />
            ) : (
              <div className="w-full max-w-[560px] self-start shadow-lg">
                <ProductDetailSections detail={preview.htmlDetail} />
              </div>
            )}
          </div>
        </OutputPreviewOverlay>
      )}
    </>
  );
}
