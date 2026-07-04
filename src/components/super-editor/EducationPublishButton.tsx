'use client';

// 학습 화면 게시 버튼 — 영상(WebCodecs)·카드(Canvas)를 브라우저에서 렌더해 공개 사본으로
// 업로드한다(서버는 저장만). 성공하면 학습 화면(/learn/korean/N)을 새창으로 여는 링크를
// 보여준다. WebCodecs 미지원 브라우저는 영상 없이(이북·카드만) 게시할지 물어본다.

import { useState } from 'react';
import { Globe2, Loader2, ExternalLink } from 'lucide-react';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { buildVideoMp4, isBrowserVideoRenderSupported } from '@/lib/super-editor/video/buildVideoMp4';
import { buildEducationCardImages } from '@/lib/super-editor/education/buildCardImage';
import { deriveEducationVideo } from '@/lib/super-editor/education/toVideoScenes';
import { inflateEducationScenes } from '@/lib/super-editor/education/inflateEducationScenes';
import type { EducationSnapshot } from '@/lib/super-editor/education/types';

interface Props {
  orderId:  string;
  snapshot: EducationSnapshot | null;
}

type Phase = 'idle' | 'video' | 'cards' | 'upload';

export function EducationPublishButton({ orderId, snapshot }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [published, setPublished] = useState<{ path: string; warnings: string[] } | null>(null);
  const unitCount = snapshot?.units.length ?? 0;
  const busy = phase !== 'idle';

  async function handlePublish() {
    if (!snapshot || unitCount === 0 || busy) return;
    setPublished(null);
    try {
      const ledger = useFileLedgerStore.getState();
      await Promise.all([
        ledger.hydrateFromLocalIndex(orderId),
        ledger.refreshFromServer(orderId),
      ]);
      const entries = useFileLedgerStore.getState().entries;

      // 1) 영상 — 로컬 렌더(미지원 브라우저는 확인 후 영상 없이 진행)
      let videoBytes: Uint8Array | null = null;
      if (isBrowserVideoRenderSupported()) {
        setPhase('video');
        const derived = deriveEducationVideo(snapshot);
        // 장면 카드 사전 렌더(큰 글자·유닛 컬러·배경·삽화 프레임) — 실패 장면은 원본 폴백
        const inflated = await inflateEducationScenes(derived.project, snapshot, entries);
        try {
          videoBytes = (await buildVideoMp4(inflated.project, entries, (r) => setProgress(r))).bytes;
        } finally {
          inflated.dispose();
        }
      } else if (!confirm('이 브라우저는 로컬 영상 생성을 지원하지 않습니다(Chrome/Edge 권장).\n영상 없이(이북·카드만) 게시할까요?')) {
        setPhase('idle');
        return;
      }

      // 2) 카드 — 로컬 Canvas
      setPhase('cards');
      const cards = await buildEducationCardImages(snapshot, entries);

      // 3) 업로드 — 서버는 사본 저장만(삽화는 서버가 원장에서 직접 복사)
      setPhase('upload');
      const form = new FormData();
      form.set('snapshot', JSON.stringify(snapshot));
      if (videoBytes) form.set('video', new Blob([videoBytes as BlobPart], { type: 'video/mp4' }), 'video.mp4');
      for (const card of cards.cards) {
        form.append('cards', new Blob([card.bytes as BlobPart], { type: 'image/png' }), card.filename);
      }
      const res = await fetch('/api/admin/education/publish', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      const data = await res.json();
      setPublished({ path: data.learnPath, warnings: data.warnings ?? [] });
    } catch (e) {
      console.error('[EducationPublishButton] 게시 실패:', e);
      alert(`게시에 실패했습니다(${e instanceof Error ? e.message : '알 수 없는 오류'}).`);
    } finally {
      setPhase('idle');
      setProgress(0);
    }
  }

  const label =
    phase === 'video'  ? `영상 렌더 ${Math.round(progress * 100)}%`
    : phase === 'cards'  ? '카드 생성 중…'
    : phase === 'upload' ? '업로드 중…'
    : '학습 화면 게시';

  return (
    <>
      <button
        onClick={handlePublish}
        disabled={unitCount === 0 || busy || !snapshot}
        title={unitCount === 0 ? '유닛을 추가해야 게시할 수 있습니다' : undefined}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors shrink-0"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Globe2 size={14} />}
        {label}
      </button>
      {published && (
        <a
          href={published.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
        >
          <ExternalLink size={14} /> 학습 화면 새창 열기
        </a>
      )}
    </>
  );
}
