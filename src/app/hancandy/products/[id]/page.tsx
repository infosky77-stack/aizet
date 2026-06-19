'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, CheckCircle, Leaf, AlertCircle } from 'lucide-react';
import { getProduct, CATEGORY_LABELS } from '@/lib/hancandy/products';
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

  function handleAdd() {
    addItem(product!);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const catInfo = CATEGORY_LABELS[product.category];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left – product visual */}
        <div className={`rounded-3xl ${product.bgColor} flex flex-col items-center justify-center p-12 text-center min-h-64`}>
          <span className="text-8xl mb-4">{product.image}</span>
          <h1 className="text-2xl font-black text-gray-900 mb-1">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.nameEn}</p>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {product.benefitTags.map(t => (
              <span key={t} className="text-xs font-semibold bg-white/70 text-gray-700 px-3 py-1 rounded-full border border-white">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Right – info */}
        <div className="flex flex-col gap-5">
          {/* Category + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${catInfo?.color ?? ''}`}>
              {catInfo?.icon} {catInfo?.label}
            </span>
            {product.badge && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-600 text-white">
                {product.badge}
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
              당류 0g
            </span>
          </div>

          {/* Desc */}
          <p className="text-gray-700 text-sm leading-relaxed">{product.longDescription}</p>

          {/* Price */}
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

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base transition-all shadow-md ${
              added
                ? 'bg-green-100 text-green-700 shadow-none'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200'
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
            className="text-center text-sm text-green-600 hover:text-green-700 font-semibold"
          >
            장바구니 바로가기 →
          </Link>
        </div>
      </div>

      {/* Nutrition info */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nutrition table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> 영양 정보
            <span className="text-xs font-normal text-gray-400">({product.nutrition.servingSize} 기준)</span>
          </h2>
          <div className="divide-y divide-gray-50">
            {[
              { label: '열량', value: `${product.nutrition.calories}kcal`, highlight: false },
              { label: '탄수화물', value: `${product.nutrition.carbs}g`, highlight: false },
              { label: '당류', value: `${product.nutrition.sugar}g`, highlight: true, good: true },
              { label: '단백질', value: `${product.nutrition.protein}g`, highlight: false },
              { label: '지방', value: `${product.nutrition.fat}g`, highlight: false },
              { label: '식이섬유', value: `${product.nutrition.fiber}g`, highlight: false },
              ...(product.nutrition.xylitol !== undefined
                ? [{ label: '자일리톨', value: `${product.nutrition.xylitol}g`, highlight: true, good: true }]
                : []),
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{n.label}</span>
                <span className={`text-sm font-bold ${n.highlight && n.good ? 'text-green-600' : 'text-gray-800'}`}>
                  {n.value}
                  {n.label === '당류' && <span className="text-[10px] font-semibold ml-1 bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">ZERO</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Leaf size={16} className="text-green-500" /> 원재료 및 성분
          </h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {product.ingredients.map((ing, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  i === 0
                    ? 'bg-green-100 text-green-700 font-bold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {ing}
              </span>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              과량 섭취 시 복부 불편감이 생길 수 있습니다. 하루 권장량을 지켜 드세요. 어린이, 임산부, 수유부는 섭취 전 전문가와 상담하세요.
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

      {/* AI recommendation CTA */}
      <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-lg mb-1">어떤 캔디가 나에게 맞을까요?</p>
          <p className="text-sm opacity-80">AI 상담으로 맞춤 추천을 받아보세요.</p>
        </div>
        <Link
          href="/hancandy/chat"
          className="shrink-0 bg-white text-green-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
        >
          AI 상담받기 →
        </Link>
      </div>
    </div>
  );
}
