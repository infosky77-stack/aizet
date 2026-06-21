'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle, Clock, Phone } from 'lucide-react';

const TOPICS = ['종합소득세', '부가가치세', '법인세', '원천세·급여', '절세 전략', '세무조사 대응', '창업 세무', '기타'];
const BUSINESS_TYPES = ['개인사업자', '법인', '프리랜서·개인', '스타트업', '기타'];
const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function TaxReservationPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', businessType: '', topic: '', date: '', time: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '이름을 입력해 주세요.';
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) e.phone = '올바른 휴대폰 번호를 입력해 주세요.';
    if (!form.topic) e.topic = '상담 주제를 선택해 주세요.';
    if (!form.date) e.date = '날짜를 선택해 주세요.';
    if (!form.time) e.time = '시간을 선택해 주세요.';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await fetch('/api/tax/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">예약이 완료되었습니다!</h1>
        <p className="text-slate-500 text-sm mb-2">빠른 시일 내에 담당 세무사가 연락드립니다.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-600 text-left mt-4 mb-8 space-y-1.5">
          <p><span className="font-semibold">성함:</span> {form.name}</p>
          <p><span className="font-semibold">상담 주제:</span> {form.topic}</p>
          <p><span className="font-semibold">예약 일시:</span> {form.date} {form.time}</p>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          ⚠️ 이 화면은 데모입니다. 실제 예약이 이루어지지 않습니다.
        </p>
        <button onClick={() => { setDone(false); setForm({ name:'',phone:'',email:'',businessType:'',topic:'',date:'',time:'',note:'' }); }}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors">
          새 예약하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock size={20} className="text-amber-600" />
          <h1 className="text-2xl font-black text-slate-900">상담 예약</h1>
        </div>
        <p className="text-slate-500 text-sm">전문 세무사와 1:1 맞춤 세무 상담을 예약하세요</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-blue-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-blue-800">상담 시간</div>
            <div className="text-xs text-blue-600">50분 / 회</div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <Phone size={20} className="text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-800">긴급 문의</div>
            <div className="text-xs text-emerald-600">02-1234-5678</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">성함 <span className="text-red-500">*</span></label>
          <input type="text" placeholder="홍길동" value={form.name}
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-500'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">휴대폰 <span className="text-red-500">*</span></label>
          <input type="tel" placeholder="010-1234-5678" value={form.phone}
            onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${errors.phone ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-500'}`} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">이메일 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
          <input type="email" placeholder="example@email.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm" />
        </div>

        {/* 사업 형태 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">사업 형태</label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, businessType: t }))}
                className={`text-sm px-4 py-2 rounded-xl border-2 font-medium transition-all ${form.businessType === t ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 상담 주제 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">상담 주제 <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => { setForm(p => ({ ...p, topic: t })); setErrors(p => ({ ...p, topic: '' })); }}
                className={`text-sm px-4 py-2 rounded-xl border-2 font-medium transition-all ${form.topic === t ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                {t}
              </button>
            ))}
          </div>
          {errors.topic && <p className="text-red-500 text-xs mt-1">{errors.topic}</p>}
        </div>

        {/* 날짜·시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">날짜 <span className="text-red-500">*</span></label>
            <input type="date" min={getMinDate()} value={form.date}
              onChange={e => { setForm(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, date: '' })); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${errors.date ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">시간 <span className="text-red-500">*</span></label>
            <select value={form.time} onChange={e => { setForm(p => ({ ...p, time: e.target.value })); setErrors(p => ({ ...p, time: '' })); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none bg-white transition-colors ${errors.time ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`}>
              <option value="">시간 선택</option>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">추가 문의사항 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
          <textarea rows={3} placeholder="미리 준비해야 할 서류나 궁금한 점을 남겨주세요." value={form.note}
            onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm resize-none" />
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-800 hover:to-blue-900 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-md transition-all text-base">
          {submitting ? '예약 중...' : '상담 예약하기'}
        </button>
        <p className="text-center text-[10px] text-slate-400">※ 데모 화면 – 실제 예약이 이루어지지 않습니다</p>
      </div>
    </div>
  );
}
