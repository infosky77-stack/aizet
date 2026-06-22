'use client';

import { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Props {
  mobile?: boolean;
}

export function AddToHomeButton({ mobile = false }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isIOSSafari =
      /iPhone|iPad|iPod/.test(ua) &&
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|OPiOS/.test(ua);

    if (isIOSSafari) {
      setIsIOS(true);
      setShowButton(true);
      return;
    }

    // 인라인 스크립트가 React보다 먼저 캡처해 둔 이벤트가 있으면 즉시 사용
    const w = window as Window & { __pwaPrompt?: BeforeInstallPromptEvent };
    if (w.__pwaPrompt) {
      setDeferredPrompt(w.__pwaPrompt);
      setShowButton(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShowButton(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleClick() {
    if (isIOS) {
      setShowModal(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowButton(false);
    setDeferredPrompt(null);
  }

  if (!showButton) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={
          mobile
            ? 'flex items-center gap-2 text-sm font-medium text-stone-600 py-2'
            : 'flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-lg transition-colors'
        }
      >
        <Smartphone size={mobile ? 14 : 13} />
        앱 설치
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-stone-900">홈 화면에 추가하기</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={16} className="text-stone-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="text-sm text-stone-700">
                    Safari 하단 메뉴바의{' '}
                    <span className="inline-flex items-center gap-0.5 font-semibold text-stone-900">
                      {/* iOS share icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      공유
                    </span>{' '}
                    버튼을 탭하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  2
                </div>
                <p className="text-sm text-stone-700">
                  메뉴에서{' '}
                  <span className="font-semibold text-stone-900">"홈 화면에 추가"</span>
                  를 선택하세요.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  3
                </div>
                <p className="text-sm text-stone-700">
                  오른쪽 상단{' '}
                  <span className="font-semibold text-stone-900">"추가"</span>
                  를 탭하면 완료!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
