// 1편(기본 모음 6개) 초기 데이터 + 스냅샷 해석 폴백 — video/migrate.ts와 같은 위상.
//
// 새 education 콘텐츠의 스냅샷은 '{}'로 시작하므로, 편집 화면이 열 때 항상
// resolveEducationSnapshot을 거쳐 1편 프리셋으로 시작한다(회원은 여기서 다듬기만).
// 유닛 id는 결정적 슬러그 — 스냅샷 내부에서만 유일하면 되고, 프리셋이 랜덤이면
// 테스트가 불안정해진다.

import {
  isEducationSnapshot, type EducationSnapshot, type EducationUnit,
} from './types';

const UNIT = (
  id: string, char: string, romanization: string,
  exampleKo: string, example: EducationUnit['example'],
): EducationUnit => ({
  id, char, romanization, exampleKo, example,
  illustrationRef: null, voiceRef: null,
});

export const EPISODE_1_TITLE = '3분 한국어 1편 — 기본 모음';

export function episode1Preset(title = EPISODE_1_TITLE): EducationSnapshot {
  return {
    version: 1,
    title,
    episodeNo: 1,
    backgroundRef: null,
    units: [
      UNIT('unit-a',  'ㅏ', 'a',  '아기',  { en: 'baby',     zh: '婴儿', ja: 'あかちゃん', vi: 'em bé' }),
      UNIT('unit-eo', 'ㅓ', 'eo', '어머니', { en: 'mother',   zh: '妈妈', ja: 'おかあさん', vi: 'mẹ' }),
      UNIT('unit-o',  'ㅗ', 'o',  '오이',  { en: 'cucumber', zh: '黄瓜', ja: 'きゅうり',   vi: 'dưa chuột' }),
      UNIT('unit-u',  'ㅜ', 'u',  '우유',  { en: 'milk',     zh: '牛奶', ja: 'ぎゅうにゅう', vi: 'sữa' }),
      UNIT('unit-eu', 'ㅡ', 'eu', '음악',  { en: 'music',    zh: '音乐', ja: 'おんがく',   vi: 'âm nhạc' }),
      UNIT('unit-i',  'ㅣ', 'i',  '아이',  { en: 'child',    zh: '孩子', ja: 'こども',     vi: 'trẻ em' }),
    ],
  };
}

/**
 * 저장된 스냅샷(JSON 파싱 결과) → EducationSnapshot.
 * 유효하면 그대로(참조 동일), 빈/구형이면 1편 프리셋으로 시작한다.
 */
export function resolveEducationSnapshot(raw: unknown, fallbackTitle: string): EducationSnapshot {
  if (isEducationSnapshot(raw)) return raw;
  return episode1Preset(fallbackTitle || EPISODE_1_TITLE);
}
