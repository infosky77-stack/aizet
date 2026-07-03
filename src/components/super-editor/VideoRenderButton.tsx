'use client';

// "영상 만들기" 버튼 + 미리보기 오버레이 — 장면 목록을 buildVideoMp4로 브라우저에서 렌더해
// 재생/다운로드한다(조판 PDF 버튼과 같은 계약: 생성 → z-130 오버레이 → notices 배너).
// WebCodecs 미지원/생성 실패 시 서버 fallback(기존 render_jobs 큐)으로 넘긴다 — 도록과
// 동일한 "브라우저 우선 + 서버 안전망" 이중 구조. fallback은 이미지/텍스트 장면만 지원
// (스냅샷의 legacy 파생 필드를 render-video.py가 읽음), 클립 장면은 브라우저 전용.

import { useEffect, useState } from 'react';
import { Clapperboard, Loader2 } from 'lucide-react';
import type { VideoProjectSnapshot } from '@/lib/super-editor/video/types';
import {
  buildVideoMp4, isBrowserVideoRenderSupported,
} from '@/lib/super-editor/video/buildVideoMp4';
import type { OutputNotice } from '@/lib/super-editor/output/types';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { OutputPreviewOverlay } from '@/components/super-editor/OutputPreviewOverlay';

interface Props {
  orderId: string;
  title:   string;
  project: VideoProjectSnapshot | null;
}

interface PreviewState {
  url:     string;
  notices: OutputNotice[];
  durationSec: number;
}

export function VideoRenderButton({ orderId, title, project }: Props) {
  const [progress, setProgress] = useState<number | null>(null); // null = 대기
  const [preview, setPreview]   = useState<PreviewState | null>(null);
  const [fallbackNote, setFallbackNote] = useState('');

  const sceneCount = project?.scenes.length ?? 0;
  const busy = progress !== null;

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  async function requestServerFallback() {
    const res = await fetch('/api/admin/super-editor/video-server-fallback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId }),
    }).catch(() => null);
    if (res?.ok) {
      setFallbackNote('서버 대기열에 추가했습니다 — 완료되면 "전체 편집기에서 열기"의 미리보기 탭에서 확인하세요. (서버 생성은 이미지·텍스트 장면만 지원)');
    } else {
      setFallbackNote('서버 생성 요청도 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  async function handleGenerate() {
    if (!project || sceneCount === 0 || busy) return;
    setFallbackNote('');

    if (!isBrowserVideoRenderSupported()) {
      if (confirm('이 브라우저는 로컬 영상 생성을 지원하지 않습니다(Chrome/Edge 권장).\n서버에서 생성할까요? (이미지·텍스트 장면만 포함됩니다)')) {
        await requestServerFallback();
      }
      return;
    }

    setProgress(0);
    try {
      // 원장 하이드레이션 보장(멱등) — 파일 화면을 안 거쳤어도 장면 소스를 찾을 수 있게
      const ledger = useFileLedgerStore.getState();
      await Promise.all([
        ledger.hydrateFromLocalIndex(orderId),
        ledger.refreshFromServer(orderId),
      ]);
      const entries = useFileLedgerStore.getState().entries;

      const result = await buildVideoMp4(project, entries, (ratio) => setProgress(ratio));
      const blob = new Blob([result.bytes as BlobPart], { type: 'video/mp4' });
      setPreview({ url: URL.createObjectURL(blob), notices: result.notices, durationSec: result.durationSec });
    } catch (e) {
      console.error('[VideoRenderButton] 브라우저 렌더 실패:', e);
      if (confirm(`영상 생성에 실패했습니다(${e instanceof Error ? e.message : '알 수 없는 오류'}).\n서버에서 대신 생성할까요? (이미지·텍스트 장면만 포함됩니다)`)) {
        await requestServerFallback();
      }
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={sceneCount === 0 || busy}
        title={sceneCount === 0 ? '장면을 추가해야 영상을 만들 수 있습니다' : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors shrink-0"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
        {busy ? `생성 중 ${Math.round((progress ?? 0) * 100)}%` : `영상 만들기${sceneCount > 0 ? ` (${sceneCount}장면)` : ''}`}
      </button>

      {fallbackNote && (
        <p className="w-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{fallbackNote}</p>
      )}

      {preview && (
        <OutputPreviewOverlay
          title="영상 미리보기"
          subtitle={`${title || '제목 없음'} · ${Math.round(preview.durationSec * 10) / 10}초`}
          downloadUrl={preview.url}
          downloadName={`${title || '영상'}.mp4`}
          notices={preview.notices}
          onClose={() => setPreview(null)}
          maxWidthClass="max-w-4xl"
        >
          <div className="flex-1 flex items-center justify-center bg-stone-900 p-4 min-h-0">
            <video src={preview.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-xl" />
          </div>
        </OutputPreviewOverlay>
      )}
    </>
  );
}
