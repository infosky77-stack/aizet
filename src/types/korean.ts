import type { Locale } from '@/lib/i18n/types';

export type KoreanLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
/**
 * 학습자 모국어 — 사이트 공통 Locale(lib/i18n/types.ts)에서 ko를 뺀 부분집합.
 * SUPPORTED_LOCALES에 언어를 추가하면 아래 Record<StudyLang, …>들이 컴파일 에러로
 * 커리큘럼 번역 추가를 강제한다(의도된 가드 — 지원 언어와 학습 콘텐츠의 동기화).
 */
export type StudyLang = Exclude<Locale, 'ko'>;
export type Stage = 'consonant' | 'vowel' | 'word' | 'sentence' | 'conversation';

export interface LevelQuestion {
  id: string;
  text: string;
  options: string[];
  answer: number;
  explanation: Record<StudyLang, string>;
}

export interface CurriculumUnit {
  id: string;
  stage: Stage;
  order: number;
  titleKo: string;
  title: Record<StudyLang, string>;
  description: Record<StudyLang, string>;
  content: LessonContent[];
}

export interface LessonContent {
  korean: string;
  romanization: string;
  meaning: Record<StudyLang, string>;
  example?: string;
  tip?: Record<StudyLang, string>;
}

export interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  lang: StudyLang;
  level: KoreanLevel;
  joinedAt: string;
  lastActiveAt: string;
  attendanceDays: number;
  completedUnits: string[];
  scores: Record<string, number>;
  totalScore: number;
  streak: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  feedback?: {
    pronunciation?: string;
    grammar?: string;
    suggestion?: string;
  };
}

export interface LevelTestResult {
  level: KoreanLevel;
  score: number;
  total: number;
  feedback: string;
  recommendedUnit: string;
}
