'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';
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
  const detailImage = `/images/hancandy/detail/hancandy_${product.number}ho_detail.png`;
  const [imgFailed, setImgFailed] = useState(false);

  function handleAdd() {
    addItem(product!);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <div className="px-4 pt-6 pb-4">
        <Link
          href="/hancandy/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors"
        >
          <ArrowLeft size={14} />
          제품 목록
        </Link>
      </div>

      {/* 상품 상세 이미지 (풀 너비 스크롤) */}
      {imgFailed ? (
        <div className={`mx-4 rounded-3xl ${product.headerBg} flex flex-col items-center justify-center py-16 text-center`}>
          <span className="text-6xl mb-4">{product.image}</span>
          <div className={`text-2xl font-black ${tc.text} mb-1`}>{product.name}</div>
          <p className={`text-sm font-semibold ${tc.text} opacity-70 mb-4`}>{product.slogan}</p>
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {product.benefitTags.map(t => (
              <span key={t} className={`text-xs font-semibold px-3 py-1 rounded-full ${tc.badge}`}>
                #{t}
              </span>
            ))}
          </div>
          <span className={`text-xs font-bold px-4 py-2 rounded-full ${tc.bg} text-white opacity-80`}>
            상세 이미지 준비중
          </span>
        </div>
      ) : (
        <img
          src={detailImage}
          alt={`${product.name} 상세 이미지`}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      )}

      {/* 구매 정보 */}
      <div className="px-4 py-6 flex flex-col gap-4">
        {/* 제품명 + 가격 */}
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">{product.name} — {product.nameEn}</h1>
          <p className={`text-sm ${tc.text} font-semibold mb-3`}>{product.slogan}</p>
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
          <p className="text-xs text-gray-400 mt-1">{product.weight} · 1회 섭취량 {product.nutrition.servingSize}</p>
        </div>

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

        {/* AI 상담 CTA */}
        <div className={`bg-gradient-to-r ${tc.gradient} rounded-2xl p-5 text-white flex items-center justify-between gap-4 flex-wrap mt-2`}>
          <div>
            <p className="font-bold text-base mb-1">1·2·3호 중 어떤 게 나에게 맞을까요?</p>
            <p className="text-sm opacity-80">AI 상담으로 딱 맞는 호를 추천받아 보세요.</p>
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

      {/* ── 제품 상세 정보 ── */}
      <div className="px-4 pb-10 flex flex-col gap-8">

        {/* 제품 소개 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">제품 소개</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{product.longDescription}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.benefitTags.map(tag => (
              <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tc.badge}`}>
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* 핵심 성분 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-3">핵심 성분</h2>
          <div className="flex flex-col gap-2.5">
            {product.keyIngredients.map(ing => (
              <div key={ing.name} className={`rounded-2xl p-4 ${tc.bgLight} border ${tc.border}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-black text-sm ${tc.text}`}>{ing.name}</span>
                    {ing.nameDetail && (
                      <span className="text-[10px] text-gray-400">{ing.nameDetail}</span>
                    )}
                    {ing.priority && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tc.badge}`}>{ing.priority}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-semibold shrink-0">{ing.role}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{ing.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 이런 때 드세요 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-3">이런 때 드세요</h2>
          <div className="flex flex-col gap-2">
            {product.scenarios.map(s => (
              <div key={s.situation} className="flex gap-3 bg-gray-50 rounded-xl p-3.5">
                <span className="text-xl shrink-0 leading-none pt-0.5">{s.icon}</span>
                <div>
                  <div className="font-bold text-sm text-gray-800">{s.situation}</div>
                  <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 전성분 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">전성분</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{product.ingredients.join(', ')}</p>
        </section>

        {/* 영양 정보 */}
        <section>
          <h2 className="text-base font-black text-gray-900 mb-3">영양 정보</h2>
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-500">
              1회 섭취량 {product.nutrition.servingSize} 기준
            </div>
            {[
              { label: '열량',     value: `${product.nutrition.calories}kcal` },
              { label: '당류',     value: `${product.nutrition.sugar}g` },
              { label: '탄수화물', value: `${product.nutrition.carbs}g` },
              { label: '단백질',   value: `${product.nutrition.protein}g` },
              { label: '지방',     value: `${product.nutrition.fat}g` },
            ].map((row, i) => (
              <div key={row.label} className={`flex justify-between px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <span className="text-gray-500">{row.label}</span>
                <span className="font-bold text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
