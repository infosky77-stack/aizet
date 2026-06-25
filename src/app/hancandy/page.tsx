'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, Shield, CheckCircle, Droplets, Flame } from 'lucide-react';
import { CANDY_PRODUCTS, THEME_COLORS } from '@/lib/hancandy/products';
import { useCandyCart } from '@/store/candyCart';
import { AdminModeButton } from '@/components/AdminModeButton';

const BRAND_PILLARS = [
  { icon: Shield, title: '무설탕·무자극', desc: '자일리톨·스테비아 감미, 인공 산미 없이 점막을 보호합니다', color: 'text-green-600 bg-green-100' },
  { icon: Leaf, title: '한약 기반 원료', desc: '맥문동·금은화 등 전통 본초 원료를 현대적으로 재해석', color: 'text-emerald-600 bg-emerald-100' },
  { icon: Droplets, title: '3호 체계', desc: '구강→위장→소화, 상황에 맞는 호(號)를 골라 드세요', color: 'text-blue-600 bg-blue-100' },
  { icon: Flame, title: '무색소·무방부제', desc: '인공 첨가물 없이, 자연 그대로의 기능성 케어', color: 'text-amber-600 bg-amber-100' },
];

const PRODUCT_DETAILS = [
  {
    no: 1,
    themeKey: 'green' as const,
    headline: '인위적인 신맛으로 침을 짜내지 마세요,\n스스로 차오르는 천연 수분 오아시스',
    subheadline: '수분과 활력의 오아시스 (Aqua & Vitality)',
    intro: '시중의 강한 산성 구강 캔디와 달리 점막 자극과 치아 부식 유발 요소를 완전히 배제. 400년 전통 생맥산의 지혜를 담아 맥문동과 금은화 중심의 천연 레시피로 메마른 입안과 목에 마르지 않는 촉촉한 샘을 선물.',
    ingredients: [
      { name: '맥문동', role: '구강 건조 해결 핵심 엔진' },
      { name: '금은화', role: '염증 다스리는 천연 방어막' },
      { name: '오미자', role: '갈증 진정, 청량한 수분감' },
    ],
    safetyPoint: '무설탕(ZERO SUGAR), 취침 전에도 안심',
    scenarios: [
      { label: '비즈니스 미팅 전', icon: '🎤' },
      { label: '장거리 운전·야간 주행', icon: '🚗' },
      { label: '운동·아웃도어 활동 중', icon: '🏔️' },
    ],
    productImg: '/images/hancandy/hancandy-1-product.png',
    lifestyleImg: '/images/hancandy/hancandy-1-lifestyle.png',
  },
  {
    no: 2,
    themeKey: 'blue' as const,
    headline: '식후 30분, 당신의 지친 통로를\n편안하게 감싸줄 세련된 쉼표 한 장',
    subheadline: '보호와 진정의 쉼표 (Protect & Calm)',
    intro: '마(산약)와 유근피의 천연 점성 성분이 통로 벽면에 촘촘한 뮤신 코팅막을 형성해 자극으로부터 속을 부드럽게 보호.',
    ingredients: [
      { name: '마 / 산약', role: '위 점막 보호' },
      { name: '유근피', role: '물리적 방어막' },
      { name: '감초', role: '자극 완화' },
    ],
    safetyPoint: '100% 무자극 케어',
    scenarios: [
      { label: '예민해진 아침', icon: '🌅' },
      { label: '맵고 자극적인 식사 후', icon: '🍽️' },
      { label: '잦은 야근과 스트레스 속', icon: '🌙' },
    ],
    productImg: '/images/hancandy/hancandy-2-product.png',
    lifestyleImg: '/images/hancandy/hancandy-2-lifestyle.png',
  },
  {
    no: 3,
    themeKey: 'yellow' as const,
    headline: '무겁게 고인 식적(食積)을 없애다,\n속을 따뜻하게 소통시키는 천연 분해 에너지',
    subheadline: '순환과 배출의 에너지 (Circulation & Detox)',
    intro: '산사자의 천연 분해력에 생강의 온기를 더해 위장 온도를 유지하고 소화 효소를 활성화.',
    ingredients: [
      { name: '산사자', role: '소화 운동 촉진' },
      { name: '나복자', role: '복부 팽만감 해소' },
      { name: '진피', role: '순환 소통, 소화 효소 보조' },
    ],
    safetyPoint: '인공 소화제·화학 보존제 없이 자연 성분만',
    scenarios: [
      { label: '과식 후 복부 팽만감', icon: '🍖' },
      { label: '더운 날씨 소화력 저하', icon: '☀️' },
      { label: '운동 전후', icon: '🏃' },
    ],
    productImg: '/images/hancandy/hancandy-3-product.png',
    lifestyleImg: '/images/hancandy/hancandy-3-lifestyle.png',
  },
];

