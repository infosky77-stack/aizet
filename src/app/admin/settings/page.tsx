'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  Store, Phone, MapPin, Clock, Tag, Plus, Trash2,
  Save, ExternalLink, CheckCircle, AlertCircle, Loader2, Info, Sparkles,
  Palette, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import type { SiteConfig } from '@/lib/siteConfig';

type GalleryImage = { key: string; label: string; url: string | null; exists: boolean }

interface MenuItem { name: string; price: number; description: string }

interface FormState {
  shop_name: string;
  phone: string;
  address: string;
  business_hours: string;
  slug: string;
  menu_items: MenuItem[];
}

const EMPTY: FormState = {
  shop_name: '', phone: '', address: '', business_hours: '', slug: '', menu_items: [],
};

const REGEN_LIMIT = 3;

const HOURS_PRESETS = [
  '평일 09:00–18:00 / 주말 휴무',
  '매일 10:00–22:00',
  '월–토 10:00–20:00 / 일 휴무',
  '24시간 운영',
];

const THEME_OPTIONS: { key: string; label: string; color: string }[] = [
  { key: '',        label: '업종 기본',  color: 'bg-stone-400'   },
  { key: 'amber',   label: '앰버',       color: 'bg-amber-500'   },
  { key: 'rose',    label: '로즈',       color: 'bg-rose-500'    },
  { key: 'violet',  label: '바이올렛',   color: 'bg-violet-500'  },
  { key: 'emerald', label: '에메랄드',   color: 'bg-emerald-500' },
  { key: 'blue',    label: '블루',       color: 'bg-blue-500'    },
  { key: 'orange',  label: '오렌지',     color: 'bg-orange-500'  },
  { key: 'slate',   label: '슬레이트',   color: 'bg-slate-500'   },
];

const SECTION_LABELS: { key: string; label: string }[] = [
  { key: 'gallery', label: '갤러리 (AI 이미지)' },
  { key: 'menu',    label: '메뉴 · 서비스' },
  { key: 'cta',     label: '하단 전화 버튼' },
];

