'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Calculator,
  Upload,
  MessageSquare,
  Package,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  CreditCard,
  FileText,
  Tag,
  Layers,
  Sticker,
  Box,
  Folder,
  Scale,
  Palette,
  HeartPulse,
  Building2,
  GraduationCap,
  Briefcase,
  Zap,
} from 'lucide-react';
import { PRINT_PRODUCTS } from '@/lib/db/print';
import { PrintCategory } from '@/types/print';
import { clsx } from 'clsx';

const CATEGORIES: { id: PrintCategory | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all', label: '전체', icon: Layers, color: 'bg-stone-100 text-stone-600' },
  { id: 'business-card', label: '명함', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
  { id: 'flyer', label: '전단·리플렛', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'booklet', label: '책자·카탈로그', icon: Tag, color: 'bg-violet-100 text-violet-700' },
  { id: 'banner', label: '배너·현수막', icon: Sticker, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'sticker', label: '스티커·라벨', icon: Sparkles, color: 'bg-teal-100 text-teal-700' },
  { id: 'package', label: '패키지·박스', icon: Box, color: 'bg-emerald-100 text-emerald-700' },
];

const CATEGORY_LABELS: Record<PrintCategory, string> = {
  'business-card': '명함',
  flyer: '전단',
  booklet: '책자',
  banner: '배너',
  sticker: '스티커',
  package: '패키지',
};

// ── 직업별 명함 추천 데이터 ─────────────────────────────────────────────────────
interface ProfessionCard {
  id: string;
  name: string;
  industry: string;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  cardBg: string;
  frontLines: string[];
  backLines: string[];
  paper: string;
  coating: string;
  tip: string;
}

const PROFESSION_CARDS: ProfessionCard[] = [
  {
    id: 'lawyer',
    name: '변호사 · 법무사',
    industry: '법률',
    icon: Scale,
    accentColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
    cardBg: 'from-blue-900 to-blue-700',
    frontLines: ['변호사  홍길동', '민사 · 형사 · 기업법무', '법무법인 ○○○', 'T. 02-000-0000'],
    backLines: ['초기 법률상담 무료', '평일 09:00–18:00', 'contact@lawfirm.kr'],
    paper: '두꺼운 아트지 350g',
    coating: '무광 코팅 (매트)',
    tip: '신뢰감을 주는 다크 컬러 + 무광 코팅이 법률 전문가에 잘 어울립니다.',
  },
  {
    id: 'accountant',
    name: '세무사 · 회계사',
    industry: '세무·회계',
    icon: Calculator,
    accentColor: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    cardBg: 'from-emerald-800 to-teal-700',
    frontLines: ['세무사  김세무', '법인세 · 소득세 · 부가세', '○○세무회계사무소', 'T. 031-000-0000'],
    backLines: ['무료 세무상담 진행 중', '창업 · 법인 전문', 'tax@office.kr'],
    paper: '스노우 화이트 250g',
    coating: '유광 코팅',
    tip: '깔끔한 화이트 배경에 포인트 컬러 로고로 전문성을 강조하세요.',
  },
  {
    id: 'designer',
    name: '디자이너 · 크리에이터',
    industry: '디자인',
    icon: Palette,
    accentColor: 'text-violet-700',
    iconBg: 'bg-violet-50',
    cardBg: 'from-violet-700 to-pink-600',
    frontLines: ['디자이너  이아름', 'Brand · UX · Illustration', 'Studio AIZET', 'hello@studio.kr'],
    backLines: ['포트폴리오: behance.net/aizet', 'Instagram: @studio.aizet'],
    paper: '모조지 (크라프트)',
    coating: 'UV 스팟 코팅',
    tip: '개성 있는 질감의 모조지 + UV 스팟 코팅으로 첫인상을 차별화하세요.',
  },
  {
    id: 'doctor',
    name: '의사 · 한의사',
    industry: '의료',
    icon: HeartPulse,
    accentColor: 'text-red-700',
    iconBg: 'bg-red-50',
    cardBg: 'from-slate-700 to-blue-800',
    frontLines: ['원장  박건강 (의학박사)', '내과 · 가정의학과', '○○의원', 'T. 02-000-0000'],
    backLines: ['진료시간 평일 09:00–18:00', '토 09:00–13:00 / 일·공휴일 휴진', 'www.clinic.kr'],
    paper: '두꺼운 아트지 350g',
    coating: '무광 코팅 (매트)',
    tip: '차분한 네이비/그레이 계열로 안정감을 주되 로고와 직함을 크게 강조하세요.',
  },
  {
    id: 'architect',
    name: '건축사 · 인테리어',
    industry: '건축·인테리어',
    icon: Building2,
    accentColor: 'text-stone-700',
    iconBg: 'bg-stone-100',
    cardBg: 'from-stone-800 to-stone-600',
    frontLines: ['건축사  최설계', 'Architecture · Interior', '○○건축사사무소', 'T. 02-000-0000'],
    backLines: ['주거 · 상업 · 리모델링', '포트폴리오 → QR 코드', 'design@arch.kr'],
    paper: '두꺼운 아트지 350g',
    coating: '무광 코팅 + 후면 QR',
    tip: '후면에 QR 코드로 포트폴리오를 연결하면 공간 설계 역량을 즉시 보여줄 수 있습니다.',
  },
  {
    id: 'educator',
    name: '교수 · 강사 · 컨설턴트',
    industry: '교육·컨설팅',
    icon: GraduationCap,
    accentColor: 'text-amber-700',
    iconBg: 'bg-amber-50',
    cardBg: 'from-amber-700 to-orange-600',
    frontLines: ['컨설턴트  정전문', 'MBA · 경영전략 · 강의', '○○컨설팅그룹', 'T. 010-0000-0000'],
    backLines: ['강연·워크숍 문의 환영', '저서: ○○○ 외 3권', 'consult@pro.kr'],
    paper: '스노우 화이트 250g',
    coating: '유광 코팅',
    tip: '강연 분야와 저서를 뒷면에 담아 전문성을 한눈에 전달하세요.',
  },
];

// ── 미니 명함 미리보기 ───────────────────────────────────────────────────────────
function MiniCardMockup({ card }: { card: ProfessionCard }) {
  return (
    <div className="flex gap-1.5">
      {/* Front */}
      <div className={clsx(
        'flex-1 rounded-lg p-2.5 bg-gradient-to-br text-white',
        card.cardBg
      )} style={{ aspectRatio: '1.75/1', minHeight: 72 }}>
        <div className="flex flex-col gap-0.5 h-full justify-center">
          {card.frontLines.map((line, i) => (
            <p key={i} className={clsx(
              'leading-tight',
              i === 0 ? 'text-[8px] font-bold' : 'text-[6px] opacity-75'
            )}>
              {line}
            </p>
          ))}
        </div>
      </div>
      {/* Back */}
      <div className="flex-1 rounded-lg p-2.5 bg-stone-100 border border-stone-200"
        style={{ aspectRatio: '1.75/1', minHeight: 72 }}>
        <div className="flex flex-col gap-0.5 h-full justify-center">
          {card.backLines.map((line, i) => (
            <p key={i} className="text-[6px] text-stone-500 leading-tight">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 직업별 명함 추천 섹션 ─────────────────────────────────────────────────────────
function ProfessionRecommendSection({ onQuote }: { onQuote: (prof: ProfessionCard) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase size={15} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-stone-800 text-base flex items-center gap-2">
            직업별 명함 추천
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={9} />
              업종 연동
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            AIZET에 등록된 업종별 맞춤 문구·디자인 옵션을 자동으로 제안합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROFESSION_CARDS.map(card => {
          const Icon = card.icon;
          const isSelected = selected === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setSelected(isSelected ? null : card.id)}
              className={clsx(
                'rounded-2xl border-2 cursor-pointer transition-all overflow-hidden',
                isSelected ? 'border-blue-500 shadow-md' : 'border-stone-100 hover:border-blue-200 shadow-sm'
              )}
            >
              {/* Card header */}
              <div className="bg-white p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                    <Icon size={15} className={card.accentColor} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800 leading-tight">{card.name}</p>
                    <p className="text-[10px] text-stone-400">{card.industry}</p>
                  </div>
                </div>

                {/* Mini card preview */}
                <MiniCardMockup card={card} />
              </div>

              {/* Expanded details */}
              {isSelected && (
                <div className="border-t border-stone-100 bg-stone-50 px-4 py-3 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">추천 용지</p>
                      <p className="text-xs text-stone-700 font-medium">{card.paper}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">추천 코팅</p>
                      <p className="text-xs text-stone-700 font-medium">{card.coating}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100">
                    💡 {card.tip}
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">
                  {isSelected ? '옵션 확인됨' : '클릭해서 상세 보기'}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); onQuote(card); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors"
                >
                  이 스타일로 견적
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-industry connection banner */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-900">AIZET 업종 연동 인쇄</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            법률·의료·교육 등 AIZET에 등록된 업종 정보가 인쇄 서비스와 연동됩니다.
            업체명·연락처가 자동으로 채워지며 업종에 맞는 디자인 가이드를 제안합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrintCatalogPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<PrintCategory | 'all'>('all');

  const filtered = selectedCategory === 'all'
    ? PRINT_PRODUCTS
    : PRINT_PRODUCTS.filter((p) => p.category === selectedCategory);

  function handleProfessionQuote(card: ProfessionCard) {
    router.push(`/print/quote?category=business-card&size=${encodeURIComponent('90×50mm')}&profession=${card.id}`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl">
              <Image
                src="/print/fullinkey-logo.png"
                alt="풀린키"
                fill
                className="object-cover object-left"
              />
            </div>
            <span className="font-bold text-lg text-stone-800 tracking-tight">풀린키</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: '/print/quote', icon: Calculator, label: '견적 계산기' },
              { href: '/print/upload', icon: Upload, label: '파일 업로드' },
              { href: '/print/files', icon: Folder, label: '거래처 파일' },
              { href: '/print/labels', icon: Tag, label: '라벨 생성기' },
              { href: '/print/chat', icon: MessageSquare, label: 'AI 상담' },
              { href: '/print/status', icon: Package, label: '주문 현황' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/print/quote"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Calculator size={13} />
            견적 받기
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-white py-14 px-4 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/print/print-facility-wide.jpg"
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/print/print-walkthrough.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/88 via-blue-800/80 to-indigo-900/75" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={11} />
              AI 상담 · 실시간 견적
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 leading-tight">
            빠르고 정확한<br />맞춤 인쇄 서비스
          </h1>
          <p className="text-blue-200 text-lg mb-7 max-w-lg">
            디지털 컬러·흑백 윤전기와 후가공 장비가 완전 자동화 —<br className="hidden sm:block" />
            명함부터 패키지까지 AI가 최적 옵션을 안내하고 실시간 견적을 제공합니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/print/quote')}
              className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl text-xl hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Calculator size={15} />
              견적 계산기
            </button>
            <button
              onClick={() => router.push('/print/chat')}
              className="flex items-center gap-2 px-8 py-4 bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold rounded-xl text-xl transition-colors border border-white/20"
            >
              <MessageSquare size={15} />
              AI 상담하기
            </button>
          </div>

          {/* New feature quick links */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { href: '/print/files', icon: Folder, label: '거래처 파일 관리', sub: '버전 관리 · 재주문' },
              { href: '/print/labels', icon: Tag, label: '수출 라벨 생성기', sub: '18개국 · 인증마크 자동포함' },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-colors"
              >
                <Icon size={14} className="text-blue-200" />
                <div>
                  <p className="font-semibold text-xs leading-tight">{label}</p>
                  <p className="text-[10px] text-blue-300">{sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { icon: Clock, text: '당일 납기 가능' },
              { icon: Star, text: '업계 최저가 보장' },
              { icon: Sparkles, text: 'AI 파일 검수' },
              { icon: Package, text: '전국 무료 배송 (5만원↑)' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 bg-white/10 text-blue-100 text-xs px-3 py-1.5 rounded-full">
                <Icon size={11} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facility section */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-7">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">설비 소개</p>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              디지털 컬러·흑백 윤전기와<br />후가공 장비가 완전 자동화
            </h2>
            <p className="text-sm text-stone-500 mt-2.5 max-w-lg leading-relaxed">
              최신 디지털 윤전기와 자동화 후가공 라인을 직접 운용하여 소량 단가부터 대량 인쇄까지 균일한 품질과 빠른 납기를 보장합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 디지털 윤전기 */}
            <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
              <div className="relative h-52">
                <Image
                  src="/print/print-digital-press.jpg"
                  alt="디지털 윤전기"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-stone-900 text-sm mb-1.5">디지털 컬러 · 흑백 윤전기</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  고속 디지털 컬러 및 흑백 윤전기를 직접 운용합니다. 소량 주문도 대량과 동일한 색 정확도로 출력하며, 색상 프로파일 관리로 재주문 시에도 동일한 결과를 보장합니다.
                </p>
              </div>
            </div>
            {/* 후가공 자동화 */}
            <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
              <div className="relative h-52">
                <Image
                  src="/print/print-finishing-line.jpg"
                  alt="후가공 자동화 라인"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-stone-900 text-sm mb-1.5">후가공 자동화 라인</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  코팅·재단·제본·포장까지 완전 자동화된 후가공 라인을 갖추고 있습니다. 수작업 오차 없이 균일한 품질을 유지하며, 당일 납기 생산을 실현합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products flatlay section */}
      <section className="bg-[#fafaf8] border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm flex flex-col sm:flex-row">
            <div className="relative sm:w-[55%] h-56 sm:h-auto shrink-0">
              <Image
                src="/print/print-products-flatlay.jpg"
                alt="완성 인쇄물 플랫레이"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white px-7 py-8 flex flex-col justify-center gap-3">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">완성 인쇄물</p>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
                완성도 높은 인쇄물,<br />직접 확인하세요
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                명함·전단·카탈로그·패키지까지 — 완전 자동화 설비에서 생산된 결과물입니다.
                소량부터 대량까지 동일한 색 재현율과 후가공 품질을 보장합니다.
              </p>
              <button
                onClick={() => router.push('/print/quote')}
                className="mt-1 self-start flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <Calculator size={13} />
                견적 받기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile nav */}
      <div className="sm:hidden bg-white border-b border-stone-100 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { href: '/print/quote', icon: Calculator, label: '견적' },
          { href: '/print/upload', icon: Upload, label: '파일업로드' },
          { href: '/print/files', icon: Folder, label: '거래처파일' },
          { href: '/print/labels', icon: Tag, label: '라벨생성' },
          { href: '/print/chat', icon: MessageSquare, label: 'AI상담' },
          { href: '/print/status', icon: Package, label: '주문현황' },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 text-xs text-stone-600 hover:border-blue-400 transition-colors"
          >
            <Icon size={12} />
            {label}
          </Link>
        ))}
      </div>

      {/* Category filter */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-blue-300'
                )}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <main className="max-w-5xl mx-auto w-full px-4 py-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (

            <div
              key={product.id}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
            >
              {/* Product color bar */}
              <div className="h-2 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-500" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                    {product.popular && (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        인기
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Clock size={10} />
                    {product.turnaround}
                  </div>
                </div>

                <h3 className="font-bold text-stone-800 text-sm mt-2 mb-1">{product.name}</h3>
                <p className="text-xs text-stone-500 leading-relaxed mb-3">{product.description}</p>

                {/* Sizes */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.sizes.slice(0, 3).map((size) => (
                    <span key={size} className="text-[10px] bg-stone-50 border border-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                      {size}
                    </span>
                  ))}
                  {product.sizes.length > 3 && (
                    <span className="text-[10px] text-stone-400">+{product.sizes.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-stone-400">기준가</p>
                    <p className="font-bold text-blue-700">
                      {product.basePrice.toLocaleString()}원
                      <span className="text-xs font-normal text-stone-400 ml-1">/ {product.baseQuantity}부</span>
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/print/quote?category=${product.category}&size=${encodeURIComponent(product.sizes[0])}`)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors group-hover:shadow-sm"
                  >
                    견적보기
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 직업별 명함 추천 — 명함 카테고리 선택 시 표시 */}
        {selectedCategory === 'business-card' && (
          <ProfessionRecommendSection onQuote={handleProfessionQuote} />
        )}
      </main>
    </div>
  );
}
