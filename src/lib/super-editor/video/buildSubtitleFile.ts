// 자막 파일(SRT/VTT) 직렬화기 — 순수 로직 (DOM/서버 모름, 브라우저에서 생성·서버 왕복 0).
//
// 산출물 빌더 공용 계약(output/types.ts)을 따른다: 결과는 bytes + notices이고,
// 쓸 수 없는 큐(빈 텍스트, 시간 역전)는 조용히 누락시키지 않고 notices로 보고한다.
// 자막은 영상 프레임에 번인하지 않는다 — 언어별 별도 파일로 만들어 유튜브에
// 언어별 자막으로 업로드하는 방식. 기존 mp4 빌더(buildVideoMp4)는 이 모듈을 모른다.

import type { OutputBuildResult, OutputNotice } from '../output/types';
import {
  DEFAULT_SCENE_DURATION_SEC, type SubtitleCue, type VideoProjectSnapshot,
} from './types';

export type SubtitleFormat = 'srt' | 'vtt';

/** 초 → 'HH:MM:SS,mmm'(SRT) / 'HH:MM:SS.mmm'(VTT) */
export function formatSubtitleTime(sec: number, format: SubtitleFormat): string {
  // 총 밀리초로 먼저 반올림 — 초 단위에서 소수부만 따로 반올림하면 부동소수 누적값
  // (예: 2.9999…96)에서 ms가 1000이 되어 '00:00:02,1000' 같은 불량 타임코드가 나온다
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const h  = Math.floor(totalMs / 3_600_000);
  const m  = Math.floor((totalMs % 3_600_000) / 60_000);
  const s  = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}${format === 'srt' ? ',' : '.'}${pad(ms, 3)}`;
}

/**
 * 큐 목록 → 자막 파일 바이트. 시작 시각 순으로 정렬하고, 빈 텍스트·시간 역전 큐는
 * 결과에서 빼며 notices로 보고한다(output 계약). 유효 큐가 0개여도 형식상 유효한
 * (빈) 파일을 돌려준다 — 판단은 호출부 몫.
 */
export function buildSubtitleFile(
  cues: SubtitleCue[], format: SubtitleFormat,
): OutputBuildResult {
  const notices: OutputNotice[] = [];
  const valid = [...cues]
    .sort((a, b) => a.startSec - b.startSec)
    .filter((cue, i) => {
      const label = `자막 ${i + 1}번 큐`;
      if (!cue.text.trim()) {
        notices.push({ label, reason: '텍스트가 비어 있어 제외했습니다' });
        return false;
      }
      if (!(cue.endSec > cue.startSec)) {
        notices.push({ label, reason: '종료 시각이 시작 시각보다 늦지 않아 제외했습니다' });
        return false;
      }
      return true;
    });

  const blocks = valid.map((cue, i) => {
    const timing = `${formatSubtitleTime(cue.startSec, format)} --> ${formatSubtitleTime(cue.endSec, format)}`;
    // SRT는 1부터 번호 매김이 필수, VTT는 큐 식별자 생략 가능
    return format === 'srt'
      ? `${i + 1}\n${timing}\n${cue.text.trim()}`
      : `${timing}\n${cue.text.trim()}`;
  });

  const body = format === 'vtt'
    ? `WEBVTT\n\n${blocks.join('\n\n')}\n`
    : `${blocks.join('\n\n')}\n`;

  return { bytes: new TextEncoder().encode(body), notices };
}

/**
 * 장면 durationSec에서 큐 타이밍 초안 자동 생성 — text 장면의 문구가 해당 장면
 * 구간의 큐가 된다(clip/image 장면은 시계만 전진). 어디까지나 "초안"이며 회원이
 * 자막 편집기에서 다듬는 출발점이다.
 * clip의 durationSec=null(원본 길이)은 실제 길이를 모르므로 기본값으로 가정하고 보고한다.
 */
export function draftCuesFromScenes(
  snapshot: VideoProjectSnapshot,
): { cues: SubtitleCue[]; notices: OutputNotice[] } {
  const cues: SubtitleCue[] = [];
  const notices: OutputNotice[] = [];
  let clock = 0;

  snapshot.scenes.forEach((scene, i) => {
    const duration = scene.durationSec ?? DEFAULT_SCENE_DURATION_SEC;
    if (scene.kind === 'clip' && scene.durationSec === null) {
      notices.push({
        refId:  scene.id,
        label:  `클립 (${i + 1}번째 장면)`,
        reason: `원본 길이를 알 수 없어 ${DEFAULT_SCENE_DURATION_SEC}초로 가정했습니다 — 타이밍을 확인해주세요`,
      });
    }
    if (scene.kind === 'text' && scene.text.trim()) {
      cues.push({ startSec: clock, endSec: clock + duration, text: scene.text.trim() });
    }
    clock += duration;
  });

  return { cues, notices };
}
