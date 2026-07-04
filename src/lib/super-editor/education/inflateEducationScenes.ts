// 파생 영상 project의 education 텍스트 장면을 사전 렌더 이미지 장면(blob URL)으로
// 치환하는 브라우저 전용 어댑터 — 영상 파이프라인(video/*, 절대 보존)을 한 줄도 수정하지
// 않고 큰 글자·유닛 컬러를 얻는다. buildVideoMp4의 이미지 장면은 contain-fit인데, 카드가
// 출력과 같은 1280×720이라 풀프레임으로 얹힌다.
//
// toVideoScenes(순수 변환기)가 장면 구성·시간·자막을 결정하고, 여기는 "겉모습"만 바꾼다:
// id·durationSec·transition 불변 — 자막 타이밍이 절대 흔들리지 않는다.
//
// 실패 원칙: 장면 카드를 못 그린 장면은 기존 텍스트 장면 그대로 두고 notices로 보고 —
// 영상은 항상 완성된다(조용한 실패 금지, 반쪽 실패도 금지).

import {
  layoutEducationSceneCard, SCENE_W_PX, SCENE_H_PX, type SceneCardSpec,
} from './cardLayout';
import {
  composeFontFamily, ensureComposeFontsLoaded, canvasMeasure, drawComposeBlock,
} from '../compose/drawBlocks';
import type { EducationSnapshot } from './types';
import type { VideoProjectSnapshot, VideoScene } from '../video/types';
import type { OutputNotice } from '../output/types';

export interface InflatedEducationScenes {
  project: VideoProjectSnapshot;
  notices: OutputNotice[];
  /** 만든 blob URL 전부 해제 — 렌더(buildVideoMp4) 완료 후 호출 */
  dispose: () => void;
}

/** 장면 id(toVideoScenes의 결정적 명명) → 장면 카드 명세. 모르는 장면은 null(원본 유지). */
function sceneSpec(scene: VideoScene, snapshot: EducationSnapshot): SceneCardSpec | null {
  if (scene.kind !== 'text') return null;
  if (scene.id === 'edu-intro' || scene.id === 'edu-outro') {
    return { kind: 'title', text: scene.text };
  }
  if (scene.id === 'edu-review') {
    const chars = snapshot.units.map((u) => u.char.trim()).filter(Boolean);
    return chars.length ? { kind: 'review', chars } : null;
  }
  // edu-<unitId>-char / -example — unitId에 '-'가 올 수 있어 고정 접두/접미로 벗긴다
  const m = /^edu-(.+)-(char|example)$/.exec(scene.id);
  if (!m) return null;
  const idx = snapshot.units.findIndex((u) => u.id === m[1]);
  if (idx < 0) return null;
  const unit = snapshot.units[idx];
  return m[2] === 'char'
    ? { kind: 'char', char: unit.char.trim(), romanization: unit.romanization.trim(), unitIndex: idx }
    : { kind: 'example', text: unit.exampleKo.trim(), unitIndex: idx };
}

export async function inflateEducationScenes(
  project: VideoProjectSnapshot,
  snapshot: EducationSnapshot,
): Promise<InflatedEducationScenes> {
  const notices: OutputNotice[] = [];
  const urls: string[] = [];
  const scenes: VideoScene[] = [];

  const family = composeFontFamily();
  // 한글 선명도 보장 — 카드 빌더와 같은 원칙(document.fonts.ready)
  await ensureComposeFontsLoaded(family, snapshot.units.map((u) => u.char + u.exampleKo).join('') + project.title);

  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W_PX;
  canvas.height = SCENE_H_PX;
  const ctx = canvas.getContext('2d');

  const measure = ctx ? canvasMeasure(ctx, family) : () => 0;

  for (const scene of project.scenes) {
    const spec = ctx ? sceneSpec(scene, snapshot) : null;
    if (!spec) {
      scenes.push(scene);
      continue;
    }
    try {
      const layout = layoutEducationSceneCard(spec, measure);
      ctx!.clearRect(0, 0, SCENE_W_PX, SCENE_H_PX);
      for (const block of layout.blocks) drawComposeBlock(ctx!, block, family);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('PNG 인코딩 실패');
      const url = URL.createObjectURL(blob);
      urls.push(url);
      scenes.push({ ...scene, kind: 'image', ledgerRef: null, srcUrl: url, text: '' });
    } catch {
      notices.push({
        refId: scene.id,
        label: `장면 ${scene.id}`,
        reason: '장면 카드를 그리지 못해 기본 텍스트 장면으로 렌더합니다',
      });
      scenes.push(scene); // 폴백 — 영상은 깨지지 않는다
    }
  }

  return {
    project: { ...project, scenes },
    notices,
    dispose: () => { for (const u of urls) URL.revokeObjectURL(u); },
  };
}
