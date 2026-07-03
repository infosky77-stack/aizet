// 영상 mp4를 브라우저에서 직접 생성한다 — 도록 PDF(buildCatalogPdf)·잡지 조판과 같은
// "서버 왕복 0" 로컬 경로. WebCodecs(VideoEncoder) + mp4-muxer로 조립하며, 미지원 브라우저는
// isBrowserVideoRenderSupported()가 false를 반환하고 호출부가 서버 fallback(기존 render_jobs
// 큐 → render-video.py)으로 넘긴다 — 도록과 동일한 이중 구조.
//
// 입력은 구조화 스냅샷(VideoProjectSnapshot.scenes)과 원장 entries. 장면별 처리:
//   image → createImageBitmap 후 각 프레임에 contain-fit
//   clip  → <video> 엘리먼트로 프레임 시각마다 seek해서 캡처(디먹서 불필요, 결정적)
//   text  → 오프스크린 캔버스에 카드 1장 그려 재사용
// 소스를 못 찾은 장면은 건너뛰고 notices로 보고(잡지 조판과 같은 계약).
// 오디오 트랙 없음 — BGM 자산 모듈이 아직 없다(현 서버 렌더러와 동일한 상태).

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { FileEntry } from '../ledger/types';
import type { VideoProjectSnapshot, VideoScene } from './types';
import { DEFAULT_SCENE_DURATION_SEC } from './types';
import { resolveSceneBlob } from './resolveSceneMedia';
import { drawMediaContain, drawTextCard, applyFadeIn } from './frames';
import type { OutputBuildResult, OutputNotice } from '../output/types';

const FPS = 24;
const FADE_SEC = 0.5;
const KEYFRAME_INTERVAL_FRAMES = FPS * 2;
const MAX_CLIP_SEC = 5 * 60; // 폭주 방지 — 원본 길이 클립 상한

const SIZE_BY_ASPECT: Record<VideoProjectSnapshot['aspect'], [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
};

/** 산출물 빌더 공용 계약(output/types.ts) + 영상 고유 필드 — refId에는 scene id가 들어간다 */
export interface VideoRenderResult extends OutputBuildResult {
  durationSec: number;
}

export function isBrowserVideoRenderSupported(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

function sceneLabel(scene: VideoScene, entries: Record<string, FileEntry>): string {
  if (scene.kind === 'text') return `텍스트 · ${scene.text.slice(0, 20) || '(빈 문구)'}`;
  const name = (scene.ledgerRef && entries[scene.ledgerRef]?.origName)
    || scene.srcUrl?.split('/').pop()
    || '(소스 없음)';
  return `${scene.kind === 'clip' ? '클립' : '이미지'} · ${name}`;
}

// 준비된(그릴 수 있는) 장면 — 종류별 드로잉 소스와 확정 길이를 들고 있다
type Renderable =
  | { scene: VideoScene; kind: 'image'; bitmap: ImageBitmap; durationSec: number }
  | { scene: VideoScene; kind: 'clip';  video: HTMLVideoElement; url: string; durationSec: number }
  | { scene: VideoScene; kind: 'text';  card: HTMLCanvasElement; durationSec: number };

function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error('video load error'));
    video.src = url;
  });
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => { cleanup(); resolve(); };
    const onError  = () => { cleanup(); reject(new Error('seek error')); };
    function cleanup() {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    }
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    // 끝 시각 정확히로 seek하면 일부 브라우저가 seeked를 안 쏘는 경우가 있어 살짝 앞으로
    video.currentTime = Math.min(t, Math.max(0, video.duration - 0.05));
  });
}

