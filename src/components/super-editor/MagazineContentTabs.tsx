'use client';

// 잡지 콘텐츠 하나를 열었을 때의 메인 화면 — 기본은 광고·원고 목록(PlacementsPanel).
// 파일(원고·광고 원본 등)을 다루는 동작은 인라인/좁은 패널로 절대 안 넣고, 잡지 폴더
// 탐색기 팝업(c71574a)과 똑같은 모양의 별도 전체화면 오버레이로 그때그때 띄운다 —
// z-[110]인 바깥 폴더 팝업 위에 z-[120]으로 쌓이는 두 번째 전체화면 팝업.
//
// ContentFileViewer는 그대로 재사용(내부 헤더만 hideHeader로 숨김 — 이 오버레이가
// 자기 헤더를 이미 그리고 있어서), PlacementsPanel도 완전히 독립된 패널이라
// 이 파일을 통째로 지워도 두 컴포넌트의 단독 사용에는 영향 없다.

import { useState } from 'react';
import { ArrowLeft, ExternalLink, Files, X } from 'lucide-react';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { PlacementsPanel } from '@/components/super-editor/PlacementsPanel';

interface Props {
  orderId: string;
  title:   string;
  isPaid:  boolean;
  onBack:           () => void;
  onOpenFullEditor: () => void;
}

export function MagazineContentTabs({ orderId, title, isPaid, onBack, onOpenFullEditor }: Props) {
  const [fileManagerOpen, setFileManagerOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 폴더로
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">{title || '제목 없음'}</p>
          <button
            onClick={() => setFileManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <Files size={14} /> 파일 관리
          </button>
          <button
            onClick={onOpenFullEditor}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
          >
            <ExternalLink size={14} /> 전체 편집기에서 열기
          </button>
        </div>

        <PlacementsPanel orderId={orderId} locked={isPaid} />
      </div>

      {/* 파일 관리 — 잡지 폴더 팝업과 같은 전체화면 오버레이 모양, 그 위에 한 겹 더 쌓임 */}
      {fileManagerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-800">파일 관리</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{title || '제목 없음'}</p>
              </div>
              <button
                onClick={() => setFileManagerOpen(false)}
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
                onBack={() => setFileManagerOpen(false)}
                onOpenFullEditor={onOpenFullEditor}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
