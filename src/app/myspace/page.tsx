'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Upload, Lock, Link2, KeyRound, Globe, Image, Video,
  Wand2, Copy, Check, X, Eye, EyeOff, Plus, Pencil, Trash2,
  Share2, Shield, BookOpen, ChevronDown, Search, Play,
  User, ExternalLink, Cloud, HardDrive,
} from 'lucide-react';
import { fmtBytes, type DriveState } from '@/lib/google-drive';
import { useSession } from '@/hooks/useSession';
import { ALL_PROMPTS, INDUSTRY_META, type PromptCategory } from '@/lib/prompts-data';

/* ─── Types ─────────────────────────────────────────────── */
type Privacy = 'private' | 'link' | 'password';
type MediaType = 'image' | 'video';

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  privacy: Privacy;
  password?: string;
  createdAt: string;
  driveLinked: boolean;
  color: string;
  emoji: string;
}

interface Profile {
  name: string;
  bio: string;
  link: string;
  emoji: string;
}

/* ─── Constants ─────────────────────────────────────────── */
const COLORS = [
  'from-violet-400 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
  'from-teal-400 to-emerald-600',
  'from-blue-400 to-indigo-600',
  'from-fuchsia-400 to-violet-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];
const EMOJIS = ['🌊', '🌸', '🌿', '🔥', '🌙', '⭐', '🎵', '🦋', '🌈', '🍃', '✨', '🎬', '📸', '🎨', '🌺', '🏔️'];

const STORAGE_KEY = 'myspace_data';

const PRIVACY_META: Record<Privacy, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  private: {
    label: '완전 비공개',
    icon: <Lock size={12} />,
    color: 'bg-stone-100 text-stone-600',
    desc: '나만 볼 수 있습니다',
  },
  link: {
    label: '링크 공유',
    icon: <Link2 size={12} />,
    color: 'bg-blue-100 text-blue-700',
    desc: '링크를 아는 사람만 볼 수 있습니다',
  },
  password: {
    label: '암호 보호',
    icon: <KeyRound size={12} />,
    color: 'bg-amber-100 text-amber-700',
    desc: '비밀번호를 입력해야 볼 수 있습니다',
  },
};

/* ─── Seed data ──────────────────────────────────────────── */
function seedItems(): MediaItem[] {
  const now = Date.now();
  return [
    { id: '1', type: 'image', title: '제주 여행 사진 모음', privacy: 'link', createdAt: new Date(now - 86400000 * 2).toISOString(), driveLinked: true, color: COLORS[0], emoji: '🌊' },
    { id: '2', type: 'video', title: '가족 생일 파티 영상', privacy: 'private', createdAt: new Date(now - 86400000 * 5).toISOString(), driveLinked: false, color: COLORS[1], emoji: '🎬' },
    { id: '3', type: 'image', title: '일상 기록 2026', privacy: 'password', password: '1234', createdAt: new Date(now - 86400000 * 8).toISOString(), driveLinked: true, color: COLORS[2], emoji: '📸' },
    { id: '4', type: 'video', title: '반려동물 일기', privacy: 'link', createdAt: new Date(now - 86400000 * 12).toISOString(), driveLinked: false, color: COLORS[3], emoji: '🐾' },
    { id: '5', type: 'image', title: '요리 레시피 컬렉션', privacy: 'private', createdAt: new Date(now - 86400000 * 20).toISOString(), driveLinked: true, color: COLORS[4], emoji: '🍳' },
    { id: '6', type: 'video', title: '봄 산책 브이로그', privacy: 'link', createdAt: new Date(now - 86400000 * 30).toISOString(), driveLinked: false, color: COLORS[5], emoji: '🌸' },
  ];
}

/* ─── LocalStorage helpers ───────────────────────────────── */
function loadData(): { profile: Profile; items: MediaItem[] } {
  if (typeof window === 'undefined') return { profile: defaultProfile(), items: seedItems() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  const data = { profile: defaultProfile(), items: seedItems() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function defaultProfile(): Profile {
  return { name: '나의 공간', bio: '조용히 기록합니다 🌿', link: '', emoji: '🌿' };
}

function saveData(profile: Profile, items: MediaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, items }));
}

/* ─── CopyButton ─────────────────────────────────────────── */
function CopyButton({ text, label = '링크 복사' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all"
    >
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
      {copied ? '복사됨!' : label}
    </button>
  );
}

