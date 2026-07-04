'use client';

// 이북 생성 버튼 + 미리보기 — EducationCardButton과 같은 위상(생성 트리거·URL 수명 관리).
// 열면 ebookPages 모델로 화면 플립북을 그리고, 같은 모델로 인쇄용 PDF(buildEbookPdf)를
// 만들어 헤더 다운로드에 건다 — 화면과 인쇄물이 단일 소스로 항상 일치. 언어 탭을 바꾸면
// 플립북·PDF를 그 언어로 다시 만든다. 생성은 전부 브라우저(서버 왕복 0).

import { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';
import { EbookFlipbook } from '@/components/education/EbookFlipbook';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { resolveLedgerRefBlob } from '@/lib/super-editor/media/resolveImageBytes';
import { buildEbookPages, type EbookPage } from '@/lib/super-editor/education/ebookPages';
import { buildEbookPdf } from '@/lib/super-editor/education/buildEbookPdf';
import type { EducationSnapshot } from '@/lib/super-editor/education/types';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { SUPPORTED_LOCALES, LOCALE_NATIVE_LABELS, type Locale } from '@/lib/i18n/types';

interface Props {
  orderId:  string;
  snapshot: EducationSnapshot | null;
}

interface PreviewState {
  locale:  Locale;
  pages:   EbookPage[];
  urls:    Record<string, string>; // illustrationRef → blob URL
  pdfUrl:  string;
  pdfName: string;
  notices: OutputNotice[];
}

export function EducationEbookButton({ orderId, snapshot }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const unitCount = snapshot?.units.length ?? 0;

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.pdfUrl);
        Object.values(preview.urls).forEach((u) => URL.revokeObjectURL(u));
      }
    };
  }, [preview]);

  async function build(locale: Locale) {
    if (!snapshot || unitCount === 0 || busy) return;
    setBusy(true);
    try {
      // 원장 하이드레이션 보장(멱등) — 파일 화면을 안 거쳤어도 삽화를 찾을 수 있게
      const ledger = useFileLedgerStore.getState();
      await Promise.all([
        ledger.hydrateFromLocalIndex(orderId),
        ledger.refreshFromServer(orderId),
      ]);
      const entries = useFileLedgerStore.getState().entries;

      const { pages } = buildEbookPages(snapshot, locale);
      const urls: Record<string, string> = {};
      for (const page of pages) {
        if (page.kind !== 'unit' || !page.illustrationRef || urls[page.illustrationRef]) continue;
        const blob = await resolveLedgerRefBlob(page.illustrationRef, entries);
        if (blob) urls[page.illustrationRef] = URL.createObjectURL(blob);
      }
      // PDF의 notices가 페이지 모델 notices를 포함한다(빈 글자 제외 + 삽화 해석 실패)
      const pdf = await buildEbookPdf(snapshot, entries, locale);

      setPreview({
        locale, pages, urls,
        pdfUrl: URL.createObjectURL(new Blob([pdf.bytes as BlobPart], { type: 'application/pdf' })),
        pdfName: `${snapshot.title || '이북'}-${locale}.pdf`,
        notices: pdf.notices,
      });
    } catch (e) {
      console.error('[EducationEbookButton] 이북 생성 실패:', e);
      alert(`이북 생성에 실패했습니다(${e instanceof Error ? e.message : '알 수 없는 오류'}).`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => build('ko')}
        disabled={unitCount === 0 || busy || !snapshot}
        title={unitCount === 0 ? '유닛을 추가해야 이북을 만들 수 있습니다' : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors shrink-0"
      >
        {busy && !preview ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
        {busy && !preview ? '생성 중…' : '이북 보기'}
      </button>

      {preview && (
        <OutputPreviewOverlay
          title="이북 미리보기"
          subtitle={`${snapshot?.title ?? ''} · 다운로드 버튼이 인쇄용 PDF(${preview.locale})를 받습니다`}
          downloadUrl={preview.pdfUrl}
          downloadName={preview.pdfName}
          notices={preview.notices}
          onClose={() => setPreview(null)}
          headerExtra={
            <div className="flex items-center gap-1">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => { if (l !== preview.locale) void build(l); }}
                  disabled={busy}
                  className={clsx(
                    'px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors',
                    l === preview.locale ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600',
                  )}
                >
                  {LOCALE_NATIVE_LABELS[l]}
                </button>
              ))}
              {busy && <Loader2 size={13} className="animate-spin text-stone-400 ml-1" />}
            </div>
          }
        >
          <EbookFlipbook pages={preview.pages} locale={preview.locale} illustrationUrls={preview.urls} />
        </OutputPreviewOverlay>
      )}
    </>
  );
}