function ProductDetailSection({ detail }: { detail: typeof PRODUCT_DETAILS[number] }) {
  const tc = THEME_COLORS[detail.themeKey];
  return (
    <section className={`rounded-3xl overflow-hidden mb-14 border ${tc.border}`}>
      {/* 제품샷 */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/8] bg-gray-100">
        <NextImage
          src={detail.productImg}
          alt={`한캔디 ${detail.no}호 제품샷`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className={`${tc.bgLight} px-6 md:px-12 py-10`}>
        {/* 서브헤드라인 */}
        <p className={`text-sm font-bold ${tc.text} mb-3 tracking-wide`}>{detail.subheadline}</p>

        {/* 헤드라인 */}
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-5 whitespace-pre-line">
          {detail.headline}
        </h2>

        {/* 소개 */}
        <p className="text-gray-600 leading-relaxed mb-10 max-w-2xl text-base">{detail.intro}</p>

        {/* 핵심 성분 */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">핵심 성분</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {detail.ingredients.map(ing => (
              <div key={ing.name} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`text-sm font-black ${tc.text} mb-1`}>{ing.name}</div>
                <div className={`text-xs text-gray-500`}>{ing.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 안심 포인트 */}
        <div className="mb-10">
          <div className={`inline-flex items-center gap-2 ${tc.badge} px-5 py-2.5 rounded-full text-sm font-semibold`}>
            <CheckCircle size={15} />
            {detail.safetyPoint}
          </div>
        </div>

        {/* 활용 시나리오 */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">활용 시나리오</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {detail.scenarios.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-2">
                <span className="text-2xl">{s.icon}</span>
                <div className={`text-sm font-bold ${tc.text}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 라이프스타일 이미지 */}
      <div className="relative w-full aspect-[16/7] bg-gray-100">
        <NextImage
          src={detail.lifestyleImg}
          alt={`한캔디 ${detail.no}호 라이프스타일`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </div>
    </section>
  );
}

export default function HancandyHome() {
  const addItem = useCandyCart(s => s.addItem);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin/hancandy" />
      {/* Hero */}
      <section className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
          <Leaf size={12} />
          AIZET × HanCandy 브랜드 데모
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4">
          몸이 원하는 한약,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-blue-500 to-amber-500">
            캔디 하나에 담았습니다.
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-3 leading-relaxed">
          한캔디는 맥문동·금은화 등 전통 본초 원료로 만든 무설탕 기능성 캔디입니다.<br />
          <strong className="text-gray-700">1호 그린(구강수분) · 2호 블루(점막보호) · 3호 옐로우(소화순환)</strong> —<br />
          상황에 맞는 호(號)를 골라 드세요.
        </p>
        <p className="text-xs text-gray-400 mb-8">당류 0g · 무색소 · 무방부제 · 무자극 설계</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/hancandy/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-9 py-5 rounded-2xl shadow-lg shadow-green-200 transition-all"
          >
            제품 보기 <ArrowRight size={16} />
          </Link>
          <Link
            href="/hancandy/chat"
            className="inline-flex items-center gap-2 border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold text-xl px-8 py-4 rounded-2xl transition-colors"
          >
            🤖 어떤 호가 맞을까요?
          </Link>
        </div>

        {/* 3호 빠른 이동 */}
        <div className="flex justify-center gap-3 flex-wrap">
          {CANDY_PRODUCTS.map(p => {
            const tc = THEME_COLORS[p.themeKey];
            return (
              <Link
                key={p.id}
                href={`/hancandy/products/${p.id}`}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-2xl border-2 ${tc.bgLight} ${tc.border} ${tc.text} hover:shadow-md transition-all`}
              >
                <span className="text-lg">{p.image}</span>
                {p.name}
                <span className="text-xs font-normal opacity-70">{p.concept}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Brand pillars */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {BRAND_PILLARS.map(b => (
          <div key={b.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${b.color}`}>
              <b.icon size={20} />
            </div>
            <div className="font-bold text-sm text-gray-800 mb-1">{b.title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </section>

      {/* 3제품 카드 */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">3호 라인업</h2>
            <p className="text-sm text-gray-400 mt-0.5">상황별로 맞는 호를 골라 드세요</p>
          </div>
          <Link href="/hancandy/products" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CANDY_PRODUCTS.map(p => {
            const tc = THEME_COLORS[p.themeKey];
            return (
              <div key={p.id} className={`rounded-2xl border-2 overflow-hidden bg-white hover:shadow-xl transition-all group ${tc.border}`}>
                <div className={`${p.headerBg} px-6 pt-6 pb-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-5xl">{p.image}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tc.badge}`}>
                      {p.badge}
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${tc.text} mb-0.5`}>
                    {p.number}호
                  </div>
                  <div className="font-black text-gray-900 text-lg">{p.nameEn}</div>
                  <div className={`text-xs mt-1 ${tc.text} opacity-80`}>{p.slogan}</div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{p.description}</p>

                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">핵심성분</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.keyIngredients.map(ing => (
                        <span key={ing.name} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tc.badge}`}>
                          {ing.priority && <span className="opacity-60 mr-1">{ing.priority}</span>}
                          {ing.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">이런 때</p>
                    <p className="text-xs text-gray-500">{p.scenarios.slice(0, 2).map(s => s.situation).join(' · ')}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-lg font-black text-gray-900">{p.price.toLocaleString()}원</span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.weight}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/hancandy/products/${p.id}`}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl border-2 ${tc.border} ${tc.text} hover:${tc.bgLight} transition-colors`}
                      >
                        상세보기
                      </Link>
                      <button
                        onClick={() => addItem(p)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl text-white ${tc.button} transition-colors`}
                      >
                        담기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 제품별 상세 섹션 */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-1">제품 상세</h2>
        <p className="text-sm text-gray-400">각 호(號)의 성분과 활용 방법을 자세히 알아보세요</p>
      </div>
      {PRODUCT_DETAILS.map(detail => (
        <ProductDetailSection key={detail.no} detail={detail} />
      ))}

      {/* 상황별 추천 가이드 */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-14">
        <h2 className="text-xl font-black text-gray-900 mb-2 text-center">어떤 상황에 어떤 호?</h2>
        <p className="text-sm text-gray-400 text-center mb-7">AI 상담으로 더 정확한 추천을 받을 수 있습니다.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              no: '1호 그린', color: THEME_COLORS.green, situations: ['중요 미팅·발표 전', '등산·러닝 중', '장거리 운전', '구강이 메마를 때'],
            },
            {
              no: '2호 블루', color: THEME_COLORS.blue, situations: ['기상 직후 공복', '매운 음식·커피 후', '속이 쓰릴 때', '식후 위장 케어'],
            },
            {
              no: '3호 옐로우', color: THEME_COLORS.yellow, situations: ['기름진 식사 후', '더부룩·가스 불편', '소화 안 되는 날', '장시간 앉아있을 때'],
            },
          ].map(g => (
            <div key={g.no} className={`rounded-2xl p-5 ${g.color.bgLight} border ${g.color.border}`}>
              <div className={`font-black text-base ${g.color.text} mb-4`}>{g.no}</div>
              <ul className="space-y-2">
                {g.situations.map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={13} className={g.color.text} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Why HanCandy */}
      <section className="bg-gradient-to-r from-green-600 via-blue-600 to-amber-500 rounded-3xl p-8 md:p-12 text-white mb-14">
        <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">한캔디가 다른 이유</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: '0g', label: '당류 제로', desc: '모든 제품 당류 0g. 자일리톨·스테비아로 달콤하게.' },
            { num: '3호', label: '상황별 체계', desc: '구강·위장·소화 — 내 상황에 맞는 호(號)를 선택.' },
            { num: '本草', label: '전통 본초 기반', desc: '맥문동·금은화 등 검증된 한약 원료를 현대적으로.' },
          ].map(s => (
            <div key={s.num} className="text-center">
              <div className="text-4xl font-black mb-1">{s.num}</div>
              <div className="font-bold mb-2 opacity-90">{s.label}</div>
              <div className="text-sm opacity-75 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Chat CTA */}
      <section className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤖</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">어떤 호가 나에게 맞을까요?</h2>
        <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
          지금 어떤 상황인지 말씀해 주시면 AI가 1·2·3호 중 맞는 호를 추천해 드립니다.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['"미팅 전에 목이 말라요"', '"식후에 속이 더부룩해요"', '"기름진 거 먹고 답답해요"'].map(ex => (
            <span key={ex} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
              {ex}
            </span>
          ))}
        </div>
        <Link
          href="/hancandy/chat"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          AI 상담 시작하기 <ArrowRight size={15} />
        </Link>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 쇼핑몰 플랫폼 데모입니다. 표시된 제품 및 가격은 기획안 기반 데이터이며 실제 판매가 이루어지지 않습니다. 본 제품은 의약품이 아니며 질병의 예방·치료를 목적으로 하지 않습니다. 주식회사 에이젯(aizet.co.kr) / HanCandy(hancandy.co.kr)</p>
      </div>
    </div>
  );
}
