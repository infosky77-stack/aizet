'use client';

// "조판 PDF" 버튼 + 미리보기 오버레이 — 확정(confirmed)된 게재 항목들을 buildMagazinePdf로
// 브라우저에서 조판해 iframe으로 미리보기하고 다운로드한다(서버 왕복 0, 도록과 같은 로컬 경로).
// 오버레이는 잡지 폴더 팝업(z-110)·파일 관리(z-120) 위에 z-[130]으로 쌓이는 세 번째 층 —
// 기존 팝업 스택 패턴 그대로. 조판에서 빠졌거나 대체된 항목(notices)은 상단 배너로 보여준다.

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, TriangleAlert, X } from 'lucide-react';
import type { Placement } from '@/lib/super-editor/placements/types';
import { buildMagazinePdf, type MagazinePdfNotice } from '@/lib/super-editor/pdf/buildMagazinePdf';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';

interface Props {
  orderId: string;
  title:   string;
  placements: Placement[];
}

interface PreviewState {
  url:     string;
  notices: MagazinePdfNotice[];
}

export function MagazinePdfButton({ orderId, title, placements }: Props) {
  const [busy, setBusy]       = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const confirmed = placements.filter((p) => p.status === 'confirmed');

  // 닫을 때(및 언마운트 시) blob URL 정리
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  async function handleGenerate() {
    if (confirmed.length === 0 || busy) return;
    setBusy(true);
    try {
      // 원장 하이드레이션 보장 — 광고·원고 탭에서 바로 눌러도(파일 화면을 안 거쳤어도)
      // ledger_ref가 가리키는 이미지를 찾을 수 있게. 둘 다 멱등이라 중복 호출 안전.
      const ledger = useFileLedgerStore.getState();
      await Promise.all([
        ledger.hydrateFromLocalIndex(orderId),
        ledger.refreshFromServer(orderId),
      ]);
      const entries = useFileLedgerStore.getState().entries;

      const result = await buildMagazinePdf(
        {
          title,
          placements: confirmed.map((p) => ({
            id: p.id, kind: p.kind, party_name: p.party_name, size_spec: p.size_spec,
            page_no: p.page_no, slot: p.slot, sort_order: p.sort_order,
            created_at: p.created_at, ledger_ref: p.ledger_ref,
          })),
        },
        entries,
      );
      const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
      setPreview({ url: URL.createObjectURL(blob), notices: result.notices });
    } catch (e) {
      console.error('[MagazinePdfButton] 조판 실패:', e);
      alert('조판 PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setPreview(null); // revoke는 위 effect cleanup이 담당
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={confirmed.length === 0 || busy}
        title={confirmed.length === 0 ? '확정(게재 상태) 항목이 있어야 조판할 수 있습니다' : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 disabled:opacity-50 disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-colors"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        조판 PDF{confirmed.length > 0 && ` (확정 ${confirmed.length}건)`}
      </button>

      {preview && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-stone-800">조판 PDF 미리보기</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{title || '제목 없음'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={preview.url}
                  download={`${title || '잡지'}-조판.pdf`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  <Download size={14} /> 다운로드
                </a>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {preview.notices.length > 0 && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 shrink-0 flex flex-col gap-1 max-h-32 overflow-y-auto">
                {preview.notices.map((n, i) => (
                  <p key={`${n.placementId}-${i}`} className="flex items-start gap-1.5 text-xs text-amber-800">
                    <TriangleAlert size={12} className="shrink-0 mt-0.5" />
                    <span><span className="font-semibold">{n.label}</span> — {n.reason}</span>
                  </p>
                ))}
              </div>
            )}

            <iframe src={preview.url} title="조판 PDF 미리보기" className="flex-1 w-full border-0 bg-stone-100" />
          </div>
        </div>
      )}
    </>
  );
}
