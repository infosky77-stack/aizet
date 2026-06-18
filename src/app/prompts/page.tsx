'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ALL_PROMPTS,
  INDUSTRY_META,
  type PromptCategory,
  type AITool,
  type PromptItem,
} from '@/lib/prompts-data';
import {
  Copy,
  Check,
  Lightbulb,
  Search,
  ArrowLeft,
  Image,
  Video,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Constants ─────────────────────────────────────────── */

const CATEGORY_META: Record<PromptCategory, { label: string; Icon: React.ElementType }> = {
  image: { label: '이미지', Icon: Image },
  video: { label: '영상', Icon: Video },
  sns:   { label: 'SNS 콘텐츠', Icon: Share2 },
};

const TOOL_LABEL: Record<AITool, string> = {
  midjourney:       'Midjourney',
  'dall-e':         'DALL·E',
  'stable-diffusion': 'Stable Diffusion',
  sora:             'Sora',
  runway:           'Runway',
  kling:            'Kling AI',
};

const TOOL_COLOR: Record<AITool, string> = {
  midjourney:         'bg-indigo-100 text-indigo-700',
  'dall-e':           'bg-emerald-100 text-emerald-700',
  'stable-diffusion': 'bg-violet-100 text-violet-700',
  sora:               'bg-blue-100 text-blue-700',
  runway:             'bg-rose-100 text-rose-700',
  kling:              'bg-orange-100 text-orange-700',
};

/* ─── CopyButton ────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

/* ─── PromptCard ────────────────────────────────────────── */
function PromptCard({ item }: { item: PromptItem }) {
  const [expanded, setExpanded] = useState(false);
  const { label, Icon } = CATEGORY_META[item.category];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">
              <Icon size={11} />
              {label}
            </span>
          </div>
          <CopyButton text={item.prompt} />
        </div>

        <h3 className="font-bold text-stone-800 text-base leading-snug">{item.title}</h3>
        <p className="text-stone-500 text-xs leading-relaxed">{item.description}</p>

        {/* AI Tools */}
        <div className="flex flex-wrap gap-1.5">
          {item.tools.map((tool) => (
            <span key={tool} className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full', TOOL_COLOR[tool])}>
              {TOOL_LABEL[tool]}
            </span>
          ))}
        </div>
      </div>

      {/* Prompt body */}
      <div className="px-5 pb-2">
        <div
          className={clsx(
            'bg-stone-50 border border-stone-100 rounded-xl p-3 text-[11px] text-stone-500 font-mono leading-relaxed transition-all overflow-hidden',
            expanded ? '' : 'max-h-16'
          )}
          style={expanded ? undefined : { WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}
        >
          {item.prompt}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600 mt-1.5 ml-0.5 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? '접기' : '프롬프트 전체 보기'}
        </button>
      </div>

      {/* Tags & tip */}
      <div className="px-5 py-4 flex flex-col gap-2.5 mt-auto">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        {item.tip && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <Lightbulb size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">{item.tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function PromptsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('restaurant');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [selectedTool, setSelectedTool] = useState<AITool | 'all'>('all');
  const [search, setSearch] = useState('');

  const industryPrompts = useMemo(
    () => ALL_PROMPTS.filter((p) => p.industryId === selectedIndustry),
    [selectedIndustry]
  );

  const filtered = useMemo(() => {
    return industryPrompts.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedTool !== 'all' && !p.tools.includes(selectedTool)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [industryPrompts, selectedCategory, selectedTool, search]);

  const availableTools = useMemo<AITool[]>(() => {
    const set = new Set<AITool>();
    industryPrompts.forEach((p) => p.tools.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [industryPrompts]);

  const currentIndustry = INDUSTRY_META.find((m) => m.id === selectedIndustry)!;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: industryPrompts.length };
    for (const cat of ['image', 'video', 'sns'] as PromptCategory[]) {
      counts[cat] = industryPrompts.filter((p) => p.category === cat).length;
    }
    return counts;
  }, [industryPrompts]);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
            홈
          </Link>
          <div className="w-px h-4 bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">AI</span>
            </div>
            <span className="font-bold text-stone-800 text-sm">AIZET 프롬프트 라이브러리</span>
          </div>
          <div className="ml-auto text-xs text-stone-400 hidden sm:block">
            업종별 AI 마케팅 프롬프트 모음
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Hero */}
        <div className="text-center flex flex-col gap-3 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            업종별 AI 마케팅 프롬프트
          </h1>
          <p className="text-stone-500 text-sm max-w-lg mx-auto leading-relaxed">
            복사 한 번으로 Midjourney·DALL·E·Runway 등에서 바로 사용할 수 있는
            소상공인 맞춤 프롬프트입니다.
          </p>
        </div>

        {/* Industry tabs (horizontal scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {INDUSTRY_META.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedIndustry(m.id);
                setSelectedCategory('all');
                setSelectedTool('all');
                setSearch('');
              }}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shrink-0 transition-all',
                selectedIndustry === m.id
                  ? `${m.bg} ${m.color} border-current`
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
              )}
            >
              <span>{m.emoji}</span>
              {m.name}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="제목, 설명, 태그 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 bg-white border border-stone-200 rounded-xl p-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                selectedCategory === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              )}
            >
              전체 {categoryCounts.all}
            </button>
            {(Object.keys(CATEGORY_META) as PromptCategory[]).map((cat) => {
              const { label, Icon } = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    selectedCategory === cat
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-500 hover:text-stone-800'
                  )}
                >
                  <Icon size={11} />
                  {label}
                  {categoryCounts[cat] > 0 && (
                    <span className={clsx('ml-0.5', selectedCategory === cat ? 'text-stone-300' : 'text-stone-400')}>
                      {categoryCounts[cat]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tool filter */}
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value as AITool | 'all')}
            className="px-3 py-2.5 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 text-stone-600 transition-colors cursor-pointer"
          >
            <option value="all">모든 AI 툴</option>
            {availableTools.map((t) => (
              <option key={t} value={t}>{TOOL_LABEL[t]}</option>
            ))}
          </select>
        </div>

        {/* Result header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentIndustry.emoji}</span>
            <span className="font-bold text-stone-800">{currentIndustry.name}</span>
            <span className="text-stone-400 text-sm">· {filtered.length}개 프롬프트</span>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
            {filtered.map((item) => (
              <PromptCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-stone-400">
            <Search size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">검색 결과가 없습니다</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedTool('all'); }}
              className="text-xs text-amber-600 hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
