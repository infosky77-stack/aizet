'use client';

import { useState } from 'react';
import { ScrollText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function today() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ArticlesPage() {
  const [form, setForm] = useState({
    companyName:       '',
    address:           '',
    purposes:          '',
    capital:           '',
    parValue:          '',
    totalShares:       '',
    authorizedShares:  '',
    ceoName:           '',
    incorporationDate: today(),
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [doneMsg,  setDoneMsg]  = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function set(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.companyName.trim())       e.companyName       = '회사 상호를 입력해 주세요.';
    if (!form.address.trim())           e.address           = '본점 소재지를 입력해 주세요.';
    if (!form.purposes.trim())          e.purposes          = '사업 목적을 입력해 주세요.';
    if (!form.capital.trim())           e.capital           = '자본금을 입력해 주세요.';
    if (!form.parValue.trim())          e.parValue          = '1주의 금액을 입력해 주세요.';
    if (!form.totalShares.trim())       e.totalShares       = '발행주식총수를 입력해 주세요.';
    if (!form.ceoName.trim())           e.ceoName           = '대표이사명을 입력해 주세요.';
    if (!form.incorporationDate.trim()) e.incorporationDate = '설립일을 입력해 주세요.';
    return e;
  }

  async function handleGenerate() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setDoneMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/legal/articles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error || 'PDF 생성에 실패했습니다.');
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safe = form.companyName.replace(/[^가-힣a-zA-Z0-9]/g, '');
      a.href     = url;
      a.download = `정관_${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDoneMsg('정관 PDF가 다운로드됩니다.');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setForm({
      companyName:       '주식회사 에이젯',
      address:           '서울특별시 강남구 테헤란로 123, 에이젯빌딩 5층',
      purposes:          '인공지능 기반 소프트웨어 개발 및 공급\n홈페이지 제작 및 호스팅 서비스\n전자상거래업',
      capital:           '100000000',
      parValue:          '5000',
      totalShares:       '20000',
      authorizedShares:  '80000',
      ceoName:           '김대표',
      incorporationDate: today(),
    });
    setErrors({});
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ScrollText size={20} className="text-cyan-600" />
          <h1 className="text-2xl font-black text-slate-900">정관 PDF 자동 생성</h1>
        </div>
        <p className="text-slate-600 text-sm">
          회사 기본 정보를 입력하면 주식회사 표준 정관 초안 PDF를 즉시 생성합니다.
        </p>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-cyan-800 font-medium">처음이신가요? 에이젯 예시 데이터로 먼저 테스트해 보세요.</p>
        <button onClick={loadSample}
          className="text-xs font-bold text-cyan-700 border border-cyan-300 bg-white px-3 py-1.5 rounded-xl hover:bg-cyan-50 transition-colors shrink-0">
          샘플 불러오기
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

        {/* 회사 기본 정보 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center">1</span>
            회사 기본 정보
          </legend>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              회사 상호 <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="주식회사 에이젯" value={form.companyName}
              onChange={e => set('companyName', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.companyName ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              본점 소재지 <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="서울특별시 강남구 테헤란로 123" value={form.address}
              onChange={e => set('address', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.address ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                설립일 <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.incorporationDate}
                onChange={e => set('incorporationDate', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.incorporationDate ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
              {errors.incorporationDate && <p className="text-red-500 text-xs mt-1">{errors.incorporationDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                대표이사명 <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="홍길동" value={form.ceoName}
                onChange={e => set('ceoName', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.ceoName ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
              {errors.ceoName && <p className="text-red-500 text-xs mt-1">{errors.ceoName}</p>}
            </div>
          </div>
        </fieldset>

        <hr className="border-slate-100" />

        {/* 사업 목적 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            사업 목적 <span className="text-red-500">*</span>
            <span className="font-normal text-slate-500 ml-1">(한 줄에 하나씩 입력, 자동 번호 부여)</span>
          </label>
          <textarea rows={5}
            placeholder={'인공지능 기반 소프트웨어 개발 및 공급\n홈페이지 제작 및 호스팅 서비스\n전자상거래업'}
            value={form.purposes}
            onChange={e => set('purposes', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none resize-none leading-relaxed transition-colors ${errors.purposes ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
          {errors.purposes && <p className="text-red-500 text-xs mt-1">{errors.purposes}</p>}
        </div>

        <hr className="border-slate-100" />

        {/* 주식 정보 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center">2</span>
            주식 정보
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                자본금 (원) <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="100000000" value={form.capital}
                onChange={e => set('capital', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.capital ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
              {errors.capital && <p className="text-red-500 text-xs mt-1">{errors.capital}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                1주의 금액 (원) <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="5000" value={form.parValue}
                onChange={e => set('parValue', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.parValue ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
              {errors.parValue && <p className="text-red-500 text-xs mt-1">{errors.parValue}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                발행주식총수 (주) <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="20000" value={form.totalShares}
                onChange={e => set('totalShares', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${errors.totalShares ? 'border-red-300' : 'border-slate-200 focus:border-slate-500'}`} />
              {errors.totalShares && <p className="text-red-500 text-xs mt-1">{errors.totalShares}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                발행예정주식총수 (주)
                <span className="font-normal text-slate-400 text-xs ml-1">미입력 시 4배 자동</span>
              </label>
              <input type="text" placeholder="80000" value={form.authorizedShares}
                onChange={e => set('authorizedShares', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none text-sm" />
            </div>
          </div>
        </fieldset>

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

        <button onClick={handleGenerate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-cyan-800 hover:from-slate-800 hover:to-cyan-900 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-md transition-all text-base">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> 정관 PDF 생성 중... (10~20초 소요)</>
            : <><Download size={18} /> 정관 PDF 생성</>}
        </button>

        <p className="text-center text-xs text-slate-500">
          ※ 생성되는 정관은 표준 양식 기반의 초안입니다. 실제 법인 설립 시에는 반드시 법무사 또는 법률 전문가의 검토를 받으시기 바랍니다.
        </p>
      </div>
    </div>
  );
}
