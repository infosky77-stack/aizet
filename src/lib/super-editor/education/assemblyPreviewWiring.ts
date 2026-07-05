// 조립 유닛 → 미리보기 씬 배선(순수) — 조립 스냅샷(assembly.units)을 조립 렌더러
// (buildAssemblyVideoMp4)가 받는 AssemblyVideoScene[]로 변환한다.
//
// 브라우저 격리: 이미지 비트맵 해석(imageRef→ImageBitmap)과 글자 폭 측정(measure)은
// 둘 다 canvas/DOM 의존이라 여기서 만들지 않고 "주입"받는다(BitmapResolver·MeasureTextFn).
// 덕분에 이 모듈은 브라우저 비의존이라 Node에서 mock으로 테스트된다. 실제 영상 생성
// (buildAssemblyVideoMp4 호출)은 4-b(브라우저)의 몫 — 여기서는 배선만 한다.

import type { MeasureTextFn } from '../compose/blocks';
import type { EducationSnapshot } from './types';
import type { AssemblyVideoScene } from './buildAssemblyVideo';
import { getUnits } from './assemblyDocStore';
import { layoutAssemblyScene } from './assemblyScenes';
import { ILLUSTRATION_SLOT, BACKGROUND_SLOT } from './cardLayout';

/** imageRef 문자열 → 비트맵 해석기. 실제 구현은 4-b(브라우저)에서 주입, 테스트는 mock */
export type BitmapResolver = (ref: string) => Promise<ImageBitmap | null>;

export interface PreviewScenes {
  /** 유닛별 { id, scene, slots } — 조립 렌더러 입력 그대로 */
  scenes: AssemblyVideoScene[];
  /** 회차 공통 배경(backgroundRef) 해석 결과 → BACKGROUND_SLOT (없으면 빈 객체) */
  baseSlots: Record<string, ImageBitmap | null>;
}

export async function buildPreviewScenes(
  snap: EducationSnapshot,
  measure: MeasureTextFn,
  resolveBitmap: BitmapResolver,
  opts: { hasBackground?: boolean } = {},
): Promise<PreviewScenes> {
  const hasBackground = !!opts.hasBackground;
  const units = getUnits(snap);

  const scenes: AssemblyVideoScene[] = [];
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const scene = layoutAssemblyScene(unit, measure, { unitIndex: i, hasBackground });

    const videoScene: AssemblyVideoScene = { id: unit.id, scene };
    if (unit.imageRef) {
      const bitmap = await resolveBitmap(unit.imageRef);
      if (bitmap) videoScene.slots = { [ILLUSTRATION_SLOT]: bitmap };
    }
    scenes.push(videoScene);
  }

  const baseSlots: Record<string, ImageBitmap | null> = {};
  if (snap.backgroundRef) {
    baseSlots[BACKGROUND_SLOT] = await resolveBitmap(snap.backgroundRef);
  }

  return { scenes, baseSlots };
}
