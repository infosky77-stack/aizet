'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, ArrowRight, Bot, ShoppingCart, Star, Sparkles,
  CheckCircle, Truck, RefreshCw, Shield, Tag, Heart,
} from 'lucide-react';
import { useState } from 'react';
import { AdminModeButton } from '@/components/AdminModeButton';

// ── 카테고리 ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'outer',
    label: '아우터',
    desc: '코트 · 재킷 · 패딩',
    img: '/fashion/category-outer.jpg',
    color: 'bg-stone-50 border-stone-200',
    badge: 'bg-stone-700',
  },
  {
    key: 'top',
    label: '상의',
    desc: '티셔츠 · 니트 · 블라우스',
    img: '/fashion/category-top.jpg',
    color: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-600',
  },
  {
    key: 'bottom',
    label: '하의',
    desc: '팬츠 · 스커트 · 데님',
    img: '/fashion/category-bottom.jpg',
    color: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-600',
  },
  {
    key: 'acc',
    label: '액세서리',
    desc: '가방 · 스카프 · 모자',
    img: '/fashion/category-acc.jpg',
    color: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-600',
  },
];

// ── 상품 ────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    name: '오버핏 울 코트',
    category: '아우터',
    price: 148000,
    originalPrice: 198000,
    isNew: false,
    isBest: true,
    img: '/fashion/product-01.jpg',
    colors: ['#2C2C2C', '#8B7355', '#F5F0EB'],
    tags: ['겨울', '오피스룩', '데이트'],
  },
  {
    id: 2,
    name: '루즈핏 크루넥 니트',
    category: '상의',
    price: 72000,
    originalPrice: null,
    isNew: true,
    isBest: false,
    img: '/fashion/product-02.jpg',
    colors: ['#FDEBD0', '#D4E8D1', '#C8D4E8'],
    tags: ['데일리', '봄웜톤'],
  },
  {
    id: 3,
    name: '와이드 슬랙스',
    category: '하의',
    price: 75000,
    originalPrice: 95000,
    isNew: false,
    isBest: true,
    img: '/fashion/product-03.jpg',
    colors: ['#1C1C1C', '#4A3F35', '#8D8D8D'],
    tags: ['오피스룩', '데일리'],
  },
  {
    id: 4,
    name: '미니멀 크로스백',
    category: '액세서리',
    price: 89000,
    originalPrice: null,
    isNew: true,
    isBest: false,
    img: '/fashion/product-04.jpg',
    colors: ['#1C1C1C', '#8B6F47'],
    tags: ['데이트', '데일리'],
  },
  {
    id: 5,
    name: '리넨 오버핏 셔츠',
    category: '상의',
    price: 58000,
    originalPrice: null,
    isNew: true,
    isBest: false,
    img: '/fashion/product-05.jpg',
    colors: ['#F5F0EB', '#E8D5C4', '#C8D8C4'],
    tags: ['봄·여름', '데일리', '캐주얼'],
  },
  {
    id: 6,
    name: '플레어 미디 스커트',
    category: '하의',
    price: 62000,
    originalPrice: 82000,
    isNew: false,
    isBest: true,
    img: '/fashion/product-06.jpg',
    colors: ['#2C2C2C', '#8B4C4C', '#4C6B8B'],
    tags: ['데이트', '페어체형'],
  },
  {
    id: 7,
    name: '가죽 라이더 재킷',
    category: '아우터',
    price: 128000,
    originalPrice: 168000,
    isNew: false,
    isBest: true,
    img: '/fashion/product-07.jpg',
    colors: ['#1C1C1C', '#3D2B1F'],
    tags: ['겨울쿨톤', '스트릿'],
  },
  {
    id: 8,
    name: '울 캐시미어 스카프',
    category: '액세서리',
    price: 45000,
    originalPrice: null,
    isNew: true,
    isBest: false,
    img: '/fashion/product-08.jpg',
    colors: ['#C8A882', '#8B4C4C', '#4A5E4A'],
    tags: ['가을웜톤', '겨울'],
  },
];

