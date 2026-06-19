'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { CANDY_PRODUCTS, CATEGORY_LABELS, THEME_COLORS, CandyProduct } from '@/lib/hancandy/products';
import { useCandyCart } from '@/store/candyCart';

export default function ProductsPage() {
  const [category, setCategory] = useState<string>('all');
  const [added, setAdded] = useState<string | null>(null);
  const addItem = useCandyCart(s => s.addItem);

  const filtered = category === 'all'
    ? CANDY_PRODUCTS
    : CANDY_PRODUCTS.filter(p => p.category === category);

  function handleAdd(p: CandyProduct) {
    addItem(p);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">제품 카탈로그</h1>
        <p className="text-gray-500 text-sm">상황에 맞는 호(號)를 골라보세요 · 전 제품 당류 0g · 무설탕</p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all ${
              category === key
                ? 'border-green-500 bg-green-500 text-white shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(p => {
          const tc = THEME_COLORS[p.themeKey];
          return (
            <div key={p.id} className={`rounded-2xl border-2 overflow-hidden bg-white hover:shadow-xl transition-all group ${tc.border}`}>
              {/* 상단 색상 밴드 */}
              <div className={`${p.headerBg} px-6 pt-6 pb-5`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-5xl">{p.image}</span>
                  <div className="flex flex-col items-end gap-1">
                    {p.badge && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tc.badge}`}>
                        {p.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/60 text-gray-600">
                      당류 0g
                    </span>
                  </div>
                </div>
                <div className={`text-2xl font-black ${tc.text}`}>{p.number}호</div>
                <h2 className="font-black text-gray-900 text-xl leading-snug">{p.nameEn}</h2>
                <p className={`text-xs mt-1 ${tc.text} opacity-80`}>{p.slogan}</p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{p.description}</p>

                {/* 핵심성분 */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">핵심성분</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.keyIngredients.map(ing => (
                      <span key={ing.name} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tc.badge}`}>
                        {ing.priority && <span className="opacity-60 text-[10px] mr-0.5">{ing.priority}</span>}
                        {ing.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 이런 상황에 */}
                <div className="mb-5 bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">이런 때</p>
                  <div className="flex flex-wrap gap-1">
                    {p.scenarios.slice(0, 3).map(s => (
                      <span key={s.situation} className="text-[11px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                        {s.icon} {s.situation}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price + actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-xl font-black text-gray-900">{p.price.toLocaleString()}원</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{p.weight}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/hancandy/products/${p.id}`}
                      className={`flex items-center gap-1 text-xs font-semibold ${tc.text} hover:underline`}
                    >
                      상세보기 <ChevronRight size={12} />
                    </Link>
                    <button
                      onClick={() => handleAdd(p)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all text-white ${
                        added === p.id ? 'bg-gray-400' : tc.button
                      }`}
                    >
                      <ShoppingCart size={13} />
                      {added === p.id ? '담았어요!' : '장바구니'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">해당 카테고리 제품이 없습니다.</div>
      )}

      {/* AI 추천 배너 */}
      <div className="mt-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-lg mb-1">어떤 호가 나에게 맞을까요?</p>
          <p className="text-sm opacity-80">증상·상황을 말하면 AI가 맞는 호를 추천해 드립니다.</p>
        </div>
        <Link
          href="/hancandy/chat"
          className="shrink-0 bg-white text-green-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
        >
          🤖 AI 추천받기 →
        </Link>
      </div>
    </div>
  );
}
