'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Tag, Download, RefreshCw, CheckCircle,
  PenLine, Save, RotateCcw, Building2, FolderOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { LabelCountry, LabelData, Client } from '@/types/print-files';
import { generateLabelSVG, getDefaultOverrides, LabelOverrides } from '@/lib/print/label-svg';

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

// ── Shared editor UI components ───────────────────────────────────────────────

function InputField({ label, value, onChange, placeholder, type = 'text', required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
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

function SliderControl({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-stone-600">{label}</span>
        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-blue-500 cursor-pointer"
      />
    </div>
  );
}

function ColorControl({ label, desc, value, onChange }: {
  label: string; desc?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-stone-200 cursor-pointer shrink-0">
        <div className="absolute inset-0" style={{ background: value }} />
        <input
          type="color" value={value} onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-700">{label}</p>
        {desc && <p className="text-[10px] text-stone-400">{desc}</p>}
        <p className="text-[10px] font-mono text-stone-500 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [labelId, setLabelId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'form' | 'editor'>('form');
  const [editorTab, setEditorTab] = useState<'text' | 'layout' | 'color'>('text');
  const [overrides, setOverrides] = useState<LabelOverrides>({});
  const [saving, setSaving] = useState(false);
  const [editSaved, setEditSaved] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [saveClientId, setSaveClientId] = useState('');
  const [clientSaved, setClientSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/print/clients')
      .then(r => r.json())
      .then(d => setClients(d.clients ?? []));
  }, []);

  const set = (key: keyof FormData) => (value: string) => setForm(p => ({ ...p, [key]: value }));

  const canGenerate = !!(
    form.productName && form.modelNumber && form.quantity && form.origin
    && form.boxL && form.boxW && form.boxH && form.weight
  );

  const liveData = useMemo<LabelData>(() => ({
    productName: form.productName || 'Product',
    modelNumber: form.modelNumber || 'MODEL',
    quantity: parseInt(form.quantity) || 0,
    origin: form.origin || 'Made in Korea',
    boxL: parseFloat(form.boxL) || 0,
    boxW: parseFloat(form.boxW) || 0,
    boxH: parseFloat(form.boxH) || 0,
    weight: parseFloat(form.weight) || 0,
    country: form.country,
  }), [form]);

  const displaySvg = mode === 'editor'
    ? generateLabelSVG(liveData, overrides)
    : svgContent;

  const defaults = getDefaultOverrides(form.country);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setSvgContent(null);
    try {
      const res = await fetch('/api/print/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: liveData }),
      });
      const { label } = await res.json();
      setSvgContent(label.svgContent);
      setLabelId(label.id);
    } finally {
      setGenerating(false);
    }
  };

  const handleEnterEditor = () => {
    setOverrides(getDefaultOverrides(form.country));
    setEditSaved(null);
    setEditorTab('text');
    setMode('editor');
  };

  const handleDownload = () => {
    const svg = displaySvg;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${form.productName || 'label'}-${form.country}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    const svg = generateLabelSVG(liveData, overrides);
    setSaving(true);
    setClientSaved(null);
    try {
      const res = await fetch('/api/print/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: liveData,
          svgContent: svg,
          product: form.productName,
          clientId: saveClientId || undefined,
        }),
      });
      const { label, clientFile } = await res.json();
      setEditSaved(label.id);
      setLabelId(label.id);
      if (clientFile) {
        const c = clients.find(c => c.id === saveClientId);
        setClientSaved(c?.company ?? saveClientId);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToClientFromForm = async () => {
    if (!saveClientId || !svgContent) return;
    setSaving(true);
    setClientSaved(null);
    try {
      const res = await fetch('/api/print/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: liveData,
          svgContent,
          product: form.productName,
          clientId: saveClientId,
        }),
      });
      const { clientFile } = await res.json();
      if (clientFile) {
        const c = clients.find(c => c.id === saveClientId);
        setClientSaved(c?.company ?? saveClientId);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.code === form.country)!;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <Tag size={18} className="text-blue-600" />
          <h1 className="font-bold text-stone-800">수출 박스 라벨 생성기</h1>
          {mode === 'editor' && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">슈퍼에디터</span>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 lg:items-start">

        {/* ──────── LEFT PANEL ──────── */}
        {mode === 'form' ? (
          <div className="w-full lg:w-96 lg:shrink-0 flex flex-col gap-4">
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
                    <input type="number" value={form[key]} onChange={e => set(key)(e.target.value)} placeholder="30"
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-200 focus:border-blue-400 focus:outline-none text-sm" />
                  </div>
                ))}
              </div>
              <InputField label="중량 (kg)" value={form.weight} onChange={set('weight')} placeholder="5.0" type="number" />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400 transition-colors flex items-center justify-center gap-2"
            >
              {generating
                ? <><RefreshCw size={16} className="animate-spin" />생성 중...</>
                : <><Tag size={16} />라벨 생성</>}
            </button>

            {labelId && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
                <CheckCircle size={14} />
                라벨 생성 완료 (ID: {labelId})
              </div>
            )}

            {/* 거래처 파일 저장 (폼 모드) */}
            {svgContent && (
              <div className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <FolderOpen size={13} className="text-blue-500" />
                  <p className="text-xs font-bold text-stone-700">거래처 파일 관리에 저장</p>
                </div>
                <select
                  value={saveClientId}
                  onChange={e => { setSaveClientId(e.target.value); setClientSaved(null); }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">거래처 선택...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.countryCode})</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveToClientFromForm}
                  disabled={!saveClientId || saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold transition-colors"
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Building2 size={13} />}
                  파일 관리에 저장
                </button>
                {clientSaved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                    <CheckCircle size={12} />
                    {clientSaved} 폴더에 저장됨
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ──────── EDITOR PANEL ──────── */
          <div className="w-full lg:w-96 lg:shrink-0 flex flex-col gap-4">
            {/* Back button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('form')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 text-xs hover:bg-stone-50 transition-colors"
              >
                <ChevronLeft size={14} />
                폼으로 돌아가기
              </button>
              <span className="text-[11px] text-stone-400">편집 내용은 보존됩니다</span>
            </div>

            {/* Tab bar */}
            <div className="flex rounded-xl border border-stone-200 bg-stone-50 p-1 gap-1">
              {([
                { id: 'text', label: '텍스트' },
                { id: 'layout', label: '위치/크기' },
                { id: 'color', label: '색상' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setEditorTab(t.id)}
                  className={clsx(
                    'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                    editorTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── 텍스트 탭 ── */}
            {editorTab === 'text' && (
              <div className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">텍스트 내용 편집</p>
                <InputField label="제품명" value={form.productName} onChange={set('productName')} placeholder="USB Hub" />
                <InputField label="모델번호" value={form.modelNumber} onChange={set('modelNumber')} placeholder="UH-200" />
                <InputField label="원산지" value={form.origin} onChange={set('origin')} placeholder="Made in Korea" />
                <div>
                  <label className="text-xs font-semibold text-stone-600 mb-1.5 block">경고 문구</label>
                  <input
                    value={overrides.warningText ?? defaults.warningText}
                    onChange={e => setOverrides(p => ({ ...p, warningText: e.target.value }))}
                    placeholder="경고 문구"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-blue-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── 위치/크기 탭 ── */}
            {editorTab === 'layout' && (
              <div className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-4">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">위치 / 크기 조정</p>

                <SliderControl
                  label="제품명 글자 크기"
                  value={overrides.productNameSize ?? defaults.productNameSize}
                  min={10} max={26}
                  onChange={v => setOverrides(p => ({ ...p, productNameSize: v }))}
                  unit="px"
                />
                <SliderControl
                  label="제품명 Y 위치"
                  value={overrides.productNameY ?? defaults.productNameY}
                  min={52} max={88}
                  onChange={v => setOverrides(p => ({ ...p, productNameY: v }))}
                />

                <div className="border-t border-stone-100 pt-3 flex flex-col gap-4">
                  <p className="text-[10px] font-semibold text-stone-400">컬럼 X 위치</p>
                  <SliderControl
                    label="왼쪽 컬럼 X"
                    value={overrides.col1X ?? defaults.col1X}
                    min={8} max={40}
                    onChange={v => setOverrides(p => ({ ...p, col1X: v }))}
                  />
                  <SliderControl
                    label="오른쪽 컬럼 X"
                    value={overrides.col2X ?? defaults.col2X}
                    min={120} max={220}
                    onChange={v => setOverrides(p => ({ ...p, col2X: v }))}
                  />
                </div>

                <div className="border-t border-stone-100 pt-3 flex flex-col gap-4">
                  <p className="text-[10px] font-semibold text-stone-400">바코드 위치</p>
                  <SliderControl
                    label="바코드 X"
                    value={overrides.barcodeX ?? defaults.barcodeX}
                    min={0} max={80}
                    onChange={v => setOverrides(p => ({ ...p, barcodeX: v }))}
                  />
                  <SliderControl
                    label="바코드 Y"
                    value={overrides.barcodeY ?? defaults.barcodeY}
                    min={185} max={215}
                    onChange={v => setOverrides(p => ({ ...p, barcodeY: v }))}
                  />
                </div>
              </div>
            )}

            {/* ── 색상 탭 ── */}
            {editorTab === 'color' && (
              <div className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">색상 설정</p>
                <ColorControl
                  label="헤더 배경색" desc="상단 바 배경"
                  value={overrides.headerBg ?? defaults.headerBg}
                  onChange={v => setOverrides(p => ({ ...p, headerBg: v }))}
                />
                <ColorControl
                  label="강조색" desc="헤더 텍스트 · 인증 마크"
                  value={overrides.accentColor ?? defaults.accentColor}
                  onChange={v => setOverrides(p => ({ ...p, accentColor: v }))}
                />
                <ColorControl
                  label="본문 텍스트색" desc="제품명 · 필드값"
                  value={overrides.bodyText ?? defaults.bodyText}
                  onChange={v => setOverrides(p => ({ ...p, bodyText: v }))}
                />
                <ColorControl
                  label="라벨 텍스트색" desc="필드 레이블 (연한 색)"
                  value={overrides.labelText ?? defaults.labelText}
                  onChange={v => setOverrides(p => ({ ...p, labelText: v }))}
                />
                <button
                  onClick={() => setOverrides(getDefaultOverrides(form.country))}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 text-xs transition-colors"
                >
                  <RotateCcw size={11} />
                  국가 기본값으로 초기화
                </button>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex flex-col gap-2">
              {/* Client selector for file save */}
              <div>
                <label className="text-xs font-semibold text-stone-600 mb-1.5 block flex items-center gap-1">
                  <FolderOpen size={11} className="text-blue-500" />
                  저장할 거래처
                </label>
                <select
                  value={saveClientId}
                  onChange={e => { setSaveClientId(e.target.value); setClientSaved(null); setEditSaved(null); }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">거래처 선택 (없으면 일반 저장)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.countryCode})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
                >
                  <Download size={14} />
                  SVG 다운로드
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white text-sm font-semibold transition-colors"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {saveClientId ? '거래처 폴더에 저장' : '라벨 저장'}
                </button>
              </div>
              {editSaved && !clientSaved && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
                  <CheckCircle size={14} />
                  저장 완료 · {form.productName} 폴더 (ID: {editSaved})
                </div>
              )}
              {clientSaved && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
                  <CheckCircle size={14} />
                  {clientSaved} 파일 관리에 저장됨
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────── RIGHT: PREVIEW PANEL ──────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-stone-700">
                {mode === 'editor' ? '실시간 미리보기' : '미리보기'}
              </h2>
              <div className="flex gap-2">
                {mode === 'form' && svgContent && (
                  <button
                    onClick={handleEnterEditor}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    <PenLine size={12} />
                    직접 편집하기
                  </button>
                )}
                {displaySvg && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors"
                  >
                    <Download size={12} />
                    SVG 다운로드
                  </button>
                )}
              </div>
            </div>

            {!displaySvg ? (
              <div className="rounded-xl bg-stone-50 border-2 border-dashed border-stone-200 h-72 flex flex-col items-center justify-center text-stone-400">
                <Tag size={32} className="mb-3 opacity-30" />
                <p className="text-sm">왼쪽 정보를 입력하고</p>
                <p className="text-sm">라벨 생성 버튼을 클릭하세요</p>
                <p className="text-xs mt-2 text-stone-300">
                  {selectedCountry.flag} {selectedCountry.name} 양식
                  {selectedCountry.cert ? ` (${selectedCountry.cert} 인증)` : ''}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl overflow-hidden border border-stone-100 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: displaySvg }}
                />
                {mode === 'editor' && (
                  <p className="text-[10px] text-stone-400 text-center">
                    변경 즉시 반영됩니다 · 저장 시 거래처 폴더에 자동 분류
                  </p>
                )}
                {mode === 'form' && (
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
