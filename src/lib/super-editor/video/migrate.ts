// 영상 스냅샷 형식 변환 — 순수 함수만 (I/O·상태 없음).
//
// ① migrateVideoSnapshot: 구형(canvas.blocks + duration_sec) → 장면 목록(version 2).
//    이미 version 2면 그대로 통과. 편집 화면이 스냅샷을 열 때 항상 이걸 거친다.
// ② toLegacyFields: 장면 목록 → 구형 필드(canvas.blocks, duration_sec) 파생.
//    서버 fallback 렌더러(scripts/render-video.py)가 구형 필드만 읽으므로, 저장 시
//    version 2 스냅샷에 이 파생 필드를 병합해두면 fallback이 코드 수정 없이 동작한다.
//    클립 장면은 fallback이 지원하지 않아 파생에서 제외된다(브라우저 렌더 전용).

import {
  VideoProjectSnapshot, VideoScene, isVideoProjectSnapshot, emptyVideoProject, newScene,
  DEFAULT_SCENE_DURATION_SEC,
} from './types';

interface LegacyBlock { type?: string; content?: string }

export function migrateVideoSnapshot(raw: unknown, fallbackTitle: string): VideoProjectSnapshot {
  if (isVideoProjectSnapshot(raw)) return raw;

  const legacy = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    title?: string; duration_sec?: number; bgm?: string;
    canvas?: { blocks?: LegacyBlock[] };
  };
  const blocks = (legacy.canvas?.blocks ?? []).filter(
    (b) => (b.type === 'text' && (b.content ?? '').trim()) || (b.type === 'image' && b.content),
  );

  const project = emptyVideoProject(legacy.title || fallbackTitle);
  project.bgm = legacy.bgm ?? 'none';
  if (blocks.length === 0) return project;

  // 구형은 전체 길이(duration_sec)를 블록 수로 나눠 썼다 — 장면별 길이로 환산해 보존.
  const total = Number(legacy.duration_sec) > 0 ? Number(legacy.duration_sec) : blocks.length * DEFAULT_SCENE_DURATION_SEC;
  const per = Math.max(1, Math.round((total / blocks.length) * 10) / 10);

  project.scenes = blocks.map((b) =>
    b.type === 'image'
      // 구형 이미지 블록은 서버 URL 문자열만 있다(원장 id 없음) → srcUrl로 보존
      ? newScene('image', { srcUrl: b.content ?? null, durationSec: per })
      : newScene('text', { text: (b.content ?? '').trim(), durationSec: per }),
  );
  return project;
}

/** 장면의 이미지 URL 해석기 — 호출부(원장을 아는 쪽)가 주입한다. null이면 해석 불가. */
export type SceneUrlResolver = (scene: VideoScene) => string | null;

export function toLegacyFields(
  project: VideoProjectSnapshot,
  resolveUrl: SceneUrlResolver,
): { canvas: { blocks: { id: string; type: 'text' | 'image'; content: string }[] }; duration_sec: number; bgm: string } {
  const blocks: { id: string; type: 'text' | 'image'; content: string }[] = [];
  let totalSec = 0;

  for (const scene of project.scenes) {
    if (scene.kind === 'clip') continue; // fallback(render-video.py) 미지원 — 브라우저 렌더 전용
    if (scene.kind === 'text') {
      if (!scene.text.trim()) continue;
      blocks.push({ id: scene.id, type: 'text', content: scene.text.trim() });
    } else {
      const url = resolveUrl(scene);
      if (!url) continue;
      blocks.push({ id: scene.id, type: 'image', content: url });
    }
    totalSec += scene.durationSec ?? DEFAULT_SCENE_DURATION_SEC;
  }

  return {
    canvas: { blocks },
    duration_sec: Math.max(1, Math.round(totalSec)),
    bgm: project.bgm,
  };
}
