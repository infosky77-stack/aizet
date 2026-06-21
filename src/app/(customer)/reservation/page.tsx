'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, CheckCircle, Users, Phone, User, Clock, Home } from 'lucide-react';
import { clsx } from 'clsx';

type Step = 'form' | 'done';

interface FormData {
  guestName: string;
  phone: string;
  partySize: string;
  date: string;
  time: string;
  note: string;
}

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>({
    guestName: '',
    phone: '',
    partySize: '2',
    date: todayStr(),
    time: '',
    note: '',
  });

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.guestName.trim()) e.guestName = '이름을 입력해 주세요';
    if (!/^010-\d{4}-\d{4}$/.test(form.phone)) e.phone = '010-XXXX-XXXX 형식으로 입력해 주세요';
    if (!form.time) e.time = '시간을 선택해 주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, partySize: Number(form.partySize), type: 'reservation' }),
    });
    setLoading(false);
    setStep('done');
  }

  if (step === 'done') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-green-50 to-[#fafaf8]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">예약이 완료됐습니다!</h2>
            <p className="text-sm text-stone-500 mt-1">
              {form.guestName}님 · {form.partySize}인 · {form.date} {form.time}
            </p>
          </div>
          <div className="w-full bg-stone-50 rounded-xl p-4 text-left text-sm space-y-1.5">
            <p className="font-semibold text-stone-700">중화가정 · 신세계백화점 의정부점 9층</p>
            <p className="text-stone-400 text-xs">경기도 의정부시 평화로 525</p>
            <div className="border-t border-stone-200 pt-2 mt-2">
              <p className="text-stone-500">예약 확인 문자를 <span className="font-medium text-stone-700">{form.phone}</span>으로 발송했습니다</p>
              {form.note && <p className="text-stone-400">메모: {form.note}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => router.push('/menu')}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
            >
              메뉴 보기
            </button>
            <button
              onClick={() => router.replace('/demo')}
              className="w-full py-3 border border-stone-200 hover:border-amber-400 text-stone-500 hover:text-amber-600 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Home size={14} />
              홈으로 돌아가기
            </button>
            <button
              onClick={() => { setStep('form'); setForm(f => ({ ...f, guestName: '', phone: '', time: '', note: '' })); }}
              className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              추가 예약하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 h-14 flex items-center gap-3">
        <button onClick={() => router.push('/menu')} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ArrowLeft size={18} />
        </button>
        <CalendarClock size={18} className="text-amber-600" />
        <div>
          <span className="font-semibold text-sm">예약하기</span>
          <p className="text-[11px] text-stone-400 leading-none">중화가정 · 신세계백화점 의정부점 9층</p>
        </div>
        <button
          onClick={() => router.replace('/demo')}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 text-stone-500 hover:border-amber-400 hover:text-amber-600 text-xs font-medium transition-colors"
        >
          <Home size={13} />
          홈으로
        </button>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-5">
        {/* Name */}
        <Field label="예약자 이름" icon={User} error={errors.guestName}>
          <input
            type="text"
            placeholder="홍길동"
            value={form.guestName}
            onChange={(e) => set('guestName', e.target.value)}
            className={inputCls(!!errors.guestName)}
          />
        </Field>

        {/* Phone */}
        <Field label="연락처" icon={Phone} error={errors.phone}>
          <input
            type="tel"
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputCls(!!errors.phone)}
          />
        </Field>

        {/* Party size */}
        <Field label="인원" icon={Users}>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => set('partySize', String(n))}
                className={clsx(
                  'w-10 h-10 rounded-xl border text-sm font-semibold transition-colors',
                  form.partySize === String(n)
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        {/* Date */}
        <Field label="날짜" icon={CalendarClock}>
          <input
            type="date"
            min={todayStr()}
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputCls(false)}
          />
        </Field>

        {/* Time */}
        <Field label="시간" icon={Clock} error={errors.time}>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => set('time', t)}
                className={clsx(
                  'px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                  form.time === t
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {/* Note */}
        <Field label="요청 사항 (선택)" icon={null}>
          <textarea
            placeholder="알레르기, 특별 요청 등"
            rows={3}
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm resize-none"
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-2xl transition-colors mt-2"
        >
          {loading ? '예약 중...' : '예약 확정하기'}
        </button>
      </div>
    </main>
  );
}

function inputCls(hasError: boolean) {
  return clsx(
    'w-full px-3 py-2.5 rounded-xl border focus:outline-none text-sm transition-colors',
    hasError
      ? 'border-red-300 focus:border-red-400'
      : 'border-stone-200 focus:border-amber-400'
  );
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: React.ElementType | null;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
        {Icon && <Icon size={14} className="text-amber-600" />}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
