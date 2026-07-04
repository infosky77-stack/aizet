// 교육 스냅샷 → 영상 파생 스냅샷 순수 변환기 — Canvas/렌더/원장을 전혀 모른다.
//
// 이 파일 하나로 기존 영상 파이프라인 전체를 재사용한다: 파생 VideoProjectSnapshot을
// VideoRenderButton에 넘기면 buildVideoMp4(WebCodecs 로컬 렌더)·서버 fallback·미리보기가
// 그대로 동작하고, subtitles(언어별 큐)는 buildSubtitleFile로 SRT/VTT가 된다(번인 안 함).
// video/* 는 한 줄도 수정하지 않는다 — 데이터만 흘려보내는 어댑터.
//
// 장면 구성: 인트로 → 유닛마다 [글자 카드 → (삽화) → 예시 단어] → 복습 → 아웃트로.
// 파생물의 id는 결정적(unitId 기반) — 테스트 안정성과 재생성 멱등성을 위해서다.
//
// 음성(voiceRef): 현 영상 파이프라인은 오디오 트랙 자체가 없다(BGM 자산 모듈 부재와
// 같은 상태 — buildVideoMp4.ts 머리말 참고). 그래서 음성이 연결돼 있어도 mp4는 무음이며,
// 조용히 빼는 대신 notices로 보고한다. 파이프라인에 오디오가 생기는 날 여기서 얹는다.

import type { VideoProjectSnapshot, VideoScene } from '../video/types';
import type { EducationSnapshot } from './types';
import type { OutputNotice } from '../output/types';
import { SUPPORTED_LOCALES } from '../../i18n/types';
import type { SubtitleCue, VideoSubtitles } from '../video/types';

const INTRO_SEC   = 3;
const CHAR_SEC    = 3;
const ILLUST_SEC  = 3;
const EXAMPLE_SEC = 2.5;
const REVIEW_SEC  = 4;
const OUTRO_SEC   = 2.5;

const textScene = (id: string, text: string, durationSec: number, transition: VideoScene['transition'] = 'cut'): VideoScene => ({
  id, kind: 'text', ledgerRef: null, srcUrl: null, text, durationSec, transition,
});

export interface EducationVideoDerivation {
  project: VideoProjectSnapshot;
  notices: OutputNotice[];
}

export function deriveEducationVideo(snapshot: EducationSnapshot): EducationVideoDerivation {
  const notices: OutputNotice[] = [];
  const scenes: VideoScene[] = [];
  // 언어별 자막 큐 — 장면 시계와 같은 산수로 만들어 타이밍이 항상 일치한다
  const cues: Record<string, SubtitleCue[]> = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, []]));
  let clock = 0;

  const pushCue = (startSec: number, endSec: number, textOf: (locale: string) => string) => {
    for (const locale of SUPPORTED_LOCALES) {
      const text = textOf(locale).trim();
      if (text) cues[locale].push({ startSec, endSec, text });
    }
  };

  // 인트로 — 회차 제목 (첫 장면은 fade로 부드럽게)
  scenes.push(textScene('edu-intro', snapshot.title, INTRO_SEC, 'fade'));
  pushCue(clock, clock + INTRO_SEC, () => snapshot.title);
  clock += INTRO_SEC;

  const included = snapshot.units.filter((unit, i) => {
    if (unit.char.trim()) return true;
    notices.push({ refId: unit.id, label: `${i + 1}번 유닛`, reason: '학습 글자가 비어 있어 영상에서 제외했습니다' });
    return false;
  });

  for (const unit of included) {
    const char = unit.char.trim();
    const rom  = unit.romanization.trim();
    const segmentStart = clock;

    // 글자 카드
    scenes.push(textScene(`edu-${unit.id}-char`, rom ? `${char}  ·  ${rom}` : char, CHAR_SEC));
    clock += CHAR_SEC;

    // 삽화 (연결된 경우만 — 해석은 렌더 쪽 몫, 실패 시 기존 파이프라인이 보고)
    if (unit.illustrationRef) {
      scenes.push({
        id: `edu-${unit.id}-illust`, kind: 'image',
        ledgerRef: unit.illustrationRef, srcUrl: null, text: '',
        durationSec: ILLUST_SEC, transition: 'cut',
      });
      clock += ILLUST_SEC;
    }

    // 예시 단어
    if (unit.exampleKo.trim()) {
      scenes.push(textScene(`edu-${unit.id}-example`, unit.exampleKo.trim(), EXAMPLE_SEC));
      clock += EXAMPLE_SEC;
    }

    // 자막: 유닛 구간 전체(글자~예시)에 한 큐 — ko는 원문, 그 외는 번역(비면 ko 폴백)
    pushCue(segmentStart, clock, (locale) => {
      const head = rom ? `${char} (${rom})` : char;
      const example = locale === 'ko'
        ? unit.exampleKo.trim()
        : (unit.example[locale as keyof typeof unit.example]?.trim() || unit.exampleKo.trim());
      return example ? `${head} — ${example}` : head;
    });

    if (unit.voiceRef) {
      notices.push({
        refId: unit.id,
        label: `${char} 유닛 음성`,
        reason: '현재 영상 파이프라인은 오디오 트랙이 없어 음성은 포함되지 않습니다(무음)',
      });
    }
  }

  // 복습 + 아웃트로
  const reviewText = included.map((u) => u.char.trim()).join('  ');
  if (reviewText) {
    scenes.push(textScene('edu-review', reviewText, REVIEW_SEC, 'fade'));
    pushCue(clock, clock + REVIEW_SEC, () => reviewText);
    clock += REVIEW_SEC;
  }
  scenes.push(textScene('edu-outro', 'AIZET · 3분 한국어', OUTRO_SEC, 'fade'));

  const subtitles: VideoSubtitles = cues;

  return {
    project: {
      version: 2,
      title: snapshot.title,
      aspect: '16:9',
      bgm: 'none',
      scenes,
      subtitles,
    },
    notices,
  };
}
