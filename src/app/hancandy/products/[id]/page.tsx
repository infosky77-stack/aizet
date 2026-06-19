'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, CheckCircle, Leaf, AlertCircle } from 'lucide-react';
import { getProduct, THEME_COLORS } from '@/lib/hancandy/products';
import { useCandyCart } from '@/store/candyCart';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProduct(id);
  const addItem = useCandyCart(s => s.addItem);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">제품을 찾을 수 없습니다</h1>
        <Link href="/hancandy/products" className="text-green-600 hover:underline text-sm">
          제품 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const tc = THEME_COLORS[product.themeKey];

  function handleAdd() {
    addItem(product!);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        href="/hancandy/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        제품 목록
      </Link>

      {/* 상단 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Left – 제품 비주얼 */}
        <div className={`rounded-3xl ${product.headerBg} flex flex-col items-center justify-center p-12 text-center min-h-64`}>
          <span className="text-8xl mb-4">{product.image}</span>
          <div className={`text-4xl font-black ${tc.text} mb-1`}>{product.number}호</div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">{product.nameEn}</h1>
          <p className={`text-sm font-semibold ${tc.text} opacity-80 mb-4`}>{product.slogan}</p>
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {product.benefitTags.map(t => (
              <span key={t} className={`text-xs font-semibold px-3 py-1 rounded-full ${tc.badge}`}>
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Right – 구매 정보 */}
        <div className="flex flex-col gap-5">
          {/* 컨셉 뱃지 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${tc.badge}`}>
              {product.concept}
            </span>
            {product.badge && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tc.bg} text-white`}>
                {product.badge}
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
              당류 0g
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
              무자극 설계
            </span>
          </div>

          {/* 제품 설명 */}
          <p className="text-gray-700 text-sm leading-relaxed">{product.longDescription}</p>

          {/* 가격 */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{product.price.toLocaleString()}원</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{product.originalPrice.toLocaleString()}원</span>
                <span className="text-sm font-bold text-red-500">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400">{product.weight} · 1회 섭취량 {product.nutrition.servingSize}</p>

          {/* 장바구니 */}
          <button
            onClick={handleAdd}
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base transition-all shadow-md ${
              added
                ? 'bg-gray-100 text-gray-700 shadow-none'
                : `bg-gradient-to-r ${tc.gradient} text-white shadow-lg`
            }`}
          >
            {added ? (
              <><CheckCircle size={18} /> 장바구니에 담겼습니다!</>
            ) : (
              <><ShoppingCart size={18} /> 장바구니에 담기</>
            )}
          </button>
          <Link
            href="/hancandy/cart"
            className={`text-center text-sm font-semibold ${tc.text} hover:underline`}
          >
            장바구니 바로가기 →
          </Link>
        </div>
      </div>

      {/* ── 핵심성분 섹션 ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Leaf size={18} className={tc.text} />
          <h2 className="text-xl font-black text-gray-900">핵심성분</h2>
          <span className="text-xs text-gray-400">— 어떤 성분이, 왜 들어 있나요?</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {product.keyIngredients.map((ing, i) => (
            <div
              key={ing.name}
              className={`rounded-2xl border p-5 ${i === 0 ? `${tc.bgLight} ${tc.border}` : 'bg-white border-gray-100 shadow-sm'}`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${i === 0 ? `${tc.bg} text-white` : 'bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900">{ing.name}</span>
                    {ing.priority && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tc.badge}`}>
                        {ing.priority}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${tc.text}`}>{ing.role}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-11">{ing.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 일상 활용 시나리오 섹션 ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">📍</span>
          <h2 className="text-xl font-black text-gray-900">일상 활용 시나리오</h2>
          <span className="text-xs text-gray-400">— 이런 상황에 드세요</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {product.scenarios.map(s => (
            <div key={s.situation} className={`flex items-start gap-4 rounded-2xl border p-4 bg-white ${tc.border} hover:shadow-sm transition-shadow`}>
              <span className="text-3xl shrink-0">{s.icon}</span>
              <div>
                <div className="font-bold text-sm text-gray-900 mb-0.5">{s.situation}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 성분 목록 + 영양정보 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 영양 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> 영양 정보
            <span className="text-xs font-normal text-gray-400">({product.nutrition.servingSize} 기준)</span>
          </h3>
          <div className="divide-y divide-gray-50">
            {[
              { label: '열량', value: `${product.nutrition.calories}kcal` },
              { label: '탄수화물', value: `${product.nutrition.carbs}g` },
              { label: '당류', value: `${product.nutrition.sugar}g`, zero: true },
              { label: '단백질', value: `${product.nutrition.protein}g` },
              { label: '지방', value: `${product.nutrition.fat}g` },
              { label: '식이섬유', value: `${product.nutrition.fiber}g` },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{n.label}</span>
                <span className={`text-sm font-bold ${n.zero ? tc.text : 'text-gray-800'}`}>
                  {n.value}
                  {n.zero && (
                    <span className={`text-[10px] font-semibold ml-1 ${tc.badge} px-1.5 py-0.5 rounded-full`}>ZERO</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 원재료 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Leaf size={16} className={tc.text} /> 원재료 및 성분
          </h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {product.ingredients.map((ing, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  i === 0 ? `${tc.badge} font-bold` : 'bg-gray-100 text-gray-600'
                }`}
              >
                {ing}
              </span>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              본 제품은 의약품이 아니며 질병 예방·치료를 목적으로 하지 않습니다. 임산부·수유부·복약 중인 분은 섭취 전 전문가와 상담하세요.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { icon: '🚫', label: '무설탕' },
              { icon: '🎨', label: '무색소' },
              { icon: '🧪', label: '무방부제' },
            ].map(b => (
              <div key={b.label} className="bg-gray-50 rounded-xl py-2">
                <div className="text-lg mb-0.5">{b.icon}</div>
                <div className="font-semibold text-gray-600">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI 상담 CTA */}
      <div className={`bg-gradient-to-r ${tc.gradient} rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap`}>
        <div>
          <p className="font-bold text-lg mb-1">1·2·3호 중 어떤 게 나에게 맞을까요?</p>
          <p className="text-sm opacity-80">AI 상담으로 상황에 딱 맞는 호를 추천받아 보세요.</p>
        </div>
        <Link
          href="/hancandy/chat"
          className="shrink-0 bg-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          style={{ color: 'inherit' }}
        >
          🤖 AI 상담받기 →
        </Link>
      </div>
    </div>
  );
}
