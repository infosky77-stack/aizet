// 파생 영상 project의 education 장면을 사전 렌더 이미지 장면(blob URL)으로 치환하는
// 브라우저 전용 어댑터 — 영상 파이프라인(video/*, 절대 보존)을 한 줄도 수정하지 않고
// 큰 글자·유닛 컬러·배경 이미지·그림책 프레임 삽화를 얻는다. buildVideoMp4의 이미지
// 장면은 contain-fit인데, 카드가 출력과 같은 1280×720이라 풀프레임으로 얹힌다.
//
// toVideoScenes(순수 변환기)가 장면 구성·시간·자막을 결정하고, 여기는 "겉모습"만 바꾼다:
// id·durationSec·transition 불변 — 자막 타이밍이 절대 흔들리지 않는다.
//
// 원장 해석(entries): 배경(snapshot.backgroundRef)과 삽화(unit.illustrationRef)를
// resolveLedgerRefBlob로 비트맵화해 compose 슬롯에 주입한다. entries가 비어 있으면(원장
// 미하이드레이션) 배경 없는 카드로 그린다 — 게시 경로는 항상 하이드레이션 후 호출된다.
//
// 실패 원칙: 카드를 못 그린 장면은 원본 장면 그대로 두고 notices로 보고 — 영상은 항상
// 완성된다(조용한 실패 금지, 반쪽 실패도 금지). 삽화 장면 원본은 기존 이미지 장면이라
// 폴백 시에도 기존 파이프라인이 그대로 그린다(검은 여백만 생길 뿐).

import {
  layoutEducationSceneCard, SCENE_W_PX, SCENE_H_PX,
  ILLUSTRATION_SLOT, BACKGROUND_SLOT, type SceneCardSpec,
} from './cardLayout';
import {
  composeFontFamily, ensureComposeFontsLoaded, canvasMeasure, drawComposeBlock,
} from '../compose/drawBlocks';
import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import type { EducationSnapshot } from './types';
import type { FileEntry } from '../ledger/types';
import type { VideoProjectSnapshot, VideoScene } from '../video/types';
import type { OutputNotice } from '../output/types';

export interface InflatedEducationScenes {
  project: VideoProjectSnapshot;
  notices: OutputNotice[];
  /** 만든 blob URL 전부 해제 — 렌더(buildVideoMp4) 완료 후 호출 */
  dispose: () => void;
}

interface SceneMapping {
  spec: SceneCardSpec;
  /** 삽화 장면이면 해당 유닛의 원장 참조(비트맵 해석 대상) */
  illustrationRef: string | null;
}

/** 장면 id(toVideoScenes의 결정적 명명) → 장면 카드 명세. 모르는 장면은 null(원본 유지). */
function mapScene(scene: VideoScene, snapshot: EducationSnapshot): SceneMapping | null {
  if (scene.kind === 'text') {
    if (scene.id === 'edu-intro' || scene.id === 'edu-outro') {
      return { spec: { kind: 'title', text: scene.text }, illustrationRef: null };
    }
    if (scene.id === 'edu-review') {
      const chars = snapshot.units.map((u) => u.char.trim()).filter(Boolean);
      return chars.length ? { spec: { kind: 'review', chars }, illustrationRef: null } : null;
    }
  }
  // edu-<unitId>-char / -example / -illust — unitId에 '-'가 올 수 있어 고정 접두/접미로 벗긴다
  const m = /^edu-(.+)-(char|example|illust)$/.exec(scene.id);
  if (!m) return null;
  const idx = snapshot.units.findIndex((u) => u.id === m[1]);
  if (idx < 0) return null;
  const unit = snapshot.units[idx];
  if (m[2] === 'char' && scene.kind === 'text') {
    return {
      spec: { kind: 'char', char: unit.char.trim(), romanization: unit.romanization.trim(), unitIndex: idx },
      illustrationRef: null,
    };
  }
  if (m[2] === 'example' && scene.kind === 'text') {
    return { spec: { kind: 'example', text: unit.exampleKo.trim(), unitIndex: idx }, illustrationRef: null };
  }
  if (m[2] === 'illust' && scene.kind === 'image') {
    // 원본 삽화 장면(검은 여백 contain)을 그림책 프레임 카드로 승격
    return unit.illustrationRef
      ? { spec: { kind: 'illust', unitIndex: idx }, illustrationRef: unit.illustrationRef }
      : null;
  }
  return null;
}

