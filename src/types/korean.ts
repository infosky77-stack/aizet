export type KoreanLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
export type StudyLang = 'en' | 'zh' | 'ja' | 'vi';
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
