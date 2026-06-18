'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Tag, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { LabelCountry } from '@/types/print-files';

const COUNTRIES: { code: LabelCountry; name: string; flag: string; cert?: string }[] = [
  { code: 'US', name: '미국 (USA)', flag: '🇺🇸' },
  { code: 'EU', name: '유럽 (EU)', flag: '🇪🇺', cert: 'CE' },
  { code: 'JP', name: '일본', flag: '🇯🇵', cert: 'PSE' },
  { code: 'CN', name: '중국', flag: '🇨🇳', cert: 'CCC' },
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'AU', name: '호주', flag: '🇦🇺', cert: 'RCM' },
];

interface FormData {
  productName: string;
  modelNumber: string;
  quantity: string;
  origin: string;
  boxL: string;
  boxW: string;
  boxH: string;
  weight: string;
  country: LabelCountry;
}

const INITIAL: FormData = {
  productName: '',
  modelNumber: '',
  quantity: '',
  origin: 'Made in Korea',
  boxL: '',
  boxW: '',
  boxH: '',
  weight: '',
  country: 'US',
};

function InputField({ label, value, onChange, placeholder, type = 'text', required = true }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-stone-600 mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-blue-400 focus:outline-none text-sm transition-colors"
      />
    </div>
  );
}

export default function LabelsPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [labelId, setLabelId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof FormData) => (value: string) => setForm(p => ({ ...p, [key]: value }));

  const canGenerate = form.productName && form.modelNumber && form.quantity && form.origin
    && form.boxL && form.boxW && form.boxH && form.weight;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch('/api/print/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            productName: form.productName,
            modelNumber: form.modelNumber,
            quantity: parseInt(form.quantity),
            origin: form.origin,
            boxL: parseFloat(form.boxL),
            boxW: parseFloat(form.boxW),
            boxH: parseFloat(form.boxH),
            weight: parseFloat(form.weight),
            country: form.country,
          },
        }),
      });
      const { label } = await res.json();
      setSvgContent(label.svgContent);
      setLabelId(label.id);
      setSaved(true);
    } finally {
      setGenerating(false);
    }
  }, [form, canGenerate]);

  function handleDownloadSVG() {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${form.productName}-${form.country}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedCountry = COUNTRIES.find(c => c.code === form.country)!;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <Tag size={18} className="text-blue-600" />
          <h1 className="font-bold text-stone-800">수출 박스 라벨 생성기</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Left — form */}
        <div className="w-96 shrink-0 flex flex-col gap-4">
          {/* Country selector */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-bold text-stone-700 mb-3">수출 대상 국가</h2>
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setForm(p => ({ ...p, country: c.code }))}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all',
                    form.country === c.code
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-stone-100 hover:border-stone-200'
                  )}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-[10px] font-medium text-stone-600 leading-tight">{c.name}</span>
                  {c.cert && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.cert}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-stone-700">제품 정보</h2>
            <InputField label="제품명" value={form.productName} onChange={set('productName')} placeholder="USB Hub" />
            <InputField label="모델번호" value={form.modelNumber} onChange={set('modelNumber')} placeholder="UH-200" />
            <InputField label="수량 (PCS)" value={form.quantity} onChange={set('quantity')} placeholder="500" type="number" />
            <InputField label="원산지" value={form.origin} onChange={set('origin')} placeholder="Made in Korea" />
          </div>

          {/* Box info */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-stone-700">박스 치수 / 중량</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['boxL', 'boxW', 'boxH'] as const).map((key, i) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-stone-500 mb-1 block">{['가로(cm)', '세로(cm)', '높이(cm)'][i]}</label>
                  <input type="number" value={form[key]} onChange={e => set(key)(e.target.value)} placeholder="30" className="w-full px-2.5 py-2 rounded-xl border border-stone-200 focus:border-blue-400 focus:outline-none text-sm" />
                </div>
              ))}
            </div>
            <InputField label="중량 (kg)" value={form.weight} onChange={set('weight')} placeholder="5.0" type="number" />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400 transition-colors flex items-center justify-center gap-2"
          >
            {generating ? <><RefreshCw size={16} className="animate-spin" />생성 중...</> : <><Tag size={16} />라벨 생성</>}
          </button>

          {saved && labelId && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
              <CheckCircle size={14} />
              라벨 저장 완료 (ID: {labelId})
            </div>
          )}
        </div>

        {/* Right — preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-700">미리보기</h2>
              {svgContent && (
                <button
                  onClick={handleDownloadSVG}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors"
                >
                  <Download size={12} />SVG 다운로드
                </button>
              )}
            </div>

            {!svgContent ? (
              <div className="rounded-xl bg-stone-50 border-2 border-dashed border-stone-200 h-72 flex flex-col items-center justify-center text-stone-400">
                <Tag size={32} className="mb-3 opacity-30" />
                <p className="text-sm">왼쪽 정보를 입력하고</p>
                <p className="text-sm">라벨 생성 버튼을 클릭하세요</p>
                <p className="text-xs mt-2 text-stone-300">
                  {selectedCountry.flag} {selectedCountry.name} 양식{selectedCountry.cert ? ` (${selectedCountry.cert} 인증)` : ''}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl overflow-hidden border border-stone-100 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
                <div className="bg-stone-50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-stone-600 mb-2">라벨 정보</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      ['국가', `${selectedCountry.flag} ${selectedCountry.name}`],
                      ['제품명', form.productName],
                      ['모델번호', form.modelNumber],
                      ['수량', `${parseInt(form.quantity).toLocaleString()} PCS`],
                      ['원산지', form.origin],
                      ['박스 치수', `${form.boxL}×${form.boxW}×${form.boxH} cm`],
                      ['중량', `${form.weight} kg`],
                      ...(selectedCountry.cert ? [['인증', selectedCountry.cert]] : []),
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-stone-400">{k}</p>
                        <p className="text-xs font-medium text-stone-700">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
