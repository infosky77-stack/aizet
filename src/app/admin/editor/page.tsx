'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Loader2,
  RefreshCw, ExternalLink, Eye, EyeOff, Palette,
} from 'lucide-react';
import type { SiteConfig } from '@/lib/siteConfig';

const THEME_OPTIONS = [
  { key: '',        label: '업종 기본',  color: 'bg-stone-400'   },
  { key: 'amber',   label: '앰버',       color: 'bg-amber-500'   },
  { key: 'rose',    label: '로즈',       color: 'bg-rose-500'    },
  { key: 'violet',  label: '바이올렛',   color: 'bg-violet-500'  },
  { key: 'emerald', label: '에메랄드',   color: 'bg-emerald-500' },
  { key: 'blue',    label: '블루',       color: 'bg-blue-500'    },
  { key: 'orange',  label: '오렌지',     color: 'bg-orange-500'  },
  { key: 'slate',   label: '슬레이트',   color: 'bg-slate-500'   },
];

const SECTION_LABELS = [
  { key: 'gallery', label: '갤러리 (AI 이미지)' },
  { key: 'menu',    label: '메뉴 · 서비스' },
  { key: 'cta',     label: '하단 전화 버튼' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function EditorPage() {
  const [cfg, setCfg] = useState<SiteConfig>({});
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [iframeKey, setIframeKey] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestCfg = useRef<SiteConfig>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/user/site-config').then(r => r.json()),
      fetch('/api/user/profile').then(r => r.json()),
    ]).then(([cfgData, profileData]) => {
      const initial = cfgData.config ?? {};
      setCfg(initial);
      latestCfg.current = initial;
      setSlug(profileData.user?.slug ?? null);
      setLoading(false);
    });
  }, []);

  const saveCfg = useCallback(async (next: SiteConfig) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/user/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setIframeKey(k => k + 1);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  }, []);

  function update(patch: Partial<SiteConfig>) {
    const next = { ...latestCfg.current, ...patch };
    latestCfg.current = next;
    setCfg(next);
    setSaveStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCfg(latestCfg.current), 900);
  }

  function toggleSection(key: string) {
    const hidden = cfg.sections_hidden ?? [];
    update({
      sections_hidden: hidden.includes(key)
        ? hidden.filter(k => k !== key)
        : [...hidden, key],
    });
  }

  function manualSave() {
    clearTimeout(saveTimer.current);
    saveCfg(latestCfg.current);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-stone-400" />
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-500">
        <p className="text-sm">가게 정보(슬러그)를 먼저 저장해야 에디터를 사용할 수 있습니다.</p>
        <Link href="/admin/settings" className="text-amber-600 font-bold hover:underline text-sm">
          가게 정보 설정하러 가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── 좌측 편집 패널 ───────────────────────────────── */}
      <aside className="w-80 shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 shrink-0">
          <Link
            href="/admin/settings"
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-bold text-stone-800 text-sm flex-1">홈페이지 편집</span>
          {/* 저장 상태 */}
          <span className="text-xs">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-stone-400">
                <Loader2 size={12} className="animate-spin" /> 저장 중
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle size={12} /> 저장됨
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle size={12} /> 오류
              </span>
            )}
          </span>
          <button
            onClick={manualSave}
            title="지금 저장"
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <Save size={15} />
          </button>
        </div>

        {/* 편집 영역 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

          {/* Hero */}
          <section>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Hero 섹션</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">슬로건</label>
                <input
                  value={cfg.tagline ?? ''}
                  onChange={e => update({ tagline: e.target.value })}
                  placeholder="업종 기본값 사용"
                  maxLength={100}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">소개글</label>
                <textarea
                  value={cfg.hero_description ?? ''}
                  onChange={e => update({ hero_description: e.target.value })}
                  placeholder="슬로건 아래 표시되는 짧은 소개글 (선택)"
                  maxLength={300}
                  rows={3}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
                <p className="text-xs text-stone-400 mt-0.5 text-right">{(cfg.hero_description ?? '').length}/300</p>
              </div>
            </div>
          </section>

          {/* 색상 테마 */}
          <section>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Palette size={11} /> 색상 테마
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => update({ theme: opt.key || undefined })}
                  className={[
                    'flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-colors',
                    (cfg.theme ?? '') === opt.key
                      ? 'border-stone-700 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <span className={`w-5 h-5 rounded-full ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* 섹션 표시 */}
          <section>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">섹션 표시</h3>
            <div className="space-y-2">
              {SECTION_LABELS.map(sec => {
                const isVisible = !(cfg.sections_hidden ?? []).includes(sec.key);
                return (
                  <div key={sec.key} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-stone-700">{sec.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.key)}
                      className={[
                        'flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors',
                        isVisible
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-500 hover:bg-stone-300',
                      ].join(' ')}
                    >
                      {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                      {isVisible ? '표시' : '숨김'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 하단 버튼 텍스트 */}
          <section>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">CTA 버튼</h3>
            <input
              value={cfg.cta_text ?? ''}
              onChange={e => update({ cta_text: e.target.value })}
              placeholder="문의 · 예약 (기본값)"
              maxLength={50}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </section>
        </div>

        {/* 하단 — 사이트 링크 */}
        <div className="border-t border-stone-100 px-4 py-3 shrink-0">
          <a
            href={`/site/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-amber-700 font-semibold hover:underline"
          >
            <ExternalLink size={12} />
            실제 페이지 새 탭으로 열기
          </a>
        </div>
      </aside>

      {/* ── 우측 미리보기 (iframe) ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone-100">
        {/* 미리보기 툴바 */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-stone-200 shrink-0">
          <span className="text-xs text-stone-400 font-medium">미리보기</span>
          <span className="text-xs text-stone-300">·</span>
          <span className="text-xs text-stone-500 font-mono">/site/{slug}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-stone-400">변경 후 자동 갱신</span>
            <button
              onClick={() => setIframeKey(k => k + 1)}
              title="미리보기 새로고침"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded hover:bg-stone-100 transition-colors"
            >
              <RefreshCw size={12} />
              새로고침
            </button>
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-hidden p-3">
          <iframe
            key={iframeKey}
            src={`/site/${slug}`}
            className="w-full h-full rounded-xl border border-stone-200 bg-white shadow-sm"
            title="홈페이지 미리보기"
          />
        </div>
      </div>
    </div>
  );
}
