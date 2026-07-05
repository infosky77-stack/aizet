// 한국어교육 콘텐츠 스냅샷 — education 도메인의 구조화 스키마 단일 소스 (순수 타입).
//
// 하나의 콘텐츠 원장(스냅샷)에서 세 산출물이 파생된다: ①영상(toVideoScenes — 4단계)
// ②이북(ebookPages — 3단계) ③카드 이미지(cardLayout — 2단계). 각 빌더는 이 타입만
// 읽으므로, 여기에 자유 텍스트 형식을 되살리지 말 것(video/types.ts와 같은 원칙).
//
// 삽화·음성은 원장 참조(ledgerRef)로만 연결한다 — 회원이 파일 관리자에 직접 올리거나,
// 향후 회원 API 키 연동 시 AI 생성물이 원장에 "후보"로 추가된다(lib/ai/memberAi.ts 게이트).
// 어느 쪽이든 스냅샷 입장에서는 동일한 참조라 이 스키마는 바뀌지 않는다.

import type { Locale } from '../../i18n/types';

/**
 * 학습자 모국어 — 사이트 공통 Locale(lib/i18n/types.ts)에서 ko(학습 대상 언어)를 뺀
 * 부분집합. SUPPORTED_LOCALES에 언어를 추가하면 Record<StudyLang, …>들이 컴파일 에러로
 * 교육 콘텐츠 번역 추가를 강제한다(의도된 가드 — 지원 언어와 학습 콘텐츠의 동기화).
 * (구 /korean 데모의 types/korean.ts에서 이동 — 데모는 삭제 완료, 여기가 유일한 정의처)
 */
export type StudyLang = Exclude<Locale, 'ko'>;

export interface EducationUnit {
  id: string;
  /** 학습 글자 (예: 'ㅏ') */
  char: string;
  /** 로마자 표기 (국어의 로마자 표기법, 예: 'a') */
  romanization: string;
  /** 예시 단어 원문 — ko가 항상 원문 단일 소스(제품 섹션 i18n과 같은 원칙) */
  exampleKo: string;
  /** 예시 단어 번역 — StudyLang 전 언어 필수(빈 문자열 허용, 표시 시 ko 폴백) */
  example: Record<StudyLang, string>;
  /** 삽화 원장 참조 — null이면 미연결 */
  illustrationRef: string | null;
  /** 발음 음성 원장 참조 — null이면 미연결 */
  voiceRef: string | null;
}

/** 조립 부품 — 자모(ㄱ·"그") / 글자(가·"가") / 단어(가방·"가방") 공용 */
export interface AssemblyPart {
  glyph: string;
  /** 발음 표기(화면·자막용, 예: "그") */
  pronunciation: string;
}

/** 조립 종류 — 3편(자모→글자) / 4편(글자→단어) / 5편(단어→문장) */
export type AssemblyKind = 'syllable' | 'word' | 'sentence';

/**
 * 조립 유닛 — "부품들이 모여 결과가 되는" 한 장면의 스키마. 세 편이 같은 문법을 쓴다.
 * 실사 이미지·음성은 기존 유닛과 동일하게 원장 참조(ledgerRef)로만 연결한다.
 */
export interface AssemblyUnit {
  id: string;
  kind: AssemblyKind;
  parts: AssemblyPart[];
  /** 조립 결과 원문 — '가' / '가방' / '가방을 메요' */
  resultKo: string;
  romanization: string;
  /** 결과 뜻 번역 — StudyLang 전 언어(빈 문자열 허용, 표시 시 ko 폴백) */
  meaning: Record<StudyLang, string>;
  /** 뜻 실사 이미지 원장 참조 — null이면 미연결 */
  imageRef: string | null;
  /** 발음 음성 원장 참조 — null이면 미연결(오디오는 후속 단계) */
  voiceRef: string | null;
}

export interface EducationSnapshot {
  version: 1;
  title: string;
  /** 회차 번호 — 1편(기본 모음)이 1 */
  episodeNo: number;
  units: EducationUnit[];
  /**
   * 회차 공통 배경 이미지 원장 참조 — 카드·영상 장면에 cover로 깔린다(글자 없는 이미지만).
   * 없거나 해석 실패면 유닛 팔레트 배경 폴백. 옵션 필드라 version 1 유지(기존 데이터 호환).
   */
  backgroundRef?: string | null;
  /**
   * 조립 회차(3·4·5편) 전용 블록 — 있으면 조립 학습 회차다(backgroundRef와 같은
   * "옵션 필드라 version 1 유지" 관례, 기존 게시본·1·2편 데이터와 호환).
   * 카드·이북·게시는 assemblyToUnits 투영을 거쳐 기존 units 경로를 그대로 쓴다.
   */
  assembly?: { units: AssemblyUnit[] };
}

export function isEducationSnapshot(raw: unknown): raw is EducationSnapshot {
  return typeof raw === 'object' && raw !== null
    && (raw as { version?: unknown }).version === 1
    && typeof (raw as { episodeNo?: unknown }).episodeNo === 'number'
    && Array.isArray((raw as { units?: unknown }).units);
}

export function newEducationUnit(over: Partial<EducationUnit> = {}): EducationUnit {
  return {
    id: `unit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    char: '',
    romanization: '',
    exampleKo: '',
    example: { en: '', zh: '', ja: '', vi: '' },
    illustrationRef: null,
    voiceRef: null,
    ...over,
  };
}

export function newAssemblyUnit(over: Partial<AssemblyUnit> = {}): AssemblyUnit {
  return {
    id: `asm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'syllable',
    parts: [],
    resultKo: '',
    romanization: '',
    meaning: { en: '', zh: '', ja: '', vi: '' },
    imageRef: null,
    voiceRef: null,
    ...over,
  };
}

/** 조립 회차인가 — assembly 유닛이 1개 이상이면 조립 학습 회차 */
export function isAssemblySnapshot(snapshot: EducationSnapshot): boolean {
  return (snapshot.assembly?.units.length ?? 0) > 0;
}
