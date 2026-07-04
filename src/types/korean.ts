// StudyLang의 정의는 lib/super-editor/education/types.ts로 이동했다(교육 도메인 개편).
// 이 파일(구 /korean 데모 타입)은 6단계에서 삭제 예정 — 그때까지 기존 참조가 깨지지
// 않도록 재수출만 유지한다.
import type { StudyLang } from '@/lib/super-editor/education/types';

export type { StudyLang } from '@/lib/super-editor/education/types';

export type KoreanLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
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
