'use client';

import Link from 'next/link';
import {
  Phone, MapPin, Clock, Tag, CheckCircle,
  UtensilsCrossed, Coffee, Scissors, HeartPulse, Dumbbell,
  Building2, ShoppingBag, GraduationCap, BedDouble, Car,
  PawPrint, Briefcase, Star,
} from 'lucide-react';
import type { UserRecord, MenuItem } from '@/lib/users';
import type { SiteConfig } from '@/lib/siteConfig';
import { parseSiteConfig } from '@/lib/siteConfig';

// ── 업종별 메타 ────────────────────────────────────────────────────────────────
const INDUSTRY_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  accent: string;
  accentText: string;
  accentBg: string;
  tagline: string;
}> = {
  restaurant: {
    label: '식당',
    icon: <UtensilsCrossed size={28} />,
    gradient: 'from-amber-600 to-orange-700',
    accent: 'amber',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-50 border-amber-200',
    tagline: '맛있는 한 끼를 제공합니다',
  },
  cafe: {
    label: '카페·베이커리',
    icon: <Coffee size={28} />,
    gradient: 'from-orange-500 to-amber-700',
    accent: 'orange',
    accentText: 'text-orange-700',
    accentBg: 'bg-orange-50 border-orange-200',
    tagline: '편안한 휴식 공간을 만들어 드립니다',
  },
  beauty: {
    label: '미용실·헤어샵',
    icon: <Scissors size={28} />,
    gradient: 'from-rose-500 to-pink-700',
    accent: 'rose',
    accentText: 'text-rose-700',
    accentBg: 'bg-rose-50 border-rose-200',
    tagline: '당신에게 어울리는 스타일을 찾아드립니다',
  },
  clinic: {
    label: '병원·의원',
    icon: <HeartPulse size={28} />,
    gradient: 'from-emerald-600 to-teal-700',
    accent: 'emerald',
    accentText: 'text-emerald-700',
    accentBg: 'bg-emerald-50 border-emerald-200',
    tagline: '건강한 삶을 위해 함께합니다',
  },
  fitness: {
    label: '헬스·필라테스',
    icon: <Dumbbell size={28} />,
    gradient: 'from-violet-600 to-purple-700',
    accent: 'violet',
    accentText: 'text-violet-700',
    accentBg: 'bg-violet-50 border-violet-200',
    tagline: '더 건강하고 강한 나를 만들어 드립니다',
  },
  legal: {
    label: '법무사·세무사',
    icon: <Building2 size={28} />,
    gradient: 'from-blue-600 to-indigo-700',
    accent: 'blue',
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-50 border-blue-200',
    tagline: '전문적인 세무·법무 서비스를 제공합니다',
  },
  retail: {
    label: '소매·쇼핑몰',
    icon: <ShoppingBag size={28} />,
    gradient: 'from-emerald-500 to-green-700',
    accent: 'emerald',
    accentText: 'text-emerald-700',
    accentBg: 'bg-emerald-50 border-emerald-200',
    tagline: '특별한 상품을 합리적인 가격으로',
  },
  education: {
    label: '교육·학원',
    icon: <GraduationCap size={28} />,
    gradient: 'from-indigo-600 to-blue-700',
    accent: 'indigo',
    accentText: 'text-indigo-700',
    accentBg: 'bg-indigo-50 border-indigo-200',
    tagline: '체계적인 교육으로 실력을 키워드립니다',
  },
  hotel: {
    label: '숙박·펜션',
    icon: <BedDouble size={28} />,
    gradient: 'from-teal-600 to-cyan-700',
    accent: 'teal',
    accentText: 'text-teal-700',
    accentBg: 'bg-teal-50 border-teal-200',
    tagline: '편안한 쉼을 선사합니다',
  },
  auto: {
    label: '자동차·정비',
    icon: <Car size={28} />,
    gradient: 'from-slate-600 to-gray-700',
    accent: 'slate',
    accentText: 'text-slate-700',
    accentBg: 'bg-slate-50 border-slate-200',
    tagline: '차량 관리의 모든 것을 책임집니다',
  },
  pet: {
    label: '반려동물',
    icon: <PawPrint size={28} />,
    gradient: 'from-yellow-500 to-amber-600',
    accent: 'yellow',
    accentText: 'text-yellow-700',
    accentBg: 'bg-yellow-50 border-yellow-200',
    tagline: '소중한 반려동물을 정성껏 돌봅니다',
  },
  consulting: {
    label: '컨설팅·전문직',
    icon: <Briefcase size={28} />,
    gradient: 'from-stone-600 to-slate-700',
    accent: 'stone',
    accentText: 'text-stone-700',
    accentBg: 'bg-stone-50 border-stone-200',
    tagline: '전문 지식으로 최적의 솔루션을 제시합니다',
  },
};