export async function inflateEducationScenes(
  project: VideoProjectSnapshot,
  snapshot: EducationSnapshot,
  entries: Record<string, FileEntry> = {},
): Promise<InflatedEducationScenes> {
  const notices: OutputNotice[] = [];
  const urls: string[] = [];
  const scenes: VideoScene[] = [];
  const bitmaps: ImageBitmap[] = [];

  const family = composeFontFamily();
  // 한글 선명도 보장 — 카드 빌더와 같은 원칙(document.fonts.ready)
  await ensureComposeFontsLoaded(family, snapshot.units.map((u) => u.char + u.exampleKo).join('') + project.title);

  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W_PX;
  canvas.height = SCENE_H_PX;
  const ctx = canvas.getContext('2d');

  const measure = ctx ? canvasMeasure(ctx, family) : () => 0;

  const toBitmap = async (ref: string): Promise<ImageBitmap | null> => {
    const blob = await resolveLedgerRefBlob(ref, entries);
    if (!blob) return null;
    try {
      const bmp = await createImageBitmap(blob);
      bitmaps.push(bmp);
      return bmp;
    } catch { return null; }
  };

  // 회차 공통 배경 — 한 번 해석해 전 장면에 재사용. 실패해도 팔레트 배경으로 완성(보고만)
  let bgBmp: ImageBitmap | null = null;
  if (snapshot.backgroundRef && ctx) {
    bgBmp = await toBitmap(snapshot.backgroundRef);
    if (!bgBmp) {
      notices.push({ refId: 'background', label: '배경 이미지', reason: '배경을 해석하지 못해 기본 배경으로 렌더합니다' });
    }
  }
  const illustCache = new Map<string, ImageBitmap | null>();

  for (const scene of project.scenes) {
    const mapping = ctx ? mapScene(scene, snapshot) : null;
    if (!mapping) {
      scenes.push(scene);
      continue;
    }
    try {
      // 삽화 장면은 비트맵 해석이 안 되면 원본 장면 유지(기존 파이프라인이 그대로 그린다)
      let illustBmp: ImageBitmap | null = null;
      if (mapping.illustrationRef) {
        if (!illustCache.has(mapping.illustrationRef)) {
          illustCache.set(mapping.illustrationRef, await toBitmap(mapping.illustrationRef));
        }
        illustBmp = illustCache.get(mapping.illustrationRef) ?? null;
        if (!illustBmp) {
          scenes.push(scene);
          continue;
        }
      }

      const layout = layoutEducationSceneCard(mapping.spec, measure, { hasBackground: bgBmp !== null });
      ctx!.clearRect(0, 0, SCENE_W_PX, SCENE_H_PX);
      for (const block of layout.blocks) {
        drawComposeBlock(ctx!, block, family, { [BACKGROUND_SLOT]: bgBmp, [ILLUSTRATION_SLOT]: illustBmp });
      }
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('PNG 인코딩 실패');
      const url = URL.createObjectURL(blob);
      urls.push(url);
      scenes.push({ ...scene, kind: 'image', ledgerRef: null, srcUrl: url, text: '' });
    } catch {
      notices.push({
        refId: scene.id,
        label: `장면 ${scene.id}`,
        reason: '장면 카드를 그리지 못해 기본 장면으로 렌더합니다',
      });
      scenes.push(scene); // 폴백 — 영상은 깨지지 않는다
    }
  }

  for (const bmp of bitmaps) bmp.close();

  return {
    project: { ...project, scenes },
    notices,
    dispose: () => { for (const u of urls) URL.revokeObjectURL(u); },
  };
}
