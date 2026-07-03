'use client';

// 잡지 폴더 팝업 안에서 콘텐츠(주문) 하나의 파일을 관리하는 뷰 — 원장(useFileLedgerStore)
// 스코프를 이 orderId로 전환한 뒤 기존 FileManagerPanel을 그대로 재사용한다.
// [orderId]/page.tsx의 마운트 시 하이드레이션 패턴(setCurrentOrder → hydrateFromLocalIndex
// + refreshFromServer 병행)을 그대로 따른다.

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { FileManagerPanel } from '@/components/super-editor/FileManagerPanel';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';

interface Props {
  orderId:  string;
  title:    string;
  isPaid:   boolean;
  onBack:          () => void;
  onOpenFullEditor: () => void;
  /** 바깥(MagazineContentTabs 등)에서 자기 헤더를 이미 그리고 있을 때 중복 표시 방지용 */
  hideHeader?: boolean;
}

export function ContentFileViewer({ orderId, title, isPaid, onBack, onOpenFullEditor, hideHeader }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const ledger = useFileLedgerStore.getState();
    ledger.setCurrentOrder(orderId);
    Promise.all([
      ledger.hydrateFromLocalIndex(orderId),
      ledger.refreshFromServer(),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="flex flex-col gap-4">
      {!hideHeader && (
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 폴더로
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">{title || '제목 없음'}</p>
          <button
            onClick={onOpenFullEditor}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
          >
            <ExternalLink size={14} /> 전체 편집기에서 열기
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-stone-300" />
        </div>
      ) : (
        <FileManagerPanel
          accent="amber"
          accept="image/*,video/*,audio/*"
          locked={isPaid}
          emptyTitle="파일이 없습니다"
          emptyHint="클릭하거나 파일을 끌어다 놓으세요"
        />
      )}
    </div>
  );
}