const FALLBACK_META = {
  label: '비즈니스',
  icon: <Briefcase size={28} />,
  gradient: 'from-stone-600 to-slate-700',
  accent: 'stone',
  accentText: 'text-stone-700',
  accentBg: 'bg-stone-50 border-stone-200',
  tagline: '최고의 서비스를 제공합니다',
};

// 테마 키 → gradient/accent 오버라이드 (업종 기본값과 독립적으로 선택 가능)
const THEME_OVERRIDES: Record<string, Pick<typeof FALLBACK_META, 'gradient' | 'accent' | 'accentText' | 'accentBg'>> = {
  amber:   { gradient: 'from-amber-600 to-orange-700',   accent: 'amber',   accentText: 'text-amber-700',   accentBg: 'bg-amber-50 border-amber-200'   },
  rose:    { gradient: 'from-rose-500 to-pink-700',      accent: 'rose',    accentText: 'text-rose-700',    accentBg: 'bg-rose-50 border-rose-200'     },
  violet:  { gradient: 'from-violet-600 to-purple-700',  accent: 'violet',  accentText: 'text-violet-700',  accentBg: 'bg-violet-50 border-violet-200' },
  emerald: { gradient: 'from-emerald-600 to-teal-700',   accent: 'emerald', accentText: 'text-emerald-700', accentBg: 'bg-emerald-50 border-emerald-200'},
  blue:    { gradient: 'from-blue-600 to-indigo-700',    accent: 'blue',    accentText: 'text-blue-700',    accentBg: 'bg-blue-50 border-blue-200'     },
  orange:  { gradient: 'from-orange-500 to-amber-700',   accent: 'orange',  accentText: 'text-orange-700',  accentBg: 'bg-orange-50 border-orange-200' },
  slate:   { gradient: 'from-slate-600 to-gray-700',     accent: 'slate',   accentText: 'text-slate-700',   accentBg: 'bg-slate-50 border-slate-200'   },
};

interface Props {
  user: UserRecord;
  menuItems: MenuItem[];
  generatedImages?: { key: string; label: string; path: string }[];
  siteConfig?: SiteConfig;
}

