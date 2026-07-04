'use client';

// 학습 카드 생성 버튼 + 미리보기 — VideoRenderButton과 같은 위상(생성 트리거·URL 수명 관리),
// 표시는 OutputPreviewOverlay 공용 골격에 카드 그리드를 꽂는다. 생성은 전부 브라우저
// (buildCardImage, 서버 왕복 0). 카드를 클릭해 고르면 헤더 다운로드가 그 카드를 받고,
// "6장 모두 저장"은 순차 다운로드를 건다(zip 의존성 없이 v1).

import { useEffect, useState } from 'react';
import { IdCard, Loader2, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { buildEducationCardImages } from '@/lib/super-editor/education/buildCardImage';
import type { EducationSnapshot } from '@/lib/super-editor/education/types';
import type { OutputNotice } from '@/lib/super-editor/output/types';

interface Props {
  orderId:  string;
  snapshot: EducationSnapshot | null;
}

interface PreviewCard { unitId: string; char: string; filename: string; url: string }
interface PreviewState { cards: PreviewCard[]; notices: OutputNotice[]; selected: number }

export function EducationCardButton({ orderId, snapshot }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const unitCount = snapshot?.units.length ?? 0;

  useEffect(() => {
    return () => { if (preview) preview.cards.forEach((c) => URL.revokeObjectURL(c.url)); };
  }, [preview]);

  async function handleGenerate() {
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

      const result = await buildEducationCardImages(snapshot, entries);
      setPreview({
        cards: result.cards.map((c) => ({
          unitId: c.unitId, char: c.char, filename: c.filename,
          url: URL.createObjectURL(new Blob([c.bytes as BlobPart], { type: 'image/png' })),
        })),
        notices: result.notices,
        selected: 0,
      });
    } catch (e) {
      console.error('[EducationCardButton] 카드 생성 실패:', e);
      alert(`카드 생성에 실패했습니다(${e instanceof Error ? e.message : '알 수 없는 오류'}).`);
    } finally {
      setBusy(false);
    }
  }

  function downloadAll() {
    if (!preview) return;
    preview.cards.forEach((card, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = card.url;
        a.download = card.filename;
        a.click();
      }, i * 300); // 브라우저 연속 다운로드 차단 회피 간격
    });
  }

  const selectedCard = preview?.cards[preview.selected] ?? null;

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={unitCount === 0 || busy || !snapshot}
        title={unitCount === 0 ? '유닛을 추가해야 카드를 만들 수 있습니다' : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors shrink-0"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <IdCard size={14} />}
        {busy ? '생성 중…' : `카드 만들기${unitCount > 0 ? ` (${unitCount}장)` : ''}`}
      </button>

      {preview && selectedCard && (
        <OutputPreviewOverlay
          title="학습 카드 미리보기"
          subtitle={`${snapshot?.title ?? ''} · ${preview.cards.length}장 — 클릭한 카드를 다운로드 버튼이 받습니다`}
          downloadUrl={selectedCard.url}
          downloadName={selectedCard.filename}
          notices={preview.notices}
          onClose={() => setPreview(null)}
          headerExtra={
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
            >
              <Download size={13} /> {preview.cards.length}장 모두 저장
            </button>
          }
        >
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {preview.cards.map((card, i) => (
                <button
                  key={card.unitId}
                  onClick={() => setPreview({ ...preview, selected: i })}
                  className={clsx(
                    'rounded-xl overflow-hidden border-2 transition-colors',
                    i === preview.selected ? 'border-amber-500' : 'border-stone-200 hover:border-stone-300',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob URL 미리보기 */}
                  <img src={card.url} alt={`학습 카드 ${card.char}`} className="w-full h-auto" />
                </button>
              ))}
            </div>
          </div>
        </OutputPreviewOverlay>
      )}
    </>
  );
}
