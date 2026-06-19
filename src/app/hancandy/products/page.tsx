'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, ChevronRight, Filter } from 'lucide-react';
import { CANDY_PRODUCTS, CATEGORY_LABELS, CandyProduct } from '@/lib/hancandy/products';
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
        <p className="text-gray-500 text-sm">효능별로 맞는 한캔디를 골라보세요 · 모든 제품 당류 0g</p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map(p => (
          <div key={p.id} className={`rounded-2xl border-2 overflow-hidden bg-white hover:shadow-xl transition-all group ${p.bgColor.replace('bg-', 'border-').split(' ')[0]}`}>
            {/* Top color band */}
            <div className={`${p.bgColor} px-6 pt-6 pb-4`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-5xl">{p.image}</span>
                <div className="flex flex-col items-end gap-1.5">
                  {p.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
                      {p.badge}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_LABELS[p.category]?.color ?? ''}`}>
                    {CATEGORY_LABELS[p.category]?.icon} {CATEGORY_LABELS[p.category]?.label}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-xl">{p.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{p.flavor} · {p.weight}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{p.description}</p>

              {/* Benefit tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.benefitTags.map(t => (
                  <span key={t} className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Nutrition quick view */}
              <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-3 mb-5 text-center text-xs">
                {[
                  { label: '열량', value: `${p.nutrition.calories}kcal` },
                  { label: '당류', value: `${p.nutrition.sugar}g`, green: true },
                  { label: '탄수화물', value: `${p.nutrition.carbs}g` },
                  { label: '자일리톨', value: `${p.nutrition.xylitol ?? '-'}g` },
                ].map(n => (
                  <div key={n.label}>
                    <div className={`font-black text-sm ${n.green ? 'text-green-600' : 'text-gray-800'}`}>{n.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{n.label}</div>
                  </div>
                ))}
              </div>

              {/* Price + actions */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-gray-900">{p.price.toLocaleString()}원</span>
                  {p.originalPrice && (
                    <span className="text-sm text-gray-400 line-through ml-2">{p.originalPrice.toLocaleString()}원</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/hancandy/products/${p.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
                  >
                    상세보기 <ChevronRight size={12} />
                  </Link>
                  <button
                    onClick={() => handleAdd(p)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                      added === p.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    }`}
                  >
                    <ShoppingCart size={13} />
                    {added === p.id ? '담았어요!' : '장바구니'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">해당 카테고리 제품이 없습니다.</div>
      )}
    </div>
  );
}
