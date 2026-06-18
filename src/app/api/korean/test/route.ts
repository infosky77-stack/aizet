import { NextRequest, NextResponse } from 'next/server';
import { LEVEL_QUESTIONS, scoreToLevel } from '@/lib/korean/test-questions';
import { LevelTestResult } from '@/types/korean';

export async function GET() {
  const questions = LEVEL_QUESTIONS.map(({ id, text, options }) => ({ id, text, options }));
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const answers: Record<string, number> = body.answers ?? {};

  let correct = 0;
  const details: Array<{ id: string; correct: boolean; explanation: string }> = [];

  for (const q of LEVEL_QUESTIONS) {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;
    const lang = body.lang ?? 'en';
    details.push({ id: q.id, correct: isCorrect, explanation: q.explanation[lang as keyof typeof q.explanation] ?? q.explanation.en });
  }

  const level = scoreToLevel(correct, LEVEL_QUESTIONS.length);

  const levelFeedback: Record<string, string> = {
    beginner: 'Start from the very beginning — consonants and vowels. You\'ll build a strong foundation!',
    elementary: 'You know some basics! Focus on expanding vocabulary and simple sentences.',
    intermediate: 'Great progress! Work on natural sentence patterns and everyday conversation.',
    advanced: 'Impressive! Focus on nuanced expressions, formal/informal styles, and fluency.',
  };

  const recommendedUnit: Record<string, string> = {
    beginner: 'consonant-basic',
    elementary: 'word-greetings',
    intermediate: 'sentence-basic',
    advanced: 'conversation-daily',
  };

  const result: LevelTestResult = {
    level,
    score: correct,
    total: LEVEL_QUESTIONS.length,
    feedback: levelFeedback[level],
    recommendedUnit: recommendedUnit[level],
  };

  return NextResponse.json({ result, details });
}