export default function AdminSettingsPage() {
  const { session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [genError, setGenError] = useState('');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [configSaving, setConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [regenCount, setRegenCount] = useState(0);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [regenError, setRegenError] = useState('');
  const [descLoading, setDescLoading] = useState<number | null>(null);

  async function loadGallery() {
    try {
      const res = await fetch('/api/user/images');
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images ?? []);
        setRegenCount(data.regenCount ?? 0);
      }
    } catch { /* 조용히 무시 */ }
  }

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setForm({
            shop_name: u.shop_name ?? '',
            phone: u.phone ?? '',
            address: u.address ?? '',
            business_hours: u.business_hours ?? '',
            slug: u.slug ?? '',
            menu_items: (data.menuItems ?? []).map((m: { name: string; price: number; description?: string }) => ({
              name: m.name, price: m.price, description: m.description ?? '',
            })),
          });
        }
      })
      .finally(() => setLoading(false));
    fetch('/api/user/site-config')
      .then(r => r.json())
      .then(data => { if (data.config) setSiteConfig(data.config); });
    loadGallery();
  }, []);

  async function handleSaveConfig() {
    setConfigSaving(true);
    setConfigStatus('idle');
    try {
      const res = await fetch('/api/user/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfig),
      });
      setConfigStatus(res.ok ? 'ok' : 'error');
    } catch {
      setConfigStatus('error');
    } finally {
      setConfigSaving(false);
    }
  }

  function toggleSection(key: string) {
    setSiteConfig(prev => {
      const hidden = prev.sections_hidden ?? [];
      return {
        ...prev,
        sections_hidden: hidden.includes(key)
          ? hidden.filter(k => k !== key)
          : [...hidden, key],
      };
    });
    setConfigStatus('idle');
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setStatus('idle');
  }

  function addMenuItem() {
    set('menu_items', [...form.menu_items, { name: '', price: 0, description: '' }]);
  }
  function updateMenuItem(i: number, field: 'name' | 'price' | 'description', val: string) {
    const next = form.menu_items.map((m, idx) =>
      idx === i ? { ...m, [field]: field === 'price' ? parseInt(val) || 0 : val } : m
    );
    set('menu_items', next);
  }
  function removeMenuItem(i: number) {
    set('menu_items', form.menu_items.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '저장 실패');
        setStatus('error');
      } else {
        // slug가 서버에서 확정되면 반영
        if (data.user?.slug) set('slug', data.user.slug);
        setStatus('ok');
      }
    } catch {
      setErrorMsg('네트워크 오류');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateImages() {
    if (!form.slug) return;
    setGenError('');
    try {
      const res  = await fetch('/api/admin/image-payment', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? '결제 초기화 실패'); return; }
      if (data.resumable) {
        // 완료되지 않은 기존 결제 건 — Toss 결제 없이 바로 생성 화면으로
        router.push(
          `/admin/image-payment/success?paymentKey=${data.paymentKey}&orderId=${data.orderId}&amount=${data.amount}`
        );
      } else {
        router.push(`/admin/image-payment?orderId=${data.orderId}`);
      }
    } catch {
      setGenError('네트워크 오류');
    }
  }

  async function handleRegenImage(imageKey: string) {
    if (regenCount >= REGEN_LIMIT || regenLoading !== null) return;
    setRegenLoading(imageKey);
    setRegenError('');
    try {
      const res = await fetch('/api/admin/regen-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRegenError(data.error ?? `오류 (${res.status})`);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'done') {
              setGalleryImages(prev => prev.map(img =>
                img.key === ev.key ? { ...img, url: ev.url, exists: true } : img
              ));
              setRegenCount(ev.newRegenCount);
            } else if (ev.type === 'error') {
              setRegenError(ev.error ?? '생성 실패');
            }
          } catch { /* 파싱 실패 무시 */ }
        }
      }
    } catch {
      setRegenError('네트워크 오류');
    } finally {
      setRegenLoading(null);
    }
  }

  async function handleGenerateDescription(index: number) {
    const item = form.menu_items[index];
    if (!item.name.trim() || descLoading !== null) return;
    setDescLoading(index);
    try {
      const res = await fetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuName: item.name,
          shopName: form.shop_name,
          industry: session?.industry ?? '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        updateMenuItem(index, 'description', data.description);
      }
    } catch { /* 오류 시 조용히 무시 */ }
    finally {
      setDescLoading(null);
    }
  }

  const siteUrl = form.slug ? `/site/${form.slug}` : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 size={28} className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900">가게 정보 설정</h1>
        <p className="text-stone-500 text-sm mt-1">입력한 정보로 고객용 홈페이지가 자동 생성됩니다.</p>
      </div>

      {/* 미리보기 링크 */}
      {siteUrl && (
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold hover:bg-amber-100 transition-colors mb-6"
        >
          <ExternalLink size={15} />
          내 홈페이지 미리보기: aizet.co.kr{siteUrl}
        </a>
      )}

      <div className="space-y-5">
        {/* 가게명 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Store size={14} className="text-amber-600" />
            가게명 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.shop_name}
            onChange={e => set('shop_name', e.target.value)}
            placeholder="예: 블루밍 헤어"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
          />
          <p className="text-xs text-stone-400 mt-1">업종: {session?.industry || '미설정'}</p>
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Phone size={14} className="text-amber-600" />
            전화번호
          </label>
          <input
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="예: 02-1234-5678"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} className="text-amber-600" />
            주소
          </label>
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="예: 서울시 마포구 합정동 456-7"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
          />
        </div>

        {/* 영업시간 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Clock size={14} className="text-amber-600" />
            영업시간
          </label>
          <input
            value={form.business_hours}
            onChange={e => set('business_hours', e.target.value)}
            placeholder="예: 평일 10:00–20:00 / 주말 10:00–18:00"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {HOURS_PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => set('business_hours', p)}
                className="text-xs bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 px-2.5 py-1 rounded-lg transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* URL 슬러그 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Tag size={14} className="text-amber-600" />
            홈페이지 주소 (슬러그)
          </label>
          <div className="flex items-center gap-0">
            <span className="bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl px-3 py-2.5 text-xs text-stone-500 whitespace-nowrap">
              aizet.co.kr/site/
            </span>
            <input
              value={form.slug}
              onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="my-shop"
              className="flex-1 border border-stone-200 rounded-r-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
            />
          </div>
          <div className="flex items-start gap-1.5 mt-1.5">
            <Info size={12} className="text-stone-400 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-400">영문 소문자·숫자·하이픈만 사용 가능. 가게명 저장 시 자동 생성됩니다.</p>
          </div>
        </div>

        {/* 대표 메뉴·서비스 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
            <Tag size={14} className="text-amber-600" />
            대표 메뉴 / 서비스 (가격 포함)
          </label>
          <div className="space-y-3">
            {form.menu_items.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex gap-2 items-center">
                  <input
                    value={item.name}
                    onChange={e => updateMenuItem(i, 'name', e.target.value)}
                    placeholder="항목명 (예: 커트)"
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateDescription(i)}
                    disabled={!item.name.trim() || descLoading !== null}
                    title="AI로 설명 자동 생성"
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    {descLoading === i
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Sparkles size={13} />}
                    AI 설명
                  </button>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={e => updateMenuItem(i, 'price', e.target.value)}
                      placeholder="가격"
                      className="w-24 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition text-right"
                    />
                    <span className="pr-3 text-xs text-stone-400">원</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMenuItem(i)}
                    className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <input
                  value={item.description}
                  onChange={e => updateMenuItem(i, 'description', e.target.value)}
                  placeholder="메뉴 설명 (선택사항, AI 버튼으로 자동 생성)"
                  className="w-full border border-stone-100 bg-stone-50 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMenuItem}
            className="mt-2 flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-semibold transition-colors"
          >
            <Plus size={15} />
            항목 추가
          </button>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? '저장 중...' : '저장하기'}
        </button>

        {status === 'ok' && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
            <CheckCircle size={16} />
            저장됐습니다
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-red-500 text-sm">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-stone-400">
        저장 후 홈페이지에 즉시 반영됩니다. 메뉴 항목은 전체 교체 방식으로 저장됩니다.
      </p>

      {/* 홈페이지 꾸미기 */}
      <div className="mt-8 border-t border-stone-100 pt-8">
        <div className="mb-4">
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Palette size={16} className="text-amber-500" />
            홈페이지 꾸미기
          </h2>
          <p className="text-xs text-stone-400 mt-1">슬로건, 색상 테마, 섹션 표시 여부를 조정합니다.</p>
        </div>

        <div className="space-y-5">
          {/* 슬로건 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">슬로건</label>
            <input
              value={siteConfig.tagline ?? ''}
              onChange={e => { setSiteConfig(p => ({ ...p, tagline: e.target.value })); setConfigStatus('idle'); }}
              placeholder="예: 당신에게 어울리는 스타일을 찾아드립니다 (비워두면 업종 기본값 사용)"
              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
              maxLength={100}
            />
          </div>

          {/* 색상 테마 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">색상 테마</label>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSiteConfig(p => ({ ...p, theme: opt.key || undefined })); setConfigStatus('idle'); }}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors',
                    (siteConfig.theme ?? '') === opt.key
                      ? 'border-stone-700 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA 버튼 텍스트 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">하단 버튼 제목</label>
            <input
              value={siteConfig.cta_text ?? ''}
              onChange={e => { setSiteConfig(p => ({ ...p, cta_text: e.target.value })); setConfigStatus('idle'); }}
              placeholder="문의 · 예약 (기본값)"
              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
              maxLength={50}
            />
          </div>

          {/* 섹션 표시 토글 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">섹션 표시</label>
            <div className="space-y-2">
              {SECTION_LABELS.map(sec => {
                const isVisible = !(siteConfig.sections_hidden ?? []).includes(sec.key);
                return (
                  <div key={sec.key} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-stone-700">{sec.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.key)}
                      className={[
                        'flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors',
                        isVisible
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-500 hover:bg-stone-300',
                      ].join(' ')}
                    >
                      {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      {isVisible ? '표시' : '숨김'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSaveConfig}
            disabled={configSaving}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {configSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {configSaving ? '저장 중...' : '꾸미기 저장'}
          </button>
          {configStatus === 'ok' && (
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
              <CheckCircle size={14} /> 저장됐습니다
            </span>
          )}
          {configStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-red-500 text-sm">
              <AlertCircle size={14} /> 저장 실패
            </span>
          )}
          {form.slug && (
            <a
              href={`/site/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs text-amber-700 hover:underline font-semibold"
            >
              <ExternalLink size={12} />
              미리보기
            </a>
          )}
        </div>
      </div>

      {/* AI 이미지 생성 */}
      <div className="mt-8 border-t border-stone-100 pt-8">
        <div className="mb-4">
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            AI 이미지 자동 생성
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            업종과 가게명을 기반으로 홈페이지용 이미지를 AI로 생성합니다. 가게 정보 저장 후 사용하세요.
          </p>
        </div>

        {/* 시작 버튼 */}
        <div>
          <button
            onClick={handleGenerateImages}
            disabled={!form.slug}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Sparkles size={16} />
            AI로 이미지 자동 생성
          </button>
          {!form.slug && (
            <p className="mt-2 text-xs text-amber-600">슬러그(홈페이지 주소)를 먼저 저장해야 합니다.</p>
          )}
          {form.slug && (
            <p className="mt-2 text-xs text-stone-400">
              결제({(10000).toLocaleString()}원) 후 이미지가 자동 생성됩니다.
            </p>
          )}
          {genError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-500 text-sm">
              <AlertCircle size={14} />
              {genError}
            </div>
          )}
        </div>

        {/* 생성된 이미지 갤러리 */}
        {galleryImages.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-700">생성된 이미지</h3>
              <span className={[
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                regenCount >= REGEN_LIMIT
                  ? 'bg-red-100 text-red-600'
                  : 'bg-violet-100 text-violet-700',
              ].join(' ')}>
                재생성 가능: {REGEN_LIMIT - regenCount}/{REGEN_LIMIT}회
              </span>
            </div>
            {regenError && (
              <div className="flex items-center gap-1.5 mb-3 text-red-500 text-sm">
                <AlertCircle size={13} />
                {regenError}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map(img => (
                <div key={img.key} className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 group">
                  {img.exists && img.url ? (
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-stone-300 text-xs text-center px-2">{img.label}</span>
                    </div>
                  )}

                  {/* 재생성 중 스피너 오버레이 */}
                  {regenLoading === img.key && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={22} className="text-white animate-spin" />
                    </div>
                  )}

                  {/* 재생성 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleRegenImage(img.key)}
                    disabled={regenCount >= REGEN_LIMIT || regenLoading !== null}
                    title={regenCount >= REGEN_LIMIT ? '한도 초과' : `${img.label} 재생성`}
                    className={[
                      'absolute top-1.5 right-1.5 p-1.5 rounded-lg text-white text-xs font-bold transition-all',
                      regenCount >= REGEN_LIMIT
                        ? 'bg-stone-400 cursor-not-allowed opacity-70'
                        : 'bg-violet-600 hover:bg-violet-700 opacity-0 group-hover:opacity-100',
                      regenLoading === img.key ? 'opacity-0' : '',
                    ].join(' ')}
                  >
                    <RefreshCw size={12} />
                  </button>

                  {/* 라벨 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                    <span className="text-white text-[10px] font-semibold">{img.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {regenCount >= REGEN_LIMIT && (
              <p className="mt-2 text-xs text-red-500">재생성 한도(3회)에 도달했습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