// ── 구매 프로세스 단계 ───────────────────────────────────────────────────────
const BUY_STEPS = [
  { step: '01', title: '상품 선택', desc: '카테고리 탐색 또는 AI 스타일 추천으로 원하는 상품을 선택합니다.' },
  { step: '02', title: '장바구니 담기', desc: '사이즈·색상을 선택하고 장바구니에 담습니다.' },
  { step: '03', title: '주문·결제', desc: '배송지 입력 후 카드·간편결제로 안전하게 결제합니다.' },
  { step: '04', title: '배송 추적', desc: '주문 완료 후 실시간 배송 현황을 확인할 수 있습니다.' },
];

// ── 서비스 특징 ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Truck, title: '50,000원 이상 무료배송', desc: '5만원 이상 구매 시 전국 무료배송' },
  { icon: RefreshCw, title: '30일 무료 교환·환불', desc: '미착용·미세탁 상품에 한해 30일 이내' },
  { icon: Shield, title: '정품 보증', desc: '국내 생산 또는 공식 수입 정품만 취급' },
  { icon: Tag, title: '시즌 세일 최대 50%', desc: '신규 회원 10% 쿠폰 + 시즌 할인 중복 적용' },
];

// ── 리뷰 ────────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: '김○○', text: 'AI 스타일 추천이 정말 놀라워요. 제 체형과 퍼스널 컬러에 딱 맞는 아이템을 추천해줘서 처음 사는데도 실패 없이 잘 입고 있어요!', stars: 5, tag: '오버핏 울 코트 구매' },
  { name: '이○○', text: '사이즈 가이드가 정확해서 온라인 쇼핑인데도 핏이 완벽했어요. 배송도 빠르고 포장도 깔끔합니다.', stars: 5, tag: '와이드 슬랙스 구매' },
  { name: '박○○', text: '환불 요청했는데 응대가 친절하고 빠르게 처리됐어요. 다음에도 믿고 구매할 것 같아요.', stars: 5, tag: '교환·환불 경험' },
];