export default function SiteHomePage({ user, menuItems, generatedImages, siteConfig }: Props) {
  const cfg: SiteConfig = siteConfig ?? parseSiteConfig(user.site_config);
  const baseMeta = INDUSTRY_META[user.industry] ?? FALLBACK_META;
  const meta = cfg.theme && THEME_OVERRIDES[cfg.theme]
    ? { ...baseMeta, ...THEME_OVERRIDES[cfg.theme] }
    : baseMeta;
  const tagline = cfg.tagline?.trim() || meta.tagline;
  const ctaText = cfg.cta_text?.trim() || '문의 · 예약';
  const hidden = new Set(cfg.sections_hidden ?? []);
  const shopName = user.shop_name || user.name + '님의 가게';

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={`bg-gradient-to-br ${meta.gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-6 opacity-80">
            {meta.icon}
            <span className="text-sm font-semibold uppercase tracking-widest">{meta.label}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{shopName}</h1>
          <p className="text-white/80 text-lg md:text-xl">{tagline}</p>

          {(user.phone || user.address) && (
            <div className="flex flex-wrap gap-4 mt-8">
              {user.phone && (
                <a
                  href={`tel:${user.phone.replace(/[^0-9]/g, '')}`}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <Phone size={15} />
                  {user.phone}
                </a>
              )}
              {user.address && (
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-xl text-sm text-white/80">
                  <MapPin size={15} />
                  {user.address}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 정보 카드 ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 -mt-6 mb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {user.phone && (
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.accentBg}`}>
                <Phone size={16} className={meta.accentText} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-0.5">전화번호</p>
                <a href={`tel:${user.phone.replace(/[^0-9]/g, '')}`} className={`text-sm font-bold ${meta.accentText} hover:underline`}>
                  {user.phone}
                </a>
              </div>
            </div>
          )}
          {user.address && (
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.accentBg}`}>
                <MapPin size={16} className={meta.accentText} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-0.5">주소</p>
                <p className="text-sm font-medium text-stone-800">{user.address}</p>
              </div>
            </div>
          )}
          {user.business_hours && (
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.accentBg}`}>
                <Clock size={16} className={meta.accentText} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400 mb-0.5">영업시간</p>
                <p className="text-sm font-medium text-stone-800 whitespace-pre-line">{user.business_hours}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── AI 생성 이미지 갤러리 ─────────────────────────────── */}
      {!hidden.has('gallery') && generatedImages && generatedImages.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-3 border ${meta.accentBg} ${meta.accentText}`}>
              포토 갤러리
            </div>
            <h2 className="text-2xl font-black text-stone-900">갤러리</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {generatedImages.map((img) => (
              <div key={img.key} className="aspect-video rounded-2xl overflow-hidden bg-stone-100 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.path}
                  alt={img.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-semibold">{img.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 메뉴·서비스 ───────────────────────────────────────── */}
      {!hidden.has('menu') && menuItems.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-3 border ${meta.accentBg} ${meta.accentText}`}>
              <Tag size={12} />
              메뉴 · 서비스
            </div>
            <h2 className="text-2xl font-black text-stone-900">주요 메뉴 &amp; 서비스</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className={`shrink-0 ${meta.accentText}`} />
                  <span className="font-semibold text-stone-800">{item.name}</span>
                </div>
                {item.price > 0 && (
                  <span className={`font-black text-sm ${meta.accentText}`}>
                    {item.price.toLocaleString()}원
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 소개 / 빈 상태 안내 ───────────────────────────────── */}
      {menuItems.length === 0 && !user.phone && !user.address && (
        <section className="max-w-4xl mx-auto px-4 mb-16 text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-300">
            <Star size={32} />
          </div>
          <p className="text-stone-500 text-sm">아직 가게 정보가 입력되지 않았습니다.</p>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 mt-4 bg-stone-900 hover:bg-stone-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            가게 정보 입력하기
          </Link>
        </section>
      )}

      {/* ── 하단 연락 CTA ──────────────────────────────────────── */}
      {!hidden.has('cta') && user.phone && (
        <section className={`bg-gradient-to-br ${meta.gradient}`}>
          <div className="max-w-4xl mx-auto px-4 py-12 text-center text-white">
            <h2 className="text-2xl font-black mb-2">{ctaText}</h2>
            <p className="text-white/80 text-sm mb-6">언제든지 편하게 연락주세요.</p>
            <a
              href={`tel:${user.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors"
            >
              <Phone size={20} />
              {user.phone}
            </a>
          </div>
        </section>
      )}

      {/* ── 푸터 ───────────────────────────────────────────────── */}
      <footer className="border-t border-stone-100 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p className="font-semibold text-stone-600">{shopName}</p>
          <p>
            Powered by{' '}
            <Link href="/" className="text-amber-600 font-bold hover:underline">AIZET</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
