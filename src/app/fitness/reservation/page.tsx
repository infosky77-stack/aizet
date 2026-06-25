'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle, Clock, Phone } from 'lucide-react';

const CLASSES = [
  '그룹 필라테스 (월 8회)',
  '1:1 퍼스널 트레이닝',
  '기구 필라테스 (월 8회)',
  '매트 필라테스 (월 8회)',
  '필라테스+요가 복합 (월 8회)',
  '임산부·산후 필라테스',
  '무료 체험 수업',
];

const INSTRUCTORS = ['상관없음', '김지수 원장', '이민아 강사', '박세준 강사'];

const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function FitnessReservationPage() {
  const [form, setForm] = useState({
    name: '', phone: '', classType: '', instructor: '상관없음', date: '', time: '', level: 'beginner', goal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '성함을 입력해 주세요.';
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) e.phone = '올바른 휴대폰 번호를 입력해 주세요.';
    if (!form.classType) e.classType = '수업 종류를 선택해 주세요.';
    if (!form.date) e.date = '날짜를 선택해 주세요.';
    if (!form.time) e.time = '시간을 선택해 주세요.';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-violet-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">예약이 완료되었습니다!</h1>
        <p className="text-gray-500 mb-2">담당 트레이너가 확인 후 연락드립니다.</p>
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-gray-700 text-left mt-4 mb-8 space-y-1.5">
          <p><span className="font-semibold">성함:</span> {form.name}</p>
          <p><span className="font-semibold">수업:</span> {form.classType}</p>
          <p><span className="font-semibold">강사:</span> {form.instructor}</p>
          <p><span className="font-semibold">일시:</span> {form.date} {form.time}</p>
        </div>
        <div className="bg-white rounded-2xl border border-violet-100 p-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-violet-600" />
            <span className="font-semibold">수업 10분 전 도착 권장</span>
          </div>
          <p className="text-xs text-gray-400">편안한 운동복과 양말을 준비해 주세요. 개인 매트는 대여 가능합니다.</p>
          <div className="flex items-center gap-2 mt-3">
            <Phone size={14} className="text-violet-600" />
            <span className="text-xs text-gray-400">취소·변경: 051-000-0000 (수업 전날까지)</span>
          </div>
        </div>
        <button
          onClick={() => { setDone(false); setForm({ name: '', phone: '', classType: '', instructor: '상관없음', date: '', time: '', level: 'beginner', goal: '' }); }}
          className="text-sm text-violet-600 hover:text-violet-800 font-semibold"
        >
          추가 예약하기
        </button>
      </div>
    );
  }

  const fieldClass = (key: string) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition ${
      errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarClock size={26} className="text-violet-700" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">수업 예약</h1>
        <p className="text-sm text-gray-500">첫 방문이라면 <span className="text-violet-600 font-semibold">무료 체험 수업</span>을 선택해 보세요.</p>
      </div>

      <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 md:p-8 space-y-5">

        {/* 운동 경험 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">필라테스 경험</label>
          <div className="flex gap-3">
            {[{ v: 'beginner', l: '입문 (처음)' }, { v: 'intermediate', l: '중급 (6개월+)' }, { v: 'advanced', l: '상급 (2년+)' }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => set('level', v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  form.level === v
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 성함 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">성함 <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="홍길동" className={fieldClass('name')} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 휴대폰 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴대폰 번호 <span className="text-red-400">*</span></label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" className={fieldClass('phone')} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* 수업 종류 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">수업 종류 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CLASSES.map(c => (
              <button
                key={c}
                onClick={() => set('classType', c)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition text-left ${
                  form.classType === c
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {errors.classType && <p className="text-xs text-red-500 mt-1">{errors.classType}</p>}
        </div>

        {/* 담당 강사 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">담당 강사</label>
          <div className="grid grid-cols-2 gap-2">
            {INSTRUCTORS.map(inst => (
              <button
                key={inst}
                onClick={() => set('instructor', inst)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${
                  form.instructor === inst
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* 운동 목표 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">운동 목표 또는 통증 부위 (선택)</label>
          <input
            value={form.goal}
            onChange={e => set('goal', e.target.value)}
            placeholder="예: 허리 통증 개선, 체형 교정, 다이어트 등"
            className={fieldClass('goal')}
          />
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">예약 날짜 <span className="text-red-400">*</span></label>
          <input
            type="date"
            min={getMinDate()}
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={fieldClass('date')}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* 시간 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">예약 시간 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-4 gap-2">
            {TIMES.map(t => (
              <button
                key={t}
                onClick={() => set('time', t)}
                className={`py-2 rounded-xl text-sm font-medium border transition ${
                  form.time === t
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
        >
          {submitting ? '예약 중...' : '예약 확정'}
        </button>

        <p className="text-center text-xs text-gray-400">
          취소·변경은 수업 전날까지 051-000-0000으로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
