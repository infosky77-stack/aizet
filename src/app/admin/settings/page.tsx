'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import {
  Store, Phone, MapPin, Clock, Tag, Plus, Trash2,
  Save, ExternalLink, CheckCircle, AlertCircle, Loader2, Info, Sparkles,
} from 'lucide-react';

interface MenuItem { name: string; price: number }

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

const HOURS_PRESETS = [
  '평일 09:00–18:00 / 주말 휴무',
  '매일 10:00–22:00',
  '월–토 10:00–20:00 / 일 휴무',
  '24시간 운영',
];

export default function AdminSettingsPage() {
  const { session } = useSession();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [genMsg, setGenMsg] = useState('');

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
            menu_items: (data.menuItems ?? []).map((m: { name: string; price: number }) => ({ name: m.name, price: m.price })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setStatus('idle');
  }

  function addMenuItem() {
    set('menu_items', [...form.menu_items, { name: '', price: 0 }]);
  }
  function updateMenuItem(i: number, field: 'name' | 'price', val: string) {
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
    if (!form.slug) {
      setGenMsg('먼저 가게 정보를 저장하고 슬러그를 확정해 주세요.');
      setGenStatus('error');
      return;
    }
    setGenerating(true);
    setGenStatus('idle');
    setGenMsg('');
    try {
      const res = await fetch('/api/admin/generate-images', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setGenMsg(data.error ?? '이미지 생성 실패');
        setGenStatus('error');
      } else {
        setGenMsg(`이미지 생성 완료 (${data.succeeded}/${data.total}장)`);
        setGenStatus('ok');
      }
    } catch {
      setGenMsg('네트워크 오류');
      setGenStatus('error');
    } finally {
      setGenerating(false);
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
          <div className="space-y-2">
            {form.menu_items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={item.name}
                  onChange={e => updateMenuItem(i, 'name', e.target.value)}
                  placeholder="항목명 (예: 커트)"
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                />
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

      {/* AI 이미지 생성 */}
      <div className="mt-8 border-t border-stone-100 pt-8">
        <div className="mb-3">
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            AI 이미지 자동 생성
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            업종과 가게명을 기반으로 홈페이지용 이미지를 Gemini AI로 생성합니다. 가게 정보 저장 후 사용하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateImages}
            disabled={generating || !form.slug}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? '이미지 생성 중...' : 'AI로 이미지 자동 생성'}
          </button>

          {genStatus === 'ok' && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
              <CheckCircle size={16} />
              {genMsg}
            </div>
          )}
          {genStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-500 text-sm">
              <AlertCircle size={16} />
              {genMsg}
            </div>
          )}
        </div>
        {!form.slug && (
          <p className="mt-2 text-xs text-amber-600">슬러그(홈페이지 주소)를 먼저 저장해야 합니다.</p>
        )}
      </div>
    </div>
  );
}
