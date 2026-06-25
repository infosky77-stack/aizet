'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle, Clock, Phone } from 'lucide-react';

const SERVICES = [
  '컷 (여성)',
  '컷 (남성)',
  '펌',
  '탈색',
  '염색 (전체)',
  '염색 (부분)',
  '트리트먼트',
  '두피케어',
  '컷+펌',
  '컷+염색',
  '스타일 상담만',
];

const DESIGNERS = ['박지수 원장', '김민준 실장', '이수연 디자이너', '상관없음'];

const TIMES = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function SalonReservationPage() {
  const [form, setForm] = useState({
    name: '', phone: '', service: '', designer: '', date: '', time: '', hairLength: '', note: '',
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
    if (!form.service) e.service = '시술 항목을 선택해 주세요.';
    if (!form.designer) e.designer = '디자이너를 선택해 주세요.';
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
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">예약이 완료되었습니다!</h1>
        <p className="text-gray-500 mb-2">예약 확인 문자를 발송했습니다.</p>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-gray-700 text-left mt-4 mb-8 space-y-1.5">
          <p><span className="font-semibold">성함:</span> {form.name}</p>
          <p><span className="font-semibold">시술:</span> {form.service}</p>
          <p><span className="font-semibold">디자이너:</span> {form.designer}</p>
          <p><span className="font-semibold">예약 일시:</span> {form.date} {form.time}</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 p-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-rose-500" />
            <span className="font-semibold">예약 10분 전 도착</span>
          </div>
          <p className="text-xs text-gray-400">방문 전 원하는 스타일 사진을 미리 준비해 오시면 상담에 도움이 됩니다.</p>
          <div className="flex items-center gap-2 mt-3">
            <Phone size={14} className="text-rose-500" />
            <span className="text-xs text-gray-400">취소·변경: 02-5678-1234 (전날 오후 6시 전까지)</span>
          </div>
        </div>
        <button
          onClick={() => { setDone(false); setForm({ name: '', phone: '', service: '', designer: '', date: '', time: '', hairLength: '', note: '' }); }}
          className="text-sm text-rose-600 hover:text-rose-800 font-semibold"
        >
          추가 예약하기
        </button>
      </div>
    );
  }

  const fieldClass = (key: string) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition ${
      errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarClock size={26} className="text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">온라인 예약</h1>
        <p className="text-sm text-gray-500">예약 후 담당 디자이너에게 확인 문자를 보내드립니다.</p>
      </div>

      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-8 space-y-5">

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

        {/* 시술 항목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">시술 항목 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICES.map(t => (
              <button
                key={t}
                onClick={() => set('service', t)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition text-left ${
                  form.service === t
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
        </div>

        {/* 모발 길이 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">현재 모발 길이</label>
          <div className="flex gap-2">
            {['숏', '미디움', '롱', '초장발'].map(l => (
              <button
                key={l}
                onClick={() => set('hairLength', l)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                  form.hairLength === l
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 디자이너 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">담당 디자이너 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {DESIGNERS.map(d => (
              <button
                key={d}
                onClick={() => set('designer', d)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition text-left ${
                  form.designer === d
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {errors.designer && <p className="text-xs text-red-500 mt-1">{errors.designer}</p>}
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
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
        </div>

        {/* 요청 사항 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">요청 사항 (선택)</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="원하는 스타일, 참고 사진 링크, 알레르기 이력 등을 적어주세요."
            rows={3}
            className={`${fieldClass('note')} resize-none`}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
        >
          {submitting ? '예약 중...' : '예약 확정'}
        </button>

        <p className="text-center text-xs text-gray-400">
          예약 취소·변경은 전날 오후 6시 전까지 02-5678-1234로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
