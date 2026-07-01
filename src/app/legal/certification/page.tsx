'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function today() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SAMPLE_CONTENT = `1. 발신인은 수신인과 2025년 3월 1일 체결한 임대차계약(이하 "본 계약")에 따라 이 내용증명을 발송합니다.

2. 본 계약에 따르면 수신인은 2025년 9월 1일까지 임대보증금 50,000,000원을 반환할 의무가 있습니다.

3. 그러나 수신인은 위 기한이 도과하였음에도 불구하고 현재까지 임대보증금을 반환하지 않고 있습니다.

4. 이에 발신인은 본 내용증명 수령일로부터 7일 이내에 위 임대보증금 전액을 반환할 것을 촉구합니다.

5. 만약 위 기한 내에 반환하지 아니할 경우, 발신인은 법적 절차를 통해 임대보증금의 반환을 구할 것임을 알려드립니다.`;

export default function CertificationPage() {
  const [form, setForm] = useState({
    senderName:       '',
    senderAddress:    '',
    recipientName:    '',
    recipientAddress: '',
    subject:          '',
    content:          '',
    date:             today(),
  });
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [loading,   setLoading]   = useState(false);
  const [doneMsg,   setDoneMsg]   = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  function set(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.senderName.trim())    e.senderName    = '발신인 이름을 입력해 주세요.';
    if (!form.recipientName.trim()) e.recipientName = '수신인 이름을 입력해 주세요.';
    if (!form.subject.trim())       e.subject       = '제목을 입력해 주세요.';
    if (!form.content.trim())       e.content       = '본문 내용을 입력해 주세요.';
    return e;
  }

  async function handleGenerate() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setDoneMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/legal/certification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error || 'PDF 생성에 실패했습니다.');
        return;
      }

      // Blob으로 받아서 다운로드
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safe = form.date.replace(/[^가-힣0-9]/g, '');
      a.href     = url;
      a.download = `내용증명_${form.senderName}_${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDoneMsg('PDF가 다운로드됩니다.');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setForm({
      senderName:       '홍길동',
      senderAddress:    '서울시 강남구 테헤란로 123, 101동 1001호',
      recipientName:    '김임대',
      recipientAddress: '서울시 서초구 반포대로 456, 상가 201호',
      subject:          '임대보증금 반환 촉구',
      content:          SAMPLE_CONTENT,
      date:             today(),
    });
    setErrors({});
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={20} className="text-cyan-600" />
          <h1 className="text-2xl font-black text-slate-900">내용증명 PDF 생성</h1>
        </div>
        <p className="text-slate-600 text-sm">
          발신인·수신인 정보와 내용을 입력하면 내용증명 PDF를 즉시 생성합니다.
        </p>
      </div>

      {/* 샘플 불러오기 */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-cyan-800 font-medium">처음이신가요? 샘플 내용으로 먼저 테스트해 보세요.</p>
        <button onClick={loadSample}
          className="text-xs font-bold text-cyan-700 border border-cyan-300 bg-white px-3 py-1.5 rounded-xl hover:bg-cyan-50 transition-colors shrink-0">
          샘플 불러오기
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

        {/* 발신인 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center">발</span>
            발신인 정보
          </legend>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="홍길동" value={form.senderName}
              onChange={e => set('senderName', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.senderName ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
            {errors.senderName && <p className="text-red-500 text-xs mt-1">{errors.senderName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">주소</label>
            <input type="text" placeholder="서울시 강남구 테헤란로 123, 101동 1001호" value={form.senderAddress}
              onChange={e => set('senderAddress', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm" />
          </div>
        </fieldset>

        <hr className="border-slate-100" />

        {/* 수신인 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center">수</span>
            수신인 정보
          </legend>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="김임대" value={form.recipientName}
              onChange={e => set('recipientName', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.recipientName ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
            {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">주소</label>
            <input type="text" placeholder="서울시 서초구 반포대로 456, 상가 201호" value={form.recipientAddress}
              onChange={e => set('recipientAddress', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm" />
          </div>
        </fieldset>

        <hr className="border-slate-100" />

        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <input type="text" placeholder="임대보증금 반환 촉구" value={form.subject}
            onChange={e => set('subject', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.subject ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>

        {/* 본문 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            본문 내용 <span className="text-red-500">*</span>
          </label>
          <textarea rows={10} placeholder="내용증명 본문을 입력하세요." value={form.content}
            onChange={e => set('content', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none resize-none leading-relaxed transition-colors ${errors.content ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
        </div>

        {/* 작성일 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">작성일</label>
          <input type="text" value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm" />
        </div>

        {/* 결과 메시지 */}
        {doneMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium">
            <CheckCircle size={16} className="shrink-0" /> {doneMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* 생성 버튼 */}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-cyan-800 hover:from-slate-800 hover:to-cyan-900 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-md transition-all text-base">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> PDF 생성 중... (10~20초 소요)</>
            : <><Download size={18} /> 내용증명 PDF 생성</>}
        </button>

        <p className="text-center text-xs text-slate-500">
          ※ 데모 화면 — 생성된 PDF는 법적 효력이 없으며 참고용입니다.
        </p>
      </div>
    </div>
  );
}
