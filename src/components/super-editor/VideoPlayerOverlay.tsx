'use client';

// 영상 재생 오버레이 — src/제목만 받는 표시 전용 독립 모듈. 파일 관리자, (향후) 장면 편집기 등
// 어디서든 재사용한다. 파일 상태·원장 개념을 전혀 모르며, URL 해석은 호출부 책임.
// z-[140]: 폴더 팝업(110) → 파일 관리(120) → PDF 미리보기(130) 위에 안전하게 쌓이는 최상층.

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src:   string;
  title: string;
  onClose: () => void;
}

export function VideoPlayerOverlay({ src, title, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold text-white/90 text-sm truncate">{title || '영상'}</p>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 pt-0 min-h-0">
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-full rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