async function prepareScenes(
  project: VideoProjectSnapshot,
  entries: Record<string, FileEntry>,
  W: number, H: number,
  notices: OutputNotice[],
): Promise<Renderable[]> {
  const renderables: Renderable[] = [];

  for (const scene of project.scenes) {
    const fallbackDur = scene.durationSec ?? DEFAULT_SCENE_DURATION_SEC;

    if (scene.kind === 'text') {
      if (!scene.text.trim()) {
        notices.push({ refId: scene.id, label: sceneLabel(scene, entries), reason: '빈 텍스트 장면이라 건너뛰었습니다' });
        continue;
      }
      const card = document.createElement('canvas');
      card.width = W; card.height = H;
      drawTextCard(card.getContext('2d')!, scene.text.trim(), W, H);
      renderables.push({ scene, kind: 'text', card, durationSec: fallbackDur });
      continue;
    }

    const blob = await resolveSceneBlob(scene, entries);
    if (!blob) {
      notices.push({ refId: scene.id, label: sceneLabel(scene, entries), reason: '소스를 찾지 못해 건너뛰었습니다' });
      continue;
    }

    if (scene.kind === 'image') {
      try {
        const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        renderables.push({ scene, kind: 'image', bitmap, durationSec: fallbackDur });
      } catch {
        notices.push({ refId: scene.id, label: sceneLabel(scene, entries), reason: '이미지를 해석하지 못해 건너뛰었습니다' });
      }
      continue;
    }

    // clip
    const url = URL.createObjectURL(blob);
    try {
      const video = await loadVideoElement(url);
      const srcDur = Number.isFinite(video.duration) ? video.duration : 0;
      const durationSec = Math.min(scene.durationSec ?? srcDur, srcDur || fallbackDur, MAX_CLIP_SEC);
      if (durationSec <= 0) throw new Error('empty duration');
      renderables.push({ scene, kind: 'clip', video, url, durationSec });
    } catch {
      URL.revokeObjectURL(url);
      notices.push({ refId: scene.id, label: sceneLabel(scene, entries), reason: '클립을 디코드하지 못해 건너뛰었습니다' });
    }
  }

  return renderables;
}

export async function buildVideoMp4(
  project: VideoProjectSnapshot,
  entries: Record<string, FileEntry>,
  onProgress?: (ratio: number) => void,
): Promise<VideoRenderResult> {
  if (!isBrowserVideoRenderSupported()) {
    throw new Error('이 브라우저는 WebCodecs를 지원하지 않습니다');
  }

  const [W, H] = SIZE_BY_ASPECT[project.aspect] ?? SIZE_BY_ASPECT['16:9'];
  const notices: OutputNotice[] = [];
  const renderables = await prepareScenes(project, entries, W, H, notices);

  if (renderables.length === 0) {
    throw new Error('렌더링할 수 있는 장면이 없습니다');
  }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encoderError = e instanceof Error ? e : new Error(String(e)); },
  });
  encoder.configure({
    codec: 'avc1.42001f', // H.264 Baseline L3.1 — 720p까지, 재생 호환성 최우선
    width: W, height: H,
    bitrate: 4_000_000,
    framerate: FPS,
  });

  const totalFrames = renderables.reduce((sum, r) => sum + Math.max(1, Math.round(r.durationSec * FPS)), 0);
  const frameDurUs = Math.round(1_000_000 / FPS);
  let frameIndex = 0;

  try {
    for (const r of renderables) {
      const frames = Math.max(1, Math.round(r.durationSec * FPS));
      const fade = r.scene.transition === 'fade';

      for (let f = 0; f < frames; f++) {
        if (encoderError) throw encoderError;
        const tSec = f / FPS;

        if (r.kind === 'image') {
          drawMediaContain(ctx, r.bitmap, r.bitmap.width, r.bitmap.height, W, H);
        } else if (r.kind === 'text') {
          ctx.drawImage(r.card, 0, 0);
        } else {
          // 프레임 "중앙" 시각으로 seek — 경계 시각(f/FPS)으로 정확히 seek하면 Chromium이
          // 이전 프레임을 표시하는 경계 모호성이 있어 3프레임 주기 중복+건너뜀(뚝뚝 끊김)이
          // 생긴다. headless 실측: 경계 seek는 96프레임 중 중복 32·건너뜀 다수, 중앙 seek는
          // 중복 0·건너뜀 0 (재현 스크립트: tmp/seek-capture-repro*.mjs).
          await seekTo(r.video, (f + 0.5) / FPS);
          drawMediaContain(ctx, r.video, r.video.videoWidth, r.video.videoHeight, W, H);
        }
        if (fade && tSec < FADE_SEC) applyFadeIn(ctx, tSec / FADE_SEC, W, H);

        const frame = new VideoFrame(canvas, {
          timestamp: frameIndex * frameDurUs,
          duration:  frameDurUs,
        });
        encoder.encode(frame, { keyFrame: frameIndex % KEYFRAME_INTERVAL_FRAMES === 0 });
        frame.close();

        // 인코더 큐가 밀리면 잠깐 대기 — 메모리 폭주 방지
        if (encoder.encodeQueueSize > FPS * 2) {
          await new Promise((res) => setTimeout(res, 30));
        }

        frameIndex++;
        onProgress?.(frameIndex / totalFrames);
      }
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    muxer.finalize();
  } finally {
    encoder.close();
    for (const r of renderables) {
      if (r.kind === 'image') r.bitmap.close();
      if (r.kind === 'clip') { r.video.removeAttribute('src'); URL.revokeObjectURL(r.url); }
    }
  }

  return {
    bytes: new Uint8Array(muxer.target.buffer),
    notices,
    durationSec: frameIndex / FPS,
  };
}
