'use client';

import { useState, useEffect } from 'react';
import { TestTube, ChevronRight, CheckCircle, XCircle, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

interface Question { id: string; text: string; options: string[] }
type Lang = 'en' | 'zh' | 'ja' | 'vi';

const LANG_LABELS: Record<Lang, string> = { en: 'English', zh: '中文', ja: '日本語', vi: 'Tiếng Việt' };
const LEVEL_LABELS: Record<string, { ko: string; color: string }> = {
  beginner:     { ko: '입문', color: 'text-gray-600 bg-gray-100' },
  elementary:   { ko: '초급', color: 'text-green-700 bg-green-100' },
  intermediate: { ko: '중급', color: 'text-blue-700 bg-blue-100' },
  advanced:     { ko: '고급', color: 'text-violet-700 bg-violet-100' },
};

export default function LevelTestPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<'lang' | 'quiz' | 'result'>('lang');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ level: string; score: number; total: number; feedback: string; recommendedUnit: string } | null>(null);
  const [details, setDetails] = useState<Array<{ id: string; correct: boolean; explanation: string }>>([]);

  async function startQuiz() {
    setLoading(true);
    const res = await fetch('/api/korean/test');
    const data = await res.json();
    setQuestions(data.questions);
    setLoading(false);
    setStep('quiz');
  }

  function handleSelect(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[current];
    setAnswers(prev => ({ ...prev, [q.id]: idx }));
  }

  async function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      // Submit
      setLoading(true);
      const res = await fetch('/api/korean/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, lang }),
      });
      const data = await res.json();
      setResult(data.result);
      setDetails(data.details);
      setLoading(false);
      setStep('result');
    }
  }

  const q = questions[current];
  const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;

  if (step === 'lang') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TestTube size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">레벨 테스트</h1>
          <p className="text-gray-500 text-sm">AI가 8개 문제로 현재 한국어 수준을 진단합니다.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="font-semibold text-gray-800 mb-3 text-sm">설명 언어 선택 / Select explanation language</div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={clsx(
                  'px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                  lang === code
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? '로딩 중...' : '테스트 시작'}
          {!loading && <ChevronRight size={18} />}
        </button>
      </div>
    );
  }

  if (step === 'quiz' && q) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>문제 {current + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-4">
          <div className="text-lg font-semibold text-gray-900 mb-5">{q.text}</div>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                  selected === null
                    ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                    : selected === i
                    ? i === answers[q.id] ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-100 text-gray-400 opacity-60'
                )}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className="mt-4 text-xs text-gray-500 italic border-t pt-3">
              {details[current]?.explanation ?? ''}
            </div>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={selected === null || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {current < questions.length - 1 ? '다음 문제' : loading ? '채점 중...' : '제출하기'}
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  if (step === 'result' && result) {
    const levelInfo = LEVEL_LABELS[result.level];
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={30} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">테스트 완료!</h2>
          <div className={clsx('inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3', levelInfo.color)}>
            {levelInfo.ko} ({result.level})
          </div>
          <div className="text-3xl font-black text-indigo-600 mb-1">{result.score} / {result.total}</div>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">{result.feedback}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">문제별 결과</div>
          <div className="space-y-2">
            {details.map((d, i) => (
              <div key={d.id} className="flex items-start gap-2 text-sm">
                {d.correct
                  ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
                <span className="text-gray-600">문제 {i + 1}: {d.explanation}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/korean/learn?unit=${result.recommendedUnit}`}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            추천 단원으로 학습 시작 <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => { setStep('lang'); setCurrent(0); setAnswers({}); setSelected(null); }}
            className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            다시 테스트하기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
