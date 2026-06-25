'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle, Phone, Info } from 'lucide-react';

const ROOMS = [
  { id: 'standalone', name: '독채 하늘채', capacity: '최대 8인', price: '350,000원~/박' },
  { id: 'couple', name: '커플룸 달빛방', capacity: '2인 전용', price: '160,000원~/박' },
  { id: 'family', name: '가족룸 숲속방', capacity: '최대 4인', price: '220,000원~/박' },
  { id: 'jacuzzi', name: '프리미엄 자쿠지 스위트', capacity: '최대 4인', price: '300,000원~/박' },
];

const BBQ = ['필요 없음', '바베큐 세트 추가 (10,000원)', '장작 추가 (15,000원)', '바베큐 + 장작 세트 (22,000원)'];

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getAfterTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
}

export default function PensionReservationPage() {
  const [form, setForm] = useState({
    name: '', phone: '', room: '', checkin: '', checkout: '', guests: '2', purpose: '', bbq: '필요 없음', request: '',
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
    if (!form.room) e.room = '객실을 선택해 주세요.';
    if (!form.checkin) e.checkin = '체크인 날짜를 선택해 주세요.';
    if (!form.checkout) e.checkout = '체크아웃 날짜를 선택해 주세요.';
    if (form.checkin && form.checkout && form.checkout <= form.checkin) e.checkout = '체크아웃은 체크인보다 늦어야 합니다.';
    return e;
  }

  function nights() {
    if (!form.checkin || !form.checkout) return 0;
    return Math.max(0, Math.round((new Date(form.checkout).getTime() - new Date(form.checkin).getTime()) / 86400000));
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    const n = nights();
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-teal-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">예약 신청이 완료되었습니다!</h1>
        <p className="text-gray-500 mb-2">담당자가 확인 후 1시간 이내 연락드립니다.</p>
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-gray-700 text-left mt-4 mb-8 space-y-1.5">
          <p><span className="font-semibold">성함:</span> {form.name}</p>
          <p><span className="font-semibold">객실:</span> {form.room}</p>
          <p><span className="font-semibold">체크인:</span> {form.checkin} 15:00</p>
          <p><span className="font-semibold">체크아웃:</span> {form.checkout} 11:00</p>
          <p><span className="font-semibold">숙박:</span> {n}박 / 인원 {form.guests}명</p>
          {form.bbq !== '필요 없음' && <p><span className="font-semibold">추가 옵션:</span> {form.bbq}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-teal-100 p-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-teal-600" />
            <span className="text-xs text-gray-400">취소·변경: 033-000-0000 (체크인 3일 전까지 무료 취소)</span>
          </div>
        </div>
        <button
          onClick={() => { setDone(false); setForm({ name: '', phone: '', room: '', checkin: '', checkout: '', guests: '2', purpose: '', bbq: '필요 없음', request: '' }); }}
          className="text-sm text-teal-600 hover:text-teal-800 font-semibold"
        >
          다시 예약하기
        </button>
      </div>
    );
  }

  const fieldClass = (key: string) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 transition ${
      errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarClock size={26} className="text-teal-700" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">객실 예약</h1>
        <p className="text-sm text-gray-500">2박 이상 예약 시 <span className="text-teal-600 font-semibold">10% 할인</span> 적용됩니다.</p>
      </div>

      <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-6 md:p-8 space-y-5">

        {/* 성함 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">예약자 성함 <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="홍길동" className={fieldClass('name')} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 휴대폰 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴대폰 번호 <span className="text-red-400">*</span></label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" className={fieldClass('phone')} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* 객실 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">객실 선택 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-1 gap-2">
            {ROOMS.map(r => (
              <button
                key={r.id}
                onClick={() => set('room', r.name)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                  form.room === r.name
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                }`}
              >
                <div>
                  <span className="font-bold text-sm">{r.name}</span>
                  <span className={`text-xs ml-2 ${form.room === r.name ? 'text-teal-200' : 'text-gray-400'}`}>{r.capacity}</span>
                </div>
                <span className={`text-sm font-semibold ${form.room === r.name ? 'text-teal-100' : 'text-teal-700'}`}>{r.price}</span>
              </button>
            ))}
          </div>
          {errors.room && <p className="text-xs text-red-500 mt-1">{errors.room}</p>}
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">체크인 <span className="text-red-400">*</span></label>
            <input type="date" min={getTomorrow()} value={form.checkin} onChange={e => set('checkin', e.target.value)} className={fieldClass('checkin')} />
            {errors.checkin && <p className="text-xs text-red-500 mt-1">{errors.checkin}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">체크아웃 <span className="text-red-400">*</span></label>
            <input type="date" min={getAfterTomorrow()} value={form.checkout} onChange={e => set('checkout', e.target.value)} className={fieldClass('checkout')} />
            {errors.checkout && <p className="text-xs text-red-500 mt-1">{errors.checkout}</p>}
          </div>
        </div>

        {nights() > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 text-sm text-teal-800 font-semibold">
            총 {nights()}박 {nights() >= 2 ? <span className="text-teal-600"> · 10% 할인 적용</span> : ''}
          </div>
        )}

        {/* 인원 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">인원수</label>
          <div className="flex gap-2 flex-wrap">
            {['1', '2', '3', '4', '5', '6', '7', '8'].map(n => (
              <button
                key={n}
                onClick={() => set('guests', n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold border transition ${
                  form.guests === n
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 여행 목적 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">여행 목적</label>
          <div className="flex flex-wrap gap-2">
            {['커플여행', '가족여행', '우정여행', '혼행', '기념일'].map(p => (
              <button
                key={p}
                onClick={() => set('purpose', p)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition ${
                  form.purpose === p
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 바베큐 옵션 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">바베큐·장작 옵션</label>
          <div className="grid grid-cols-1 gap-2">
            {BBQ.map(b => (
              <button
                key={b}
                onClick={() => set('bbq', b)}
                className={`py-2.5 px-3.5 rounded-xl text-sm font-medium border transition text-left ${
                  form.bbq === b
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* 요청 사항 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">요청 사항 (선택)</label>
          <textarea
            value={form.request}
            onChange={e => set('request', e.target.value)}
            rows={3}
            placeholder="기념일 이벤트, 도착 시각, 알레르기 정보 등 자유롭게 작성해 주세요."
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
          <Info size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
          <p>체크인 3일 전까지 무료 취소 가능 · 이후 취소 시 1박 요금 위약금 발생 · 성수기(7~8월, 연휴) 별도 안내</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-black rounded-xl transition-colors text-sm shadow-md"
        >
          {submitting ? '예약 신청 중...' : '예약 신청하기'}
        </button>

        <p className="text-center text-xs text-gray-400">
          문의: 033-000-0000 · 운영시간 09:00~21:00
        </p>
      </div>
    </div>
  );
}
