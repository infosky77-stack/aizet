'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Shield, CheckCircle, Droplets, Flame } from 'lucide-react';
import { CANDY_PRODUCTS, THEME_COLORS, candyToCartItem } from '@/lib/hancandy/products';
import { useShopCart } from '@/store/shopCart';
import { AdminModeButton } from '@/components/AdminModeButton';

const BRAND_PILLARS = [
  { icon: Shield,   title: '무설탕·무자극',   desc: '자일리톨·스테비아 감미, 인공 산미 없이 점막을 보호합니다', color: 'text-green-600 bg-green-100' },
  { icon: Leaf,     title: '한약 기반 원료',   desc: '맥문동·금은화 등 전통 본초 원료를 현대적으로 재해석',      color: 'text-emerald-600 bg-emerald-100' },
  { icon: Droplets, title: '3호 체계',         desc: '구강→위장→소화, 상황에 맞는 호(號)를 골라 드세요',        color: 'text-blue-600 bg-blue-100' },
  { icon: Flame,    title: '무색소·무방부제',  desc: '인공 첨가물 없이, 자연 그대로의 기능성 케어',             color: 'text-amber-600 bg-amber-100' },
];

const QUICK_GUIDE = [
  {
    name: '1호 그린', themeKey: 'green' as const,
    situations: ['미팅·발표 전', '장거리 운전', '입 마를 때', '운동·야외 활동'],
  },
  {
    name: '2호 블루', themeKey: 'blue' as const,
    situations: ['속쓰릴 때', '식후 위장 케어', '아침 공복', '자극적인 식사 후'],
  },
  {
    name: '3호 옐로우', themeKey: 'yellow' as const,
    situations: ['과식 후', '더부룩·가스', '소화 안 되는 날', '장시간 앉아있을 때'],
  },
];

export default function HancandyHome() {
  const addItem = useShopCart((s) => s.addItem);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin/hancandy" />

      {/* ── Hero ── */}
      <section className="text-center mb-12">
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
          맥문동·금은화 등 전통 본초 원료로 만든 무설탕 기능성 캔디.<br />
          <strong className="text-gray-700">1호 그린(구강수분) · 2호 블루(점막보호) · 3호 옐로우(소화순환)</strong>
        </p>
        <p className="text-xs text-gray-400 mb-8">당류 0g · 무색소 · 무방부제 · 무자극 설계</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
      </section>

      {/* ── Brand Pillars ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
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

      {/* ── 3호 라인업 (Compact Cards) ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-gray-900">3호 라인업</h2>
            <p className="text-sm text-gray-400 mt-0.5">상황별로 맞는 호를 골라 드세요</p>
          </div>
          <Link href="/hancandy/products" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CANDY_PRODUCTS.map(p => {
            const tc = THEME_COLORS[p.themeKey];
            return (
              <div key={p.id} className={`rounded-2xl border-2 bg-white overflow-hidden hover:shadow-lg transition-all ${tc.border}`}>

                {/* 색상 헤더 */}
                <div className={`${p.headerBg} px-5 pt-5 pb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{p.image}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tc.badge}`}>{p.badge}</span>
                  </div>
                  <div className={`text-2xl font-black ${tc.text} leading-none`}>{p.number}호</div>
                  <div className="font-black text-gray-900 text-base">{p.nameEn}</div>
                  <div className={`text-xs mt-0.5 ${tc.text} opacity-80`}>{p.slogan}</div>
                </div>

                {/* 본문 */}
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-600 leading-snug mb-3">{p.description}</p>

                  {/* 핵심성분 칩 (상위 3개) */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.keyIngredients.slice(0, 3).map(ing => (
                      <span key={ing.name} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tc.badge}`}>
                        {ing.name}
                      </span>
                    ))}
                  </div>

                  {/* 가격 + 버튼 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-lg font-black text-gray-900">{p.price.toLocaleString()}원</span>
                      <div className="text-[10px] text-gray-400">{p.weight}</div>
                    </div>
                    <div className="flex gap-2">
                      {/* products 테이블 id는 seed 규칙상 `hancandy-{candy.id}` (scripts/seed-hancandy.ts) */}
                      <Link
                        href={`/hancandy/products/hancandy-${p.id}`}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl border-2 ${tc.border} ${tc.text} transition-colors`}
                      >
                        상세보기
                      </Link>
                      <button
                        onClick={() => addItem('hancandy', candyToCartItem(p))}
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

      {/* ── 어떤 호? + AI 상담 (통합) ── */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-10">
        <h2 className="text-xl font-black text-gray-900 mb-1 text-center">어떤 호가 나에게 맞을까요?</h2>
        <p className="text-sm text-gray-400 text-center mb-6">상황별로 골라보거나, AI 상담으로 딱 맞는 호를 추천받으세요.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
          {QUICK_GUIDE.map(g => {
            const tc = THEME_COLORS[g.themeKey];
            return (
              <div key={g.name} className={`rounded-2xl p-4 ${tc.bgLight} border ${tc.border}`}>
                <div className={`font-black text-sm ${tc.text} mb-2`}>{g.name}</div>
                <ul className="space-y-1">
                  {g.situations.map(s => (
                    <li key={s} className="flex items-center gap-1.5 text-xs text-gray-700">
                      <CheckCircle size={11} className={tc.text} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
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
            🤖 AI 상담 시작하기 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 쇼핑몰 플랫폼 데모입니다. 표시된 제품 및 가격은 기획안 기반 데이터이며 실제 판매가 이루어지지 않습니다. 본 제품은 의약품이 아니며 질병의 예방·치료를 목적으로 하지 않습니다. 주식회사 에이젯(aizet.co.kr) / HanCandy(hancandy.co.kr)</p>
      </div>
    </div>
  );
}
