'use client';

// 산출물 미리보기 오버레이 — 공통 골격(표시 전용, 단일 책임).
// "z-[130] 전체화면 + 헤더(제목/부제·다운로드·닫기) + notices 경고 배너 + 콘텐츠 슬롯"을
// 한 곳에서 정의한다. 조판 PDF(iframe)·영상(video)·향후 3D플립북 등 어떤 산출물이든
// children으로 콘텐츠만 꽂으면 같은 골격을 쓴다. 생성/URL 수명 관리는 호출부 책임.

import type { ReactNode } from 'react';
import { Download, TriangleAlert, X } from 'lucide-react';

export interface OutputPreviewNotice {
  label:  string;
  reason: string;
}

interface Props {
  /** 헤더 제목 (예: "조판 PDF 미리보기") */
  title: string;
  /** 헤더 부제 (예: 콘텐츠 제목 · 길이) */
  subtitle?: string;
  downloadUrl:  string;
  downloadName: string;
  notices: OutputPreviewNotice[];
  onClose: () => void;
  /** 팝업 폭 — 산출물 비율에 따라 조절 (기본 max-w-5xl) */
  maxWidthClass?: string;
  /** 산출물 표시 영역 — flex-1 min-h-0 컨테이너 안에 그대로 렌더됨 */
  children: ReactNode;
}

export function OutputPreviewOverlay({
  title, subtitle, downloadUrl, downloadName, notices, onClose,
  maxWidthClass = 'max-w-5xl', children,
}: Props) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} h-full max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-stone-800">{title}</h2>
            {subtitle && <p className="text-sm text-stone-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadUrl}
              download={downloadName}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              <Download size={14} /> 다운로드
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {notices.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 shrink-0 flex flex-col gap-1 max-h-32 overflow-y-auto">
            {notices.map((n, i) => (
              <p key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                <TriangleAlert size={12} className="shrink-0 mt-0.5" />
                <span><span className="font-semibold">{n.label}</span> — {n.reason}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
