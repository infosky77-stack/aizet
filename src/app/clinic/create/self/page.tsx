'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Star, ImagePlus, Video, X,
  Sparkles, ChevronRight, Loader2, RefreshCw,
  Quote, FileText, Stethoscope, CheckCircle2,
} from 'lucide-react';
import { AizetLogo } from '@/components/AizetLogo';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface PreviewFile {
  id:   string;
  name: string;
  url:  string;
  type: 'image' | 'video';
}

interface AiResult {
  catchphrase:      string;
  intro:            string;
  itemDescriptions: { item: string; desc: string }[];
}

type PageState = 'form' | 'loading' | 'result' | 'error';

// ── 파일 썸네일 ────────────────────────────────────────────────────────────────

function FileThumbnail({ file, onRemove }: { file: PreviewFile; onRemove: () => void }) {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-stone-100 aspect-square">
      {file.type === 'image' ? (
        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-stone-200">
          <Video size={24} className="text-stone-500" />
          <span className="text-[10px] text-stone-500 px-1 truncate w-full text-center">
            {file.name}
          </span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={11} />
      </button>
    </div>
  );
}

// ── 로딩 화면 ─────────────────────────────────────────────────────────────────

function LoadingScreen({ shopName }: { shopName: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 shadow-md">
        <Loader2 size={32} className="text-amber-600 animate-spin" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">
        AI가 홈페이지를 만들고 있습니다
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-2">
        <span className="font-bold text-gray-700">{shopName}</span>에 맞는
        슬로건과 소개문을 생성 중…
      </p>
      <p className="text-xs text-stone-400">보통 10~20초 정도 걸립니다</p>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── 결과 화면 ─────────────────────────────────────────────────────────────────

function ResultScreen({
  shopName,
  result,
  onRetry,
}: {
  shopName:  string;
  result:    AiResult;
  onRetry:   () => void;
}) {
  return (
    <div className="py-2">

      {/* 완성 배지 */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
          <Sparkles size={16} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-stone-400"><AizetLogo className="font-black" /> · AI 생성 완료</p>
          <p className="text-base font-black text-gray-900">{shopName} 문구 미리보기</p>
        </div>
      </div>

      {/* 슬로건 */}
      <div className="rounded-2xl p-6 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #C9A227, #e0b83a)' }}>
        <div className="flex items-center gap-1.5 mb-3">
          <Quote size={13} className="text-white/70" />
          <p className="text-xs font-bold text-white/80 uppercase tracking-wide">AI 슬로건</p>
        </div>
        <p className="text-xl font-black text-white leading-snug">
          {result.catchphrase}
        </p>
      </div>

      {/* 소개문 */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <FileText size={14} className="text-stone-400" />
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">AI 소개문</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{result.intro}</p>
      </div>

      {/* 진료 항목 설명 */}
      {result.itemDescriptions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-4">
            <Stethoscope size={14} className="text-stone-400" />
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">진료 항목 설명</p>
          </div>
          <div className="space-y-3">
            {result.itemDescriptions.map(({ item, desc }) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 size={15} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{item}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800 leading-relaxed">
        ✦ 위 문구는 AI 초안입니다. 홈페이지 완성 후 자유롭게 수정하실 수 있습니다.
      </div>

      {/* 다음 단계 버튼 */}
      <button
        disabled
        className="w-full py-4 rounded-xl font-bold text-sm mb-3 flex items-center justify-center gap-2 cursor-not-allowed"
        style={{ background: '#e5e7eb', color: '#9ca3af' }}
      >
        <Sparkles size={15} />
        이 문구로 홈페이지 완성하기
        <span className="text-xs font-normal">(다음 단계 준비 중)</span>
      </button>

      {/* 다시 작성 */}
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-xl font-bold text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} />
        처음부터 다시 작성하기
      </button>
    </div>
  );
}

// ── 에러 화면 ─────────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-lg font-black text-gray-900 mb-2">AI 생성 중 오류가 발생했습니다</h2>
      <p className="text-sm text-stone-500 mb-6 max-w-xs leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
        style={{ background: '#C9A227' }}
      >
        <RefreshCw size={14} />
        다시 시도하기
      </button>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function ClinicCreateSelfPage() {
  const [pageState, setPageState] = useState<PageState>('form');
  const [form, setForm] = useState({
    shopName:   '',
    doctorName: '',
    phone:      '',
    address:    '',
    hours:      '',
    specialty:  '',
    intro:      '',
  });
  const [files,    setFiles]    = useState<PreviewFile[]>([]);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addFiles(raw: FileList | null, type: 'image' | 'video') {
    if (!raw) return;
    const added: PreviewFile[] = Array.from(raw).map(f => ({
      id:   `${Date.now()}-${Math.random()}`,
      name: f.name,
      url:  URL.createObjectURL(f),
      type,
    }));
    setFiles(prev => [...prev, ...added]);
  }

  function removeFile(id: string) {
    setFiles(prev => {
      const t = prev.find(f => f.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter(f => f.id !== id);
    });
  }

  async function handleGenerate() {
    if (!canSubmit) return;
    setPageState('loading');
    setErrorMsg('');

    // 특화 진료 → items 배열로 변환
    const items = form.specialty
      ? form.specialty.split(/[,、·\s]+/).map(s => s.trim()).filter(Boolean)
      : [];

    // 원장명 + 소개 → extra
    const extraParts = [
      form.doctorName ? `원장: ${form.doctorName}` : '',
      form.intro      ? `원장 소개: ${form.intro}`  : '',
    ].filter(Boolean);

    try {
      const res = await fetch('/api/admin/site-ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          industry: '한의원',
          shopName: form.shopName.trim(),
          phone:    form.phone    || undefined,
          address:  form.address  || undefined,
          hours:    form.hours    || undefined,
          items:    items.length  > 0 ? items : undefined,
          extra:    extraParts.length > 0 ? extraParts.join(' / ') : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `오류 ${res.status}`);
      }

      const data = await res.json() as AiResult;
      setAiResult(data);
      setPageState('result');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'AI 생성 중 오류가 발생했습니다.');
      setPageState('error');
    }
  }

  function handleRetry() {
    setPageState('form');
    setAiResult(null);
    setErrorMsg('');
  }

  const imageCount = files.filter(f => f.type === 'image').length;
  const videoCount = files.filter(f => f.type === 'video').length;
  const canSubmit  = form.shopName.trim().length > 0;

  return (
    <div className="bg-gradient-to-b from-amber-50 via-white to-stone-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 pt-8 pb-28">

        {/* ── 상단 헤더 ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/clinic/create"
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-stone-400">
              <AizetLogo className="font-black" /> · 한의원 홈페이지 만들기
            </p>
            <h1 className="text-lg font-black text-gray-900">직접 만들기</h1>
          </div>
        </div>

        {/* ── 상태별 콘텐츠 ────────────────────────────────────── */}

        {pageState === 'loading' && <LoadingScreen shopName={form.shopName} />}

        {pageState === 'result' && aiResult && (
          <ResultScreen
            shopName={form.shopName}
            result={aiResult}
            onRetry={handleRetry}
          />
        )}

        {pageState === 'error' && (
          <ErrorScreen message={errorMsg} onRetry={handleRetry} />
        )}

        {pageState === 'form' && (
          <>
            {/* 사진 강조 배너 */}
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl rounded-l-sm px-4 py-4 mb-8 flex gap-3">
              <Star size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                될 수 있는 한 사진과 동영상을{' '}
                <strong className="underline underline-offset-2 decoration-amber-400">많이</strong>{' '}
                올려주시면, 고객님의 사이트가 더욱더 개성 있고 멋있게 표현됩니다.
              </p>
            </div>

            {/* 섹션 1: 기본 정보 */}
            <section className="mb-10">
              <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: '#C9A227' }}>1</span>
                기본 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    한의원 이름 <span style={{ color: '#C9A227' }}>*</span>
                  </label>
                  <input
                    type="text" name="shopName" value={form.shopName}
                    onChange={handleChange} placeholder="예: 자연한의원"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-base focus:outline-none"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                    onBlur={e  => e.target.style.boxShadow = ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">원장 이름</label>
                    <input
                      type="text" name="doctorName" value={form.doctorName}
                      onChange={handleChange} placeholder="예: 박영숙 원장"
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none"
                      onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                      onBlur={e  => e.target.style.boxShadow = ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">전화번호</label>
                    <input
                      type="tel" name="phone" value={form.phone}
                      onChange={handleChange} placeholder="예: 02-1234-5678"
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none"
                      onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                      onBlur={e  => e.target.style.boxShadow = ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">주소</label>
                  <input
                    type="text" name="address" value={form.address}
                    onChange={handleChange} placeholder="예: 서울시 강남구 역삼동 123-45"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                    onBlur={e  => e.target.style.boxShadow = ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">진료 시간</label>
                  <input
                    type="text" name="hours" value={form.hours}
                    onChange={handleChange} placeholder="예: 평일 09:00~18:00, 토 09:00~13:00, 일 휴진"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                    onBlur={e  => e.target.style.boxShadow = ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">특화 진료</label>
                  <input
                    type="text" name="specialty" value={form.specialty}
                    onChange={handleChange} placeholder="예: 담적, 소아, 부인과, 만성피로"
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                    onBlur={e  => e.target.style.boxShadow = ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    간단 소개{' '}
                    <span className="text-xs font-normal text-stone-400">선택 — 비워두면 AI가 채워드립니다</span>
                  </label>
                  <textarea
                    name="intro" value={form.intro} rows={3}
                    onChange={handleChange}
                    placeholder="한의원의 강점이나 특징을 자유롭게 적어 주세요."
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-gray-900 placeholder-stone-300 text-sm focus:outline-none resize-none leading-relaxed"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #C9A22740'}
                    onBlur={e  => e.target.style.boxShadow = ''}
                  />
                </div>
              </div>
            </section>

            {/* 섹션 2: 사진·동영상 업로드 */}
            <section className="mb-10">
              <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: '#C9A227' }}>2</span>
                사진·동영상 올리기
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => addFiles(e.target.files, 'image')} />
                <button onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <ImagePlus size={20} className="text-amber-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-amber-800">사진 올리기</p>
                    <p className="text-xs text-amber-600 mt-0.5">여러 장 선택 가능</p>
                  </div>
                </button>

                <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden"
                  onChange={e => addFiles(e.target.files, 'video')} />
                <button onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Video size={20} className="text-stone-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-stone-700">동영상 올리기</p>
                    <p className="text-xs text-stone-500 mt-0.5">여러 개 선택 가능</p>
                  </div>
                </button>
              </div>

              {files.length > 0 && (
                <p className="text-xs text-stone-500 mb-3 text-right">
                  사진 {imageCount}장 · 동영상 {videoCount}개 선택됨
                </p>
              )}
              {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {files.map(f => (
                    <FileThumbnail key={f.id} file={f} onRemove={() => removeFile(f.id)} />
                  ))}
                </div>
              )}
              {files.length === 0 && (
                <p className="text-center text-xs text-stone-400 py-4">
                  사진이 많을수록 더 개성 있는 홈페이지가 만들어집니다 ✦
                </p>
              )}
            </section>
          </>
        )}

        {/* ── 하단 고정 버튼 (폼 상태에서만 표시) ─────────────── */}
        {pageState === 'form' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-stone-100 px-4 py-4 z-50">
            <div className="max-w-xl mx-auto flex items-center gap-3">
              <div className="flex-1 min-w-0">
                {!canSubmit ? (
                  <p className="text-xs text-stone-400">한의원 이름을 입력해 주세요</p>
                ) : (
                  <p className="text-xs text-stone-500 truncate">
                    <span className="font-bold text-gray-800">{form.shopName}</span>
                    {files.length > 0 && ` · 파일 ${files.length}개`}
                  </p>
                )}
              </div>
              <button
                disabled={!canSubmit}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={canSubmit
                  ? { background: 'linear-gradient(135deg, #C9A227, #e0b83a)', color: '#fff' }
                  : { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' }}
              >
                <Sparkles size={15} />
                AI로 홈페이지 만들기
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