// ── 상품 카드 컴포넌트 ───────────────────────────────────────────────────────
function ProductCard({ p }: { p: typeof PRODUCTS[number] }) {
  const [imgError, setImgError] = useState(false);
  const [wished, setWished] = useState(false);
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative w-full aspect-[3/4] bg-stone-100">
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
            <ShoppingBag size={36} />
            <p className="text-xs mt-2 text-stone-400">{p.img.split('/').pop()}</p>
          </div>
        ) : (
          <Image
            src={p.img}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        )}
        <button
          onClick={() => setWished(w => !w)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart size={14} className={wished ? 'text-red-500 fill-red-500' : 'text-stone-400'} />
        </button>
        {(p.isNew || p.isBest) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {p.isNew && <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">NEW</span>}
            {p.isBest && <span className="text-[10px] font-bold bg-stone-800 text-white px-2 py-0.5 rounded-full">BEST</span>}
          </div>
        )}
        {discount && (
          <div className="absolute bottom-3 left-3 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-1">{p.category}</p>
        <h3 className="font-bold text-stone-900 text-sm mb-1 leading-snug">{p.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-black text-stone-900 text-sm">{p.price.toLocaleString()}원</span>
          {p.originalPrice && (
            <span className="text-xs text-stone-400 line-through">{p.originalPrice.toLocaleString()}원</span>
          )}
        </div>
        <div className="flex gap-1.5 mb-3">
          {p.colors.map(c => (
            <div key={c} className="w-4 h-4 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <Link
          href="/fashion/cart"
          className="w-full flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >
          <ShoppingCart size={12} />
          장바구니 담기
        </Link>
      </div>
    </div>
  );
}

// ── 카테고리 카드 ────────────────────────────────────────────────────────────
function CategoryCard({ c }: { c: typeof CATEGORIES[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden ${c.color} cursor-pointer hover:shadow-md transition-shadow group`}>
      <div className="relative w-full aspect-[4/5] bg-white/50">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <ShoppingBag size={40} />
          </div>
        ) : (
          <Image
            src={c.img}
            alt={c.label}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className={`text-[10px] font-bold text-white ${c.badge} px-2 py-0.5 rounded-full inline-block mb-1`}>
            {c.label}
          </span>
          <p className="text-white/90 text-xs">{c.desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function FashionHome() {
  const [heroImgError, setHeroImgError] = useState(false);
  const [storyImgError, setStoryImgError] = useState(false);
  const [tab, setTab] = useState<'best' | 'new'>('best');

  const displayed = PRODUCTS.filter(p => tab === 'best' ? p.isBest : p.isNew);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin" />

      {/* ── 1. Hero / 브랜드 소개 ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <ShoppingBag size={13} />
              모던 패션 편집샵 · 의류 쇼핑몰 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-stone-900 leading-tight mb-4">
              당신의 스타일을<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                완성하다
              </span>
            </h1>
            <p className="text-stone-500 text-base leading-relaxed mb-6">
              트렌드를 이끄는 국내 패션 브랜드부터 해외 편집 아이템까지. AI 스타일리스트가 체형과
              퍼스널 컬러를 분석해 당신에게 꼭 맞는 코디를 추천합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/fashion/chat"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <Bot size={16} />
                AI 스타일 추천받기
              </Link>
              <Link
                href="/fashion/cart"
                className="inline-flex items-center justify-center gap-2 border-2 border-orange-200 hover:border-orange-400 text-orange-800 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <ShoppingCart size={16} />
                장바구니 보기
              </Link>
            </div>
          </div>

          {/* 브랜드 대표 이미지 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-orange-50 border border-orange-100 shadow-lg">
              {heroImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 text-stone-300">
                  <ShoppingBag size={60} />
                  <p className="text-sm mt-3 text-stone-400 font-mono">fashion-hero.jpg</p>
                  <p className="text-xs text-stone-300 mt-1">/public/fashion/fashion-hero.jpg</p>
                </div>
              ) : (
                <Image
                  src="/fashion/fashion-hero.jpg"
                  alt="Mode Fashion 브랜드 이미지"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setHeroImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-orange-100 px-5 py-4">
              <p className="text-xs text-stone-400 mb-0.5">지금 진행 중</p>
              <p className="font-black text-stone-900">시즌 오프 세일</p>
              <p className="text-xs text-orange-500 mt-0.5 font-bold">최대 50% 할인</p>
            </div>
          </div>
        </div>

        {/* 서비스 특징 */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm text-center">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center mb-2 mx-auto">
                <Icon size={18} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1 leading-tight">{title}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 브랜드 스토리 ─────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-white/10 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit">
                <Sparkles size={12} />
                Brand Story
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                패션은 자신을<br />표현하는 언어입니다
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed mb-4">
                Mode Fashion은 2018년 홍대 편집샵으로 시작했습니다. "누구나 자신만의 스타일을 가질 수 있다"는 철학으로,
                트렌드와 개성 사이의 균형을 찾아드립니다.
              </p>
              <p className="text-stone-400 text-sm leading-relaxed">
                국내 신진 디자이너 브랜드부터 엄선된 해외 수입 아이템까지, 모든 상품은 패션 MD가 직접 큐레이션합니다.
                AI 스타일리스트와 함께 당신만의 시그니처 룩을 완성해보세요.
              </p>
              <div className="flex gap-6 mt-6">
                {[{ n: '6년+', label: '브랜드 운영' }, { n: '2,000+', label: '큐레이션 상품' }, { n: '15K+', label: '누적 고객' }].map(({ n, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-black text-orange-400">{n}</p>
                    <p className="text-xs text-stone-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[280px] md:min-h-0">
              {storyImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-700 text-stone-500">
                  <ShoppingBag size={48} />
                  <p className="text-sm mt-2 font-mono">fashion-brand-story.jpg</p>
                  <p className="text-xs mt-1">/public/fashion/fashion-brand-story.jpg</p>
                </div>
              ) : (
                <Image
                  src="/fashion/fashion-brand-story.jpg"
                  alt="Mode Fashion 브랜드 스토리"
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setStoryImgError(true)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 상품 카테고리 ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-stone-900 mb-2">카테고리</h2>
          <p className="text-stone-500 text-sm">원하는 스타일의 카테고리를 선택하거나, AI 스타일 추천을 이용해 보세요</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(c => (
            <CategoryCard key={c.key} c={c} />
          ))}
        </div>
        <p className="text-center text-xs text-stone-400 mt-4 font-mono">
          이미지 파일: /public/fashion/category-outer.jpg · category-top.jpg · category-bottom.jpg · category-acc.jpg
        </p>
      </section>

      {/* ── 3. 인기 상품 / 신상품 ───────────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-stone-900">상품 목록</h2>
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            {(['best', 'new'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {t === 'best' ? 'BEST' : 'NEW'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayed.map(p => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        <p className="text-center text-xs text-stone-400 mt-4 font-mono">
          이미지 파일: /public/fashion/product-01.jpg ~ product-08.jpg
        </p>
      </section>

      {/* ── 4. 장바구니 & 구매 프로세스 CTA ─────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <ShoppingCart size={13} />
              간편한 구매 프로세스
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">장바구니 &amp; 결제</h2>
            <p className="text-orange-100 text-sm">4단계로 완성하는 간편 쇼핑</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {BUY_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white/10 rounded-2xl p-5 text-center">
                <div className="text-3xl font-black text-white/30 mb-2">{step}</div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-xs text-orange-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/fashion/cart"
              className="inline-flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              장바구니 보기 <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. AI 스타일 추천 CTA ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Bot size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">AI 스타일 추천</h2>
          <p className="text-stone-500 text-sm mb-5 max-w-md mx-auto">
            체형·퍼스널 컬러·선호 스타일을 입력하면 AI 스타일리스트가 맞춤 코디와 상품을 추천합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              '"페어 체형인데 하체 커버 코디 추천해주세요"',
              '"가을웜톤에 어울리는 아우터가 뭐가 있나요?"',
              '"오피스룩에 캐주얼함을 더하고 싶어요"',
            ].map(ex => (
              <span key={ex} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full">{ex}</span>
            ))}
          </div>
          <Link
            href="/fashion/chat"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            AI 스타일 추천 받기 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 6. 사이즈 가이드 / 교환·환불 미리보기 ─────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
            <h3 className="font-black text-stone-900 text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-orange-600" />
              </span>
              사이즈 가이드 요약
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-stone-600">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="text-left py-2 px-3 font-semibold rounded-l-lg">사이즈</th>
                    <th className="text-center py-2 px-3 font-semibold">가슴</th>
                    <th className="text-center py-2 px-3 font-semibold">허리</th>
                    <th className="text-center py-2 px-3 font-semibold rounded-r-lg">엉덩이</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {[['XS', '80~83', '61~64', '87~90'], ['S', '84~87', '65~68', '91~94'], ['M', '88~91', '69~72', '95~98'], ['L', '92~96', '73~77', '99~103'], ['XL', '97~101', '78~83', '104~108']].map(([sz, ...vals]) => (
                    <tr key={sz} className="hover:bg-orange-50/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-orange-600">{sz}</td>
                      {vals.map((v, i) => (
                        <td key={i} className="py-2 px-3 text-center">{v} cm</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/fashion/size-guide" className="mt-4 flex items-center gap-1 text-xs text-orange-600 font-semibold hover:text-orange-800 transition-colors">
              전체 사이즈 가이드 보기 <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
            <h3 className="font-black text-stone-900 text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="text-orange-600" />
              </span>
              교환·환불 정책
            </h3>
            <ul className="space-y-3 text-sm text-stone-600">
              {[
                { ok: true, text: '수령 후 30일 이내 교환·환불 가능' },
                { ok: true, text: '상품 불량·오배송은 왕복 배송비 무료' },
                { ok: true, text: '단순 변심 반품 시 배송비 3,000원 고객 부담' },
                { ok: false, text: '착용·세탁·훼손된 상품은 교환·환불 불가' },
                { ok: false, text: '이벤트·세일 상품은 교환만 가능 (환불 불가)' },
              ].map(({ ok, text }) => (
                <li key={text} className="flex items-start gap-2">
                  <CheckCircle size={14} className={`shrink-0 mt-0.5 ${ok ? 'text-green-500' : 'text-red-400'}`} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/fashion/size-guide" className="mt-4 flex items-center gap-1 text-xs text-orange-600 font-semibold hover:text-orange-800 transition-colors">
              전체 정책 보기 <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* 고객 후기 */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-stone-900 mb-5 text-center">고객 후기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-2">{r.tag}</span>
              <p className="text-sm text-stone-600 leading-relaxed mb-3">"{r.text}"</p>
              <p className="text-xs text-stone-400 font-medium">{r.name} 고객</p>
            </div>
          ))}
        </div>
      </section>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-stone-50 rounded-xl p-4 text-xs text-stone-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-stone-300" />
        <p>본 페이지는 AIZET의 의류 쇼핑몰 플랫폼 데모입니다. 표시된 상품 정보와 가격은 기획안 기반 예시이며 실제 구매가 이루어지지 않습니다.</p>
      </div>
    </div>
  );
}
