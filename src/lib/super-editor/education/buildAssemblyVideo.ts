// 조립 영상 로컬 렌더러(브라우저 전용) — 모션 장면(MotionScene)을 프레임 단위로 직접
// 그려 WebCodecs로 인코딩한다. 파일럿(24fps 보간 실측: 초당 42KB·장면당 0.4초 렌더)의
// 제품 승격판. buildVideoMp4([절대 보존])의 검증된 골격(코덱·비트레이트·큐 배압·키프레임
// 주기)을 그대로 따르되 한 줄도 수정하지 않는 별도 모듈이다 — 정지 장면 파이프라인과
// 조립(모션) 파이프라인은 서로를 모른다.
//
// 역할 분리: 좌표·보간은 순수 계층(compose/motion·education/assemblyScenes)이 전부
// 결정했고, 여기는 "매 프레임 blocksAtTime → drawComposeBlock"만 안다. 글자는 코드
// (웹폰트)로, 배경·실사 이미지는 slot 비트맵으로 — 비트맵 해석(원장)은 호출부 책임
// (inflateEducationScenes와 같은 계약).

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { blocksAtTime, type MotionScene } from '../compose/motion';
import { drawComposeBlock } from '../compose/drawBlocks';
import { SCENE_W_PX, SCENE_H_PX } from './cardLayout';
import type { OutputBuildResult, OutputNotice } from '../output/types';

const FPS = 24;
const KEYFRAME_INTERVAL_FRAMES = FPS * 2;

export interface AssemblyVideoScene {
  /** 장면 식별자 — notices 보고용(조립 유닛 id 등) */
  id: string;
  scene: MotionScene;
  /** slot 이름 → 비트맵(장면 전용, 예: 뜻 실사 이미지) — 공통 슬롯은 baseSlots로 */
  slots?: Record<string, ImageBitmap | null>;
}

export interface AssemblyVideoResult extends OutputBuildResult {
  durationSec: number;
}

export function isAssemblyRenderSupported(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

export async function buildAssemblyVideoMp4(
  scenes: AssemblyVideoScene[],
  family: string,
  baseSlots: Record<string, ImageBitmap | null> = {},
  onProgress?: (ratio: number) => void,
): Promise<AssemblyVideoResult> {
  if (!isAssemblyRenderSupported()) {
    throw new Error('이 브라우저는 WebCodecs를 지원하지 않습니다');
  }

  const notices: OutputNotice[] = [];
  const usable = scenes.filter((s) => {
    if (s.scene.durationSec > 0 && s.scene.blocks.length > 0) return true;
    notices.push({ refId: s.id, label: `장면 ${s.id}`, reason: '빈 장면이라 건너뛰었습니다' });
    return false;
  });
  if (usable.length === 0) throw new Error('렌더링할 수 있는 장면이 없습니다');

  const W = SCENE_W_PX, H = SCENE_H_PX;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory', // moov를 앞으로 — 학습 화면 탐색(Range/206)과 한 쌍
  });

  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encoderError = e instanceof Error ? e : new Error(String(e)); },
  });
  encoder.configure({
    codec: 'avc1.42001f', // buildVideoMp4와 동일 — H.264 Baseline, 재생 호환성 최우선
    width: W, height: H,
    bitrate: 4_000_000,
    framerate: FPS,
  });

  const totalFrames = usable.reduce((sum, s) => sum + Math.max(1, Math.round(s.scene.durationSec * FPS)), 0);
  const frameDurUs = Math.round(1_000_000 / FPS);
  let frameIndex = 0;

  try {
    for (const { scene, slots } of usable) {
      const merged = { ...baseSlots, ...slots };
      const frames = Math.max(1, Math.round(scene.durationSec * FPS));
      for (let f = 0; f < frames; f++) {
        if (encoderError) throw encoderError;
        ctx.clearRect(0, 0, W, H);
        for (const block of blocksAtTime(scene, f / FPS)) {
          drawComposeBlock(ctx, block, family, merged);
        }
        const frame = new VideoFrame(canvas, {
          timestamp: frameIndex * frameDurUs,
          duration: frameDurUs,
        });
        encoder.encode(frame, { keyFrame: frameIndex % KEYFRAME_INTERVAL_FRAMES === 0 });
        frame.close();

        // 인코더 큐가 밀리면 잠깐 대기 — 메모리 폭주 방지(buildVideoMp4와 동일)
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
  }

  return {
    bytes: new Uint8Array(muxer.target.buffer),
    notices,
    durationSec: frameIndex / FPS,
  };
}