/* ─── PrivacyBadge ───────────────────────────────────────── */
function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  const m = PRIVACY_META[privacy];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.color}`}>
      {m.icon}
      {m.label}
    </span>
  );
}

/* ─── MediaCard ──────────────────────────────────────────── */
function MediaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Thumbnail */}
      <div className={`relative h-44 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
        <span className="text-5xl select-none">{item.emoji}</span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

        {item.type === 'video' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            <Play size={9} className="fill-white" />
            영상
          </div>
        )}
        {item.type === 'image' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            <Image size={9} />
            이미지
          </div>
        )}

        {item.driveLinked && (
          <div className="absolute top-3 right-3 bg-white/90 rounded-full p-1" title="구글 드라이브 연동">
            <Cloud size={12} className="text-blue-500" />
          </div>
        )}

        {/* Menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <Pencil size={11} />
        </button>

        {menuOpen && (
          <div className="absolute top-10 left-3 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-10 min-w-[130px]">
            <button
              onClick={() => { onEdit(item); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
            >
              <Pencil size={11} /> 편집
            </button>
            <button
              onClick={() => { onDelete(item.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={11} /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="font-semibold text-stone-800 text-sm leading-snug line-clamp-1">{item.title}</p>
        <div className="flex items-center justify-between">
          <PrivacyBadge privacy={item.privacy} />
          <span className="text-[11px] text-stone-400">{date}</span>
        </div>
        {item.privacy === 'link' && (
          <CopyButton text={`${typeof window !== 'undefined' ? window.location.origin : ''}/myspace/s/${item.id}`} label="링크 복사" />
        )}
      </div>
    </div>
  );
}

/* ─── Upload Modal ───────────────────────────────────────── */
function UploadModal({
  drive,
  onClose,
  onSave,
  editing,
}: {
  drive: DriveState | null;
  onClose: () => void;
  onSave: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  editing?: MediaItem;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [type, setType] = useState<MediaType>(editing?.type ?? 'image');
  const [privacy, setPrivacy] = useState<Privacy>(editing?.privacy ?? 'private');
  const [password, setPassword] = useState(editing?.password ?? '');
  const [showPw, setShowPw] = useState(false);
  const [driveLinked, setDriveLinked] = useState(editing?.driveLinked ?? false);
  const [color] = useState(editing?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [emoji, setEmoji] = useState(editing?.emoji ?? EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

  function handleSubmit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), type, privacy, password: privacy === 'password' ? password : undefined, driveLinked, color, emoji });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">{editing ? '미디어 편집' : '새 미디어 업로드'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {/* Emoji picker */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2">썸네일 이모지</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${emoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-stone-50 hover:bg-stone-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-1.5">미디어 종류</p>
            <div className="grid grid-cols-2 gap-2">
              {(['image', 'video'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${type === t ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}
                >
                  {t === 'image' ? <Image size={15} /> : <Video size={15} />}
                  {t === 'image' ? '이미지' : '동영상'}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-1.5">공개 범위</p>
            <div className="flex flex-col gap-2">
              {(Object.entries(PRIVACY_META) as [Privacy, typeof PRIVACY_META[Privacy]][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setPrivacy(key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${privacy === key ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${privacy === key ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
                    {meta.icon}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${privacy === key ? 'text-amber-700' : 'text-stone-700'}`}>{meta.label}</p>
                    <p className="text-xs text-stone-400">{meta.desc}</p>
                  </div>
                  {privacy === key && <Check size={15} className="ml-auto text-amber-500 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {privacy === 'password' && (
              <div className="mt-2 relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            )}
          </div>

          {/* Google Drive */}
          <div className={`rounded-xl p-4 border ${drive?.connected ? 'border-blue-200 bg-blue-50' : 'border-stone-200 bg-stone-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${drive?.connected ? 'bg-blue-100' : 'bg-stone-200'}`}>
                  <Cloud size={15} className={drive?.connected ? 'text-blue-500' : 'text-stone-400'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">구글 드라이브</p>
                  {drive?.connected
                    ? <p className="text-xs text-blue-600">{drive.email} · {fmtBytes(drive.totalBytes - drive.usedBytes)} 남음</p>
                    : <p className="text-xs text-stone-400">연동하면 원본 화질로 저장</p>}
                </div>
              </div>
              {drive?.connected
                ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setDriveLinked(!driveLinked)}
                      className={`w-10 h-5 rounded-full transition-colors ${driveLinked ? 'bg-blue-500' : 'bg-stone-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${driveLinked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                )
                : (
                  <button
                    onClick={() => { window.location.href = '/api/auth/google?callbackUrl=/myspace'; }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    연동하기
                  </button>
                )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm transition-colors"
          >
            {editing ? '저장' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Prompt Helper Modal ────────────────────────────────── */
function PromptModal({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState<PromptCategory>('image');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = ALL_PROMPTS.filter(
    (p) => p.category === cat && (
      p.title.includes(search) || p.tags.some((t) => t.includes(search))
    )
  ).slice(0, 6);

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const catMeta: Record<PromptCategory, { label: string; icon: React.ReactNode }> = {
    image: { label: '이미지', icon: <Image size={13} /> },
    video: { label: '영상', icon: <Video size={13} /> },
    sns: { label: 'SNS', icon: <Share2 size={13} /> },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-amber-600" />
            <h2 className="font-bold text-stone-900">AI 프롬프트 도우미</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Category tabs */}
          <div className="flex gap-2">
            {(Object.entries(catMeta) as [PromptCategory, { label: string; icon: React.ReactNode }][]).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setCat(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${cat === key ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="프롬프트 검색..."
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Prompts */}
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">검색 결과가 없습니다</p>
            )}
            {filtered.map((p) => (
              <div key={p.id} className="border border-stone-100 rounded-xl p-3.5 flex flex-col gap-2 hover:border-stone-200 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{p.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tools.map((t) => (
                        <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => copy(p.id, p.prompt)}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all ${copiedId === p.id ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    {copiedId === p.id ? <Check size={10} /> : <Copy size={10} />}
                    {copiedId === p.id ? '복사됨' : '복사'}
                  </button>
                </div>
                <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5">
          <Link
            href="/prompts"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors"
          >
            <BookOpen size={14} />
            전체 프롬프트 라이브러리 보기
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Edit Modal ─────────────────────────────────── */
function ProfileModal({ profile, onClose, onSave }: {
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [link, setLink] = useState(profile.link);
  const [emoji, setEmoji] = useState(profile.emoji);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">프로필 편집</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Avatar emoji */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2">프로필 이모지</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${emoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-stone-50 hover:bg-stone-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="나만의 공간 이름"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="한 줄 소개..."
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">외부 링크 (선택)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors">
            취소
          </button>
          <button
            onClick={() => { onSave({ name, bio, link, emoji }); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function MySpacePage() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [items, setItems] = useState<MediaItem[]>([]);
  const [drive, setDrive] = useState<DriveState | null>(null);
  const [filter, setFilter] = useState<'all' | MediaType>('all');
  const [modal, setModal] = useState<'upload' | 'prompt' | 'profile' | null>(null);
  const [editing, setEditing] = useState<MediaItem | undefined>(undefined);

  useEffect(() => {
    const data = loadData();
    setProfile(data.profile);
    setItems(data.items);
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!session.driveConnected) { setDrive(null); return; }
    fetch('/api/drive/quota')
      .then(r => r.ok ? r.json() : null)
      .then(q => {
        if (!q) return;
        setDrive({
          connected: true,
          email: session.email,
          tier: session.plan === 'free' ? 'basic' : 'premium',
          usedBytes: q.usageInDrive ?? q.usage ?? 0,
          totalBytes: q.limit ?? (session.plan === 'free' ? 15 * 1024 ** 3 : 2 * 1024 ** 4),
          connectedAt: new Date().toISOString(),
        });
      })
      .catch(() => {});
  }, [session]);

  const persist = useCallback((p: Profile, its: MediaItem[]) => {
    setProfile(p);
    setItems(its);
    saveData(p, its);
  }, []);

  function handleSaveItem(partial: Omit<MediaItem, 'id' | 'createdAt'>) {
    if (editing) {
      const updated = items.map((i) => i.id === editing.id ? { ...i, ...partial } : i);
      persist(profile, updated);
    } else {
      const newItem: MediaItem = {
        ...partial,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      persist(profile, [newItem, ...items]);
    }
    setEditing(undefined);
  }

  function handleDelete(id: string) {
    persist(profile, items.filter((i) => i.id !== id));
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);
  const stats = {
    total: items.length,
    private: items.filter((i) => i.privacy === 'private').length,
    linked: items.filter((i) => i.privacy === 'link').length,
    password: items.filter((i) => i.privacy === 'password').length,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors text-sm font-medium">
            <ArrowLeft size={16} />
            AIZET
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Shield size={11} />
              나만의 공간
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal('prompt')}
              className="flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
            >
              <Wand2 size={15} />
              <span className="hidden sm:block">AI 프롬프트</span>
            </button>
            <button
              onClick={() => { setEditing(undefined); setModal('upload'); }}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} />
              업로드
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600" />
          <div className="px-6 pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-4xl flex-shrink-0">
              {profile.emoji}
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-0">
              <div>
                <h1 className="text-xl font-bold text-stone-900">{profile.name}</h1>
                <p className="text-stone-500 text-sm mt-0.5">{profile.bio}</p>
                {profile.link && (
                  <a href={profile.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1">
                    <ExternalLink size={11} />
                    {profile.link.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <button
                onClick={() => setModal('profile')}
                className="flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 px-4 py-2 rounded-xl transition-all"
              >
                <Pencil size={13} />
                프로필 편집
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="border-t border-stone-100 px-6 py-3 grid grid-cols-4 gap-2">
            {[
              { label: '전체', value: stats.total, icon: <HardDrive size={12} />, active: filter === 'all', onClick: () => setFilter('all') },
              { label: '비공개', value: stats.private, icon: <Lock size={12} />, active: false, onClick: () => {} },
              { label: '링크공유', value: stats.linked, icon: <Link2 size={12} />, active: false, onClick: () => {} },
              { label: '암호', value: stats.password, icon: <KeyRound size={12} />, active: false, onClick: () => {} },
            ].map(({ label, value, icon, active, onClick }) => (
              <button key={label} onClick={onClick} className="flex flex-col items-center gap-0.5 py-1 group">
                <span className="flex items-center gap-1 text-xs text-stone-400 group-hover:text-stone-600">
                  {icon}
                  {label}
                </span>
                <span className="font-bold text-stone-800 text-sm">{value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy notice */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Shield size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-800">프라이버시 우선 공간</p>
            <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
              댓글·좋아요·조회수 없음. 알고리즘 노출 없음. 내가 원하는 사람에게만 공유하는 순수 저장·공유 공간입니다.
            </p>
          </div>
        </div>

        {/* Filter + Drive status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1">
            {([['all', '전체'], ['image', '이미지'], ['video', '동영상']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === key ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {drive?.connected ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <Cloud size={13} className="text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">Drive 연동됨</span>
                <span className="text-xs text-blue-500">{fmtBytes(drive.totalBytes - drive.usedBytes)} 남음</span>
              </div>
            ) : (
              <button
                onClick={() => { window.location.href = '/api/auth/google?callbackUrl=/myspace'; }}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 bg-blue-50 px-3 py-2 rounded-xl transition-all"
              >
                <Cloud size={13} />
                구글 드라이브 연동
              </button>
            )}
          </div>
        </div>

        {/* Media grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-3xl">
              {filter === 'video' ? '🎬' : filter === 'image' ? '📸' : '🌿'}
            </div>
            <div className="text-center">
              <p className="font-semibold text-stone-700">미디어가 없습니다</p>
              <p className="text-sm text-stone-400 mt-1">첫 번째 미디어를 업로드해 보세요</p>
            </div>
            <button
              onClick={() => { setEditing(undefined); setModal('upload'); }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <Upload size={14} />
              업로드하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onEdit={(it) => { setEditing(it); setModal('upload'); }}
                onDelete={handleDelete}
              />
            ))}

            {/* Add card */}
            <button
              onClick={() => { setEditing(undefined); setModal('upload'); }}
              className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-stone-200 hover:border-amber-400 flex flex-col items-center justify-center gap-3 text-stone-400 hover:text-amber-600 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-sm font-semibold">새 미디어 추가</span>
            </button>
          </div>
        )}

        {/* AI Prompt float banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Wand2 size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-bold text-stone-800">AI로 미디어 만들기</p>
            <p className="text-sm text-stone-500 mt-0.5">Midjourney·Runway·Kling AI용 프롬프트를 바로 복사해서 콘텐츠를 제작하세요.</p>
          </div>
          <button
            onClick={() => setModal('prompt')}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Wand2 size={14} />
            프롬프트 보기
          </button>
        </div>
      </main>

      {/* Modals */}
      {modal === 'upload' && (
        <UploadModal
          drive={drive}
          editing={editing}
          onClose={() => { setModal(null); setEditing(undefined); }}
          onSave={handleSaveItem}
        />
      )}
      {modal === 'prompt' && <PromptModal onClose={() => setModal(null)} />}
      {modal === 'profile' && (
        <ProfileModal
          profile={profile}
          onClose={() => setModal(null)}
          onSave={(p) => persist(p, items)}
        />
      )}
    </div>
  );
}
