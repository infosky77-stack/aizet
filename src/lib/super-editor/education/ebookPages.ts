// 이북 페이지 모델 — 순수 계산(DOM/원장 모름). 화면 플립북(EbookFlipbook)과 인쇄 PDF
// (buildEbookPdf)가 이 모델 하나를 공용으로 소비한다 — 화면과 인쇄물의 내용 불일치를
// 구조적으로 차단하는 단일 소스.
//
// 구성: 표지 → 유닛 페이지들(글자/로마자/예시 단어, 삽화는 참조만) → 복습 페이지.
// 삽화는 illustrationRef 그대로 넘긴다 — URL 해석(플립북)/바이트 해석(PDF)은 소비자 책임.
// 글자가 빈 유닛은 제외하고 notices로 보고한다(조용한 누락 금지 — output 계약과 동일 원칙).

import type { Locale } from '../../i18n/types';
import type { EducationSnapshot, StudyLang } from './types';
import type { OutputNotice } from '../output/types';

export type EbookPage =
  | { kind: 'cover'; title: string; episodeNo: number; chars: string[] }
  | {
      kind: 'unit'; unitId: string; /** 1부터 — 페이지 표기용 */ index: number;
      char: string; romanization: string; exampleKo: string;
      /** 열람 언어의 예시 단어 번역 — ko이거나 번역이 비면 null(원문만 표시) */
      exampleTranslated: string | null;
      illustrationRef: string | null;
    }
  | { kind: 'review'; items: { char: string; romanization: string }[] };

export interface EbookPagesResult {
  pages:   EbookPage[];
  notices: OutputNotice[];
}

export function buildEbookPages(snapshot: EducationSnapshot, locale: Locale): EbookPagesResult {
  const notices: OutputNotice[] = [];

  const included = snapshot.units.filter((unit, i) => {
    if (unit.char.trim()) return true;
    notices.push({
      refId: unit.id,
      label: `${i + 1}번 유닛`,
      reason: '학습 글자가 비어 있어 이북에서 제외했습니다',
    });
    return false;
  });

  const units: EbookPage[] = included.map((unit, i) => ({
    kind: 'unit',
    unitId: unit.id,
    index: i + 1,
    char: unit.char.trim(),
    romanization: unit.romanization.trim(),
    exampleKo: unit.exampleKo.trim(),
    // ko는 원문 자체가 본문 — 그 외 언어는 번역이 있을 때만 병기(빈 번역은 ko 폴백 원칙)
    exampleTranslated: locale === 'ko' ? null : (unit.example[locale as StudyLang]?.trim() || null),
    illustrationRef: unit.illustrationRef,
  }));

  const pages: EbookPage[] = [
    { kind: 'cover', title: snapshot.title, episodeNo: snapshot.episodeNo, chars: included.map((u) => u.char.trim()) },
    ...units,
    { kind: 'review', items: included.map((u) => ({ char: u.char.trim(), romanization: u.romanization.trim() })) },
  ];

  return { pages, notices };
}
