'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Printer, ChevronLeft, Search, Plus, Folder, FolderOpen,
  File, ShoppingCart, Upload, X, Globe, Building2,
  ChevronRight, Clock, HardDrive, Cloud, CheckCircle2,
  Loader2, Unlink, Crown, Zap, AlertCircle, Shield,
} from 'lucide-react';
import { Client, ClientFile } from '@/types/print-files';
import {
  DriveState, StorageDestination,
  getDriveState, connectDrive, disconnectDrive, upgradeToPremium,
  getUserPlan, UserPlan, isPremiumPlan, fmtBytes, addUsedBytes,
} from '@/lib/google-drive';
import { clsx } from 'clsx';

const FILE_TYPE_COLORS: Record<string, string> = {
  '.ai': 'bg-orange-100 text-orange-700',
  '.cdr': 'bg-teal-100 text-teal-700',
  '.pdf': 'bg-red-100 text-red-700',
  '.psd': 'bg-blue-100 text-blue-700',
  '.jpg': 'bg-yellow-100 text-yellow-700',
  '.png': 'bg-green-100 text-green-700',
  '.eps': 'bg-purple-100 text-purple-700',
};
function typeColor(t: string) { return FILE_TYPE_COLORS[t] ?? 'bg-stone-100 text-stone-600'; }
function fmtSize(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const COUNTRY_OPTIONS = [
  { name: '미국', code: 'US' }, { name: '독일', code: 'DE' }, { name: '일본', code: 'JP' },
  { name: '중국', code: 'CN' }, { name: '한국', code: 'KR' }, { name: '호주', code: 'AU' },
  { name: '영국', code: 'GB' }, { name: '프랑스', code: 'FR' }, { name: '캐나다', code: 'CA' },
  { name: '기타', code: 'ETC' },
];

// ── Google Drive SVG logo ──────────────────────────────────────────────────────
function DriveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

// ── Google Drive Banner ────────────────────────────────────────────────────────
function GoogleDriveBanner({
  driveState,
  userPlan,
  onConnect,
  onDisconnect,
  onUpgrade,
}: {
  driveState: DriveState | null;
  userPlan: UserPlan;
  onConnect: () => void;
  onDisconnect: () => void;
  onUpgrade: () => void;
}) {
  const isPremium = isPremiumPlan();
  const usedPct = driveState ? Math.min((driveState.usedBytes / driveState.totalBytes) * 100, 100) : 0;
  const barColor = usedPct > 90 ? 'bg-red-500' : usedPct > 70 ? 'bg-amber-500' : 'bg-blue-500';

  if (!driveState?.connected) {
    return (
      <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <DriveIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-800">구글 드라이브 연동</p>
            <p className="text-xs text-stone-500 mt-0.5">
              파일을 구글 드라이브에 자동 백업하세요. 무료 15 GB 제공됩니다.
            </p>
            {isPremium && (
              <p className="text-xs text-violet-600 font-medium mt-1 flex items-center gap-1">
                <Crown size={10} />
                {userPlan === 'business' ? '비즈니스' : '프로'} 플랜 — Google One 프리미엄 2 TB 연동 가능
              </p>
            )}
          </div>
          <button
            onClick={onConnect}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            <Cloud size={12} />
            연동하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <DriveIcon size={20} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={10} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-stone-800">구글 드라이브 연결됨</p>
            <span className={clsx(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              driveState.tier === 'premium'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-blue-100 text-blue-700'
            )}>
              {driveState.tier === 'premium' ? 'Google One 2 TB' : '기본 15 GB'}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">{driveState.email}</p>

          {/* Storage bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-stone-400 mb-1">
              <span>{fmtBytes(driveState.usedBytes)} 사용</span>
              <span>{fmtBytes(driveState.totalBytes)} 중</span>
            </div>
            <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', barColor)}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          {/* Upgrade prompt for basic tier non-premium users */}
          {driveState.tier === 'basic' && !isPremium && (
            <p className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-1">
              <Zap size={9} className="text-amber-500" />
              <span>프로/비즈니스 플랜 업그레이드 시 Google One 2 TB 연동 가능</span>
            </p>
          )}
          {driveState.tier === 'basic' && isPremium && (
            <button
              onClick={onUpgrade}
              className="mt-1.5 text-[10px] text-violet-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Crown size={9} />
              2 TB 프리미엄으로 업그레이드
            </button>
          )}
        </div>
        <button
          onClick={onDisconnect}
          className="shrink-0 w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          title="연동 해제"
        >
          <Unlink size={13} />
        </button>
      </div>
    </div>
  );
}

// ── OAuth Simulation Modal ─────────────────────────────────────────────────────
function OAuthModal({
  userPlan,
  onDone,
  onClose,
}: {
  userPlan: UserPlan;
  onDone: (state: DriveState) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<'select' | 'auth' | 'done'>('select');
  const [tier, setTier] = useState<'basic' | 'premium'>('basic');
  const isPremium = isPremiumPlan();
  const mockEmail = 'user@gmail.com';

  useEffect(() => {
    if (phase !== 'auth') return;
    const t = setTimeout(() => {
      const state = connectDrive(mockEmail, tier);
      setPhase('done');
      setTimeout(() => onDone(state), 1200);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, tier, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DriveIcon size={18} />
            <span className="font-bold text-stone-800 text-sm">구글 드라이브 연동</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        {phase === 'select' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-stone-500">저장공간 플랜을 선택하세요</p>

            {/* Basic option */}
            <button
              onClick={() => setTier('basic')}
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                tier === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-stone-200 hover:border-stone-300'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <HardDrive size={15} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-800">기본 저장공간</p>
                  <span className="text-xs font-bold text-emerald-600">무료</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">구글 드라이브 15 GB</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Shield size={10} className="text-blue-500" />
                  <span className="text-[10px] text-blue-600">모든 회원 기본 제공</span>
                </div>
              </div>
              {tier === 'basic' && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              )}
            </button>

            {/* Premium option */}
            <button
              onClick={() => isPremium && setTier('premium')}
              disabled={!isPremium}
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all relative',
                !isPremium ? 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed' :
                tier === 'premium' ? 'border-violet-500 bg-violet-50' : 'border-stone-200 hover:border-violet-300'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                <Crown size={15} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-stone-800">프리미엄 저장공간</p>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full shrink-0">Pro/Biz</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">Google One 2 TB</p>
                {!isPremium ? (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle size={10} className="text-amber-500" />
                    <span className="text-[10px] text-amber-600">프로 또는 비즈니스 플랜 전용</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Zap size={10} className="text-violet-500" />
                    <span className="text-[10px] text-violet-600">현재 플랜에서 사용 가능</span>
                  </div>
                )}
              </div>
              {tier === 'premium' && isPremium && (
                <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              )}
            </button>

            {/* Plan badge */}
            <div className="bg-stone-50 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] text-stone-400">현재 플랜</span>
              <span className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                userPlan === 'business' ? 'bg-amber-100 text-amber-700' :
                userPlan === 'pro' ? 'bg-violet-100 text-violet-700' :
                'bg-stone-100 text-stone-600'
              )}>
                {userPlan === 'business' ? '비즈니스' : userPlan === 'pro' ? '프로' : '무료'}
              </span>
            </div>

            <button
              onClick={() => setPhase('auth')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
              </svg>
              Google 계정으로 연동
            </button>
          </div>
        )}

        {phase === 'auth' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
            <div>
              <p className="font-bold text-stone-800 text-sm">Google 계정 인증 중...</p>
              <p className="text-xs text-stone-400 mt-1">{mockEmail}</p>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-[grow_2s_linear_forwards]" />
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-stone-800 text-sm">연동 완료!</p>
              <p className="text-xs text-stone-500 mt-1">
                {tier === 'premium' ? 'Google One 2 TB' : '구글 드라이브 15 GB'}가 연결됐습니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Storage Destination Picker ─────────────────────────────────────────────────
function StoragePicker({
  value,
  onChange,
  driveState,
}: {
  value: StorageDestination;
  onChange: (v: StorageDestination) => void;
  driveState: DriveState | null;
}) {
  const premium = driveState?.tier === 'premium';

  const options: { id: StorageDestination; label: string; sub: string; icon: React.ReactNode; available: boolean; badge?: string }[] = [
    {
      id: 'local',
      label: '기본 저장공간',
      sub: 'AIZET 서버에 저장',
      icon: <HardDrive size={14} className="text-stone-500" />,
      available: true,
    },
    {
      id: 'drive-basic',
      label: '구글 드라이브',
      sub: driveState?.connected ? `${driveState.email} · 15 GB` : '연동 필요',
      icon: <DriveIcon size={14} />,
      available: driveState?.connected === true,
      badge: '15 GB',
    },
    {
      id: 'drive-premium',
      label: 'Google One 프리미엄',
      sub: premium ? `${driveState?.email} · 2 TB` : '프로/비즈니스 전용',
      icon: <Crown size={14} className="text-violet-500" />,
      available: driveState?.connected === true && premium,
      badge: '2 TB',
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-stone-600 mb-2">저장 위치</p>
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            disabled={!opt.available}
            onClick={() => opt.available && onChange(opt.id)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all',
              !opt.available ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed' :
              value === opt.id ? 'border-blue-400 bg-blue-50' : 'border-stone-200 hover:border-stone-300 bg-white'
            )}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">{opt.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={clsx('text-xs font-semibold', value === opt.id ? 'text-blue-700' : 'text-stone-700')}>
                  {opt.label}
                </span>
                {opt.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{opt.badge}</span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5 truncate">{opt.sub}</p>
            </div>
            <div className={clsx(
              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              value === opt.id ? 'border-blue-500 bg-blue-500' : 'border-stone-300'
            )}>
              {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── New Client Modal ───────────────────────────────────────────────────────────
function NewClientModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (d: { company: string; country: string; countryCode: string; contactName: string; contactEmail: string }) => void;
}) {
  const [form, setForm] = useState({ company: '', country: '', countryCode: '', contactName: '', contactEmail: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-stone-800">거래처 등록</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="회사명 *" value={form.company} onChange={e => set('company', e.target.value)} />
          <select
            className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            value={form.countryCode}
            onChange={e => {
              const c = COUNTRY_OPTIONS.find(c => c.code === e.target.value);
              setForm(p => ({ ...p, countryCode: e.target.value, country: c?.name ?? '' }));
            }}
          >
            <option value="">국가 선택 *</option>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
          </select>
          <input className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="담당자명" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
          <input className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="이메일" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">취소</button>
            <button
              disabled={!form.company || !form.countryCode}
              onClick={() => form.company && form.countryCode && onSave(form)}
              className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400"
            >등록</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal (with storage picker) ────────────────────────────────────────
function UploadModal({ onClose, onSave, driveState }: {
  onClose: () => void;
  onSave: (d: { product: string; filename: string; fileType: string; version: number; isLatest: boolean; sizeBytes: number; storageDestination: StorageDestination }) => void;
  driveState: DriveState | null;
}) {
  const [product, setProduct] = useState('');
  const [filename, setFilename] = useState('');
  const [version, setVersion] = useState('1');
  const [destination, setDestination] = useState<StorageDestination>(
    driveState?.connected ? 'drive-basic' : 'local'
  );
  const [uploading, setUploading] = useState(false);
  const ext = filename.includes('.') ? ('.' + filename.split('.').pop()!.toLowerCase()) : '';

  function handleSave() {
    if (!product || !filename) return;
    setUploading(true);
    const sizeBytes = Math.floor(Math.random() * 3_000_000) + 200_000;
    setTimeout(() => {
      if (destination !== 'local') addUsedBytes(sizeBytes);
      onSave({ product, filename, fileType: ext || '.bin', version: parseInt(version) || 1, isLatest: true, sizeBytes, storageDestination: destination });
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-stone-800">파일 업로드</h2>
          <button onClick={onClose} disabled={uploading} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {uploading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              {destination === 'local'
                ? <HardDrive size={20} className="text-blue-500 animate-pulse" />
                : <DriveIcon size={20} />}
            </div>
            <div className="text-center">
              <p className="font-semibold text-stone-800 text-sm">업로드 중...</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {destination === 'local' ? 'AIZET 서버' :
                  destination === 'drive-premium' ? 'Google One 2 TB' : '구글 드라이브 15 GB'}에 저장 중
              </p>
            </div>
            <Loader2 size={20} className="text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="제품/폴더명 *"
              value={product}
              onChange={e => setProduct(e.target.value)}
            />
            <input
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="파일명 (예: label-v2.ai) *"
              value={filename}
              onChange={e => setFilename(e.target.value)}
            />
            <input
              type="number"
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="버전 번호"
              value={version}
              min={1}
              onChange={e => setVersion(e.target.value)}
            />
            {ext && (
              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', typeColor(ext))}>{ext.toUpperCase()}</span>
                <span className="text-xs text-stone-400">파일 타입 인식됨</span>
              </div>
            )}

            <StoragePicker value={destination} onChange={setDestination} driveState={driveState} />

            <div className="flex gap-2 mt-1">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">취소</button>
              <button
                disabled={!product || !filename}
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-stone-200 flex items-center justify-center gap-1.5"
              >
                {destination !== 'local' ? <DriveIcon size={12} /> : <Upload size={12} />}
                업로드
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Storage badge on file rows ─────────────────────────────────────────────────
function StorageBadge({ dest }: { dest?: StorageDestination }) {
  if (!dest || dest === 'local') return null;
  return (
    <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
      <DriveIcon size={8} />
      {dest === 'drive-premium' ? '2 TB' : '15 GB'}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FilesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showOAuth, setShowOAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driveState, setDriveState] = useState<DriveState | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  // storageMap: fileId → StorageDestination (client-side only, demo purpose)
  const [storageMap, setStorageMap] = useState<Record<string, StorageDestination>>({});

  useEffect(() => {
    setDriveState(getDriveState());
    setUserPlan(getUserPlan());
  }, []);

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/print/clients');
    const { clients: c } = await res.json();
    setClients(c);
    setLoading(false);
  }, []);

  const fetchFiles = useCallback(async (id: string) => {
    const res = await fetch(`/api/print/clients/${id}/files`);
    const { files: f } = await res.json();
    setFiles(f);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { if (selected) fetchFiles(selected.id); else setFiles([]); }, [selected, fetchFiles]);

  async function handleAddClient(data: { company: string; country: string; countryCode: string; contactName: string; contactEmail: string }) {
    await fetch('/api/print/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowNewClient(false);
    fetchClients();
  }

  async function handleUploadFile(data: { product: string; filename: string; fileType: string; version: number; isLatest: boolean; sizeBytes: number; storageDestination: StorageDestination }) {
    if (!selected) return;
    const { storageDestination, ...rest } = data;
    const res = await fetch(`/api/print/clients/${selected.id}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rest, clientId: selected.id }) });
    const { file } = await res.json();
    if (file?.id) {
      setStorageMap(m => ({ ...m, [file.id]: storageDestination }));
    }
    setShowUpload(false);
    fetchFiles(selected.id);
    // Refresh drive state after upload
    setDriveState(getDriveState());
  }

  const filteredClients = clients.filter(c =>
    !search || c.company.toLowerCase().includes(search.toLowerCase()) || c.country.includes(search) || c.countryCode.toLowerCase().includes(search.toLowerCase())
  );

  const filesByProduct = files.reduce((acc, f) => {
    if (!acc[f.product]) acc[f.product] = [];
    acc[f.product].push(f);
    return acc;
  }, {} as Record<string, ClientFile[]>);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Printer size={13} className="text-white" />
            </div>
            <span className="font-bold text-blue-900">거래처 파일 관리</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Search — desktop only */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="pl-8 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:border-blue-400 focus:outline-none w-48"
                placeholder="거래처·파일 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowNewClient(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">거래처 등록</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-5 flex flex-col md:flex-row gap-5 flex-1">
        {/* Client list — hidden on mobile when a client is selected */}
        <div className={clsx('md:w-64 md:shrink-0', selected ? 'hidden md:block' : 'block')}>
          {/* Mobile search */}
          <div className="sm:hidden mb-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:border-blue-400 focus:outline-none"
              placeholder="거래처·파일 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-3">거래처 ({filteredClients.length})</p>
          {loading ? (
            <div className="text-sm text-stone-400 py-4 text-center">불러오는 중...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredClients.map(client => {
                const active = selected?.id === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => { setSelected(active ? null : client); setOpenFolder(null); }}
                    className={clsx(
                      'text-left p-3 rounded-xl border transition-all',
                      active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-stone-100 text-stone-700 hover:border-blue-300 shadow-sm'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={13} className={active ? 'text-blue-200' : 'text-stone-400'} />
                      <span className="text-xs font-bold truncate">{client.company}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe size={10} className={active ? 'text-blue-300' : 'text-stone-300'} />
                      <span className={clsx('text-[10px]', active ? 'text-blue-200' : 'text-stone-400')}>{client.country} · {client.countryCode}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* File browser — hidden on mobile when no client is selected */}
        <div className={clsx('flex-1 min-w-0', !selected ? 'hidden md:block' : 'block')}>
          {/* Mobile back to client list */}
          {selected && (
            <button
              onClick={() => { setSelected(null); setOpenFolder(null); }}
              className="md:hidden mb-3 flex items-center gap-1 text-sm text-blue-600 font-medium"
            >
              <ChevronLeft size={16} />
              거래처 목록
            </button>
          )}
          {/* Google Drive Banner */}
          <GoogleDriveBanner
            driveState={driveState}
            userPlan={userPlan}
            onConnect={() => setShowOAuth(true)}
            onDisconnect={() => { disconnectDrive(); setDriveState(null); }}
            onUpgrade={() => { const s = upgradeToPremium(); if (s) setDriveState(s); }}
          />

          {!selected ? (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Folder size={40} className="opacity-30" />
              <p className="text-sm">왼쪽에서 거래처를 선택하세요</p>
              <p className="text-xs text-stone-300">거래처별 파일을 폴더 구조로 관리합니다</p>
            </div>
          ) : (
            <div>
              {/* Client header */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-800">{selected.company}</p>
                  <p className="text-xs text-stone-400">
                    {selected.country} ({selected.countryCode})
                    {selected.contactName && ` · ${selected.contactName}`}
                    {selected.contactEmail && ` · ${selected.contactEmail}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                >
                  <Upload size={13} />
                  파일 업로드
                </button>
              </div>

              {Object.keys(filesByProduct).length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center text-stone-400 text-sm">
                  <File size={32} className="mx-auto mb-2 opacity-20" />
                  파일이 없습니다. 업로드 버튼을 눌러 시작하세요.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(filesByProduct).map(([product, pFiles]) => {
                    const isOpen = openFolder === product;
                    const latest = pFiles.find(f => f.isLatest);
                    const q = search.toLowerCase();
                    const productMatches = !search || product.toLowerCase().includes(q);
                    const shown = !search
                      ? pFiles
                      : productMatches
                        ? pFiles
                        : pFiles.filter(f =>
                            f.filename.toLowerCase().includes(q) ||
                            (f.tags ?? []).some(t => t.toLowerCase().includes(q))
                          );
                    if (search && shown.length === 0) return null;

                    return (
                      <div key={product} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setOpenFolder(isOpen ? null : product)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                        >
                          {isOpen
                            ? <FolderOpen size={16} className="text-blue-500" />
                            : <Folder size={16} className="text-amber-500" />}
                          <span className="text-sm font-semibold text-stone-700 flex-1 text-left">{product}</span>
                          <span className="text-[10px] text-stone-400">{pFiles.length}개 파일</span>
                          {latest && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              v{latest.version} 최신
                            </span>
                          )}
                          <ChevronRight size={14} className={clsx('text-stone-300 transition-transform', isOpen && 'rotate-90')} />
                        </button>

                        {isOpen && (
                          <div className="border-t border-stone-50">
                            {shown.sort((a, b) => b.version - a.version).map(file => (
                              <div key={file.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0', typeColor(file.fileType))}>
                                  {file.fileType.slice(1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-medium text-stone-700 truncate">{file.filename}</span>
                                    {file.isLatest && <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">최신</span>}
                                    <StorageBadge dest={storageMap[file.id]} />
                                    {(file.tags ?? []).map(t => (
                                      <span key={t} className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{t}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                                    <Clock size={9} />
                                    {fmtDate(file.uploadedAt)}
                                    <span>·</span>
                                    <span>v{file.version}</span>
                                    <span>·</span>
                                    <span>{fmtSize(file.sizeBytes)}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { window.location.href = `/print/upload?reorder=true&clientId=${selected.id}&fileId=${file.id}&filename=${encodeURIComponent(file.filename)}`; }}
                                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700"
                                >
                                  <ShoppingCart size={10} />
                                  재주문
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} onSave={handleAddClient} />}
      {showUpload && selected && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSave={handleUploadFile}
          driveState={driveState}
        />
      )}
      {showOAuth && (
        <OAuthModal
          userPlan={userPlan}
          onDone={(state) => { setDriveState(state); setShowOAuth(false); }}
          onClose={() => setShowOAuth(false)}
        />
      )}
    </div>
  );
}
