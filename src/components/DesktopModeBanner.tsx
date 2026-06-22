'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'desktop-mode-dismissed';

function isMobileUA(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function DesktopModeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (!isMobileUA()) return;
    if (window.innerWidth >= 768) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function resetViewport() {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta) {
      meta.content = 'width=device-width, initial-scale=1';
    } else {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(m);
    }
    sessionStorage.setItem(STORAGE_KEY, '1');
    window.location.reload();
  }

  if (!visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-3">
      <p className="flex-1 text-xs text-blue-900 leading-snug">
        <span className="font-semibold">화면이 이상하게 보이나요?</span>
        {' '}데스크탑 모드로 설정되어 있을 수 있습니다.
      </p>
      <button
        onClick={resetViewport}
        className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        <Smartphone size={12} />
        모바일 화면으로 보기
      </button>
      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
        aria-label="닫기"
      >
        <X size={14} className="text-blue-700" />
      </button>
    </div>
  );
}
