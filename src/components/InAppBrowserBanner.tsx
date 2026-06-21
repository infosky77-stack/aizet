'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface DetectResult {
  isInApp: boolean;
  os: 'ios' | 'android' | 'unknown';
  appName: string;
}

function detectInAppBrowser(): DetectResult {
  const ua = navigator.userAgent;

  const known = [
    { pattern: /NAVER|NaverSearch/i, name: '네이버' },
    { pattern: /KAKAOTALK/i, name: '카카오톡' },
    { pattern: /Instagram/i, name: '인스타그램' },
    { pattern: /FBAN|FBAV/i, name: '페이스북' },
    { pattern: /Line\//i, name: '라인' },
    { pattern: /Twitter/i, name: '트위터' },
  ];

  const os: DetectResult['os'] = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
    ? 'android'
    : 'unknown';

  for (const { pattern, name } of known) {
    if (pattern.test(ua)) return { isInApp: true, os, appName: name };
  }

  // Android 일반 WebView: "wv)" 포함 또는 Version/ 있고 Chrome 없음
  if (os === 'android' && (/wv\)/.test(ua) || (/Version\//.test(ua) && !/Chrome/.test(ua)))) {
    return { isInApp: true, os, appName: '앱' };
  }

  // iOS 일반 WebView: iOS 기기인데 Safari/ 없음
  if (os === 'ios' && !/Safari\//.test(ua)) {
    return { isInApp: true, os, appName: '앱' };
  }

  return { isInApp: false, os, appName: '' };
}

const STORAGE_KEY = 'inapp-banner-dismissed';

export function InAppBrowserBanner() {
  const [info, setInfo] = useState<DetectResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }
    setInfo(detectInAppBrowser());
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  function openChrome() {
    const url = window.location.href;
    window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  async function copyURL() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (dismissed || !info?.isInApp) return null;

  const browserLabel = info.os === 'ios' ? 'Safari' : 'Chrome';

  return (
    <>
      <div className="fixed top-16 inset-x-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
        <p className="flex-1 text-xs text-amber-900 leading-snug">
          <span className="font-semibold">{info.appName} 인앱 브라우저</span>로 접속 중입니다.
          {' '}더 나은 경험을 위해 {browserLabel}에서 이용해 주세요.
        </p>

        {info.os === 'android' ? (
          <button
            onClick={openChrome}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} />
            Chrome으로 열기
          </button>
        ) : (
          <button
            onClick={() => setShowIOSModal(true)}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} />
            Safari로 열기
          </button>
        )}

        <button
          onClick={dismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-200 transition-colors"
          aria-label="닫기"
        >
          <X size={14} className="text-amber-700" />
        </button>
      </div>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-stone-900">Safari로 열기</p>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={16} className="text-stone-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">1</div>
                <p className="text-sm text-stone-700 pt-0.5">
                  앱 하단 또는 상단의{' '}
                  <span className="font-semibold text-stone-900">메뉴(···) 버튼</span>을 탭하세요.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">2</div>
                <p className="text-sm text-stone-700 pt-0.5">
                  <span className="font-semibold text-stone-900">'브라우저로 열기'</span> 또는{' '}
                  <span className="font-semibold text-stone-900">'Safari로 열기'</span>를 선택하세요.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">또는</div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-stone-700 mb-2">아래 주소를 복사해 Safari에 붙여넣으세요.</p>
                  <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-2">
                    <span className="flex-1 text-xs text-stone-500 truncate">{typeof window !== 'undefined' ? window.location.href : ''}</span>
                    <button
                      onClick={copyURL}
                      className="shrink-0 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
