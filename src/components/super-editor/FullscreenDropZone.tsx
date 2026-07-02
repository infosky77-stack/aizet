'use client';

// 전체화면 드래그앤드롭 — 슈퍼에디터 화면 어디든 파일을 던지면 받는다.
// window 레벨에서 dragenter/dragleave 를 카운팅하는 표준 기법을 쓴다(자식 요소들 사이를 넘나들 때마다
// 발생하는 dragenter/dragleave 쌍 때문에 단순 boolean 토글로는 오버레이가 깜빡이므로).
// 파일이 아닌 걸 끄는 경우(텍스트 드래그 등)는 dataTransfer.types 로 걸러서 무시.

import { useEffect, useState, type ReactNode } from 'react';
import { UploadCloud } from 'lucide-react';
import { ingestFromDrop } from '@/lib/super-editor/ledger/ingest/fromDrop';

interface Props {
  children: ReactNode;
  active?:  boolean; // false면 리스너 자체를 붙이지 않음(예: 결제 완료로 잠긴 화면)
  onDropped?: () => void; // 드롭 성공 후 콜백(예: 파일 관리자 탭으로 전환)
}

function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

export function FullscreenDropZone({ children, active = true, onDropped }: Props) {
  const [dragCount, setDragCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragCount((c) => c + 1);
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragCount((c) => Math.max(0, c - 1));
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragCount(0);
      try {
        ingestFromDrop(e.dataTransfer);
        onDropped?.();
      } catch (err) {
        // 드롭 처리 실패해도 화면 자체는 계속 정상 동작해야 함
        // eslint-disable-next-line no-console
        console.error('[super-editor] 전체화면 드롭 처리 실패:', err);
      }
    }

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [active, onDropped]);

  return (
    <div className="relative h-full">
      {children}
      {dragCount > 0 && (
        <div className="fixed inset-0 z-[100] bg-violet-900/30 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 px-10 py-8 rounded-3xl bg-white/95 shadow-2xl border-2 border-dashed border-violet-400">
            <UploadCloud size={40} className="text-violet-500" />
            <p className="text-base font-bold text-stone-700">여기에 파일을 놓으세요</p>
            <p className="text-xs text-stone-400">이미지 · 영상 · 오디오</p>
          </div>
        </div>
      )}
    </div>
  );
}
