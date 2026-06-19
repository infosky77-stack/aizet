'use client';

import Link from 'next/link';
import { ArrowRight, Leaf, Heart, Zap, Moon, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { CANDY_PRODUCTS } from '@/lib/hancandy/products';
import { useCandyCart } from '@/store/candyCart';

const BENEFITS = [
  { icon: Shield, title: '무설탕 보장', desc: '자일리톨·스테비아로 충치 걱정 없이', color: 'text-green-600 bg-green-100' },
  { icon: Leaf, title: '천연 원료', desc: '국내산·해외 엄선 천연 기능성 원료', color: 'text-emerald-600 bg-emerald-100' },
  { icon: Heart, title: '건강기능성', desc: '각 제품별 특화 기능성 성분 함유', color: 'text-rose-500 bg-rose-100' },
  { icon: Sparkles, title: '무색소·무방부제', desc: '인공 첨가물 없이 깨끗하게', color: 'text-amber-600 bg-amber-100' },
];

const EFFECTS = [
  { icon: Shield, label: '면역 강화', color: 'bg-yellow-100 text-yellow-700' },
  { icon: Zap, label: '에너지 충전', color: 'bg-violet-100 text-violet-700' },
  { icon: Moon, label: '스트레스 완화', color: 'bg-emerald-100 text-emerald-700' },
  { icon: Sparkles, label: '피부 미용', color: 'bg-orange-100 text-orange-700' },
];

export default function HancandyHome() {
  const addItem = useCandyCart(s => s.addItem);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
          <Leaf size={12} />
          AIZET × HanCandy 브랜드 데모
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-5">
          달콤함은 그대로,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
            설탕은 빼고.
          </span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          한캔디(HanCandy)는 무설탕 건강기능성 캔디 브랜드입니다.<br />
          자일리톨과 천연 기능성 원료로 건강과 맛을 동시에.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link
            href="/hancandy/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-green-200 transition-all"
          >
            제품 보기 <ArrowRight size={16} />
          </Link>
          <Link
            href="/hancandy/chat"
            className="inline-flex items-center gap-2 border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold px-6 py-3 rounded-2xl transition-colors"
          >
            AI 상담받기 ✨
          </Link>
        </div>

        {/* Effect badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {EFFECTS.map(e => (
            <span key={e.label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${e.color}`}>
              <e.icon size={12} />
              {e.label}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {BENEFITS.map(b => (
          <div key={b.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${b.color}`}>
              <b.icon size={20} />
            </div>
            <div className="font-bold text-sm text-gray-800 mb-1">{b.title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </section>

      {/* Product preview */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">인기 제품</h2>
            <p className="text-sm text-gray-400 mt-0.5">효능별로 골라 드세요</p>
          </div>
          <Link href="/hancandy/products" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CANDY_PRODUCTS.map(p => (
            <div key={p.id} className={`rounded-2xl border-2 p-5 flex flex-col gap-3 hover:shadow-lg transition-all group ${p.bgColor}`}>
              <div className="flex items-start justify-between">
                <span className="text-4xl">{p.image}</span>
                {p.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
                    {p.badge}
                  </span>
                )}
              </div>
              <div>
                <div className="font-black text-gray-900 text-sm">{p.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.flavor}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.benefitTags.map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-white/70 text-gray-600 px-2 py-0.5 rounded-full border border-white/80">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/50">
                <div>
                  <span className="font-black text-gray-900">{p.price.toLocaleString()}원</span>
                  {p.originalPrice && (
                    <span className="text-xs text-gray-400 line-through ml-1.5">{p.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <button
                  onClick={() => addItem(p)}
                  className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl transition-colors"
                >
                  담기
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why HanCandy */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 md:p-12 text-white mb-14">
        <h2 className="text-2xl md:text-3xl font-black mb-6 text-center">왜 한캔디인가요?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: '0g', label: '당류 제로', desc: '모든 제품 당류 0g 보장. 혈당 걱정 없이 즐기세요.' },
            { num: '4종', label: '효능별 라인업', desc: '면역·에너지·수면·미용 – 당신에게 맞는 캔디 선택.' },
            { num: '100%', label: '자일리톨 감미', desc: '충치 예방 효과까지 있는 자일리톨 100% 사용.' },
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
        <h2 className="text-xl font-black text-gray-900 mb-2">어떤 캔디가 맞을까요?</h2>
        <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
          건강 목표, 라이프스타일, 알레르기 정보를 알려주시면 AI가 맞춤 캔디를 추천해 드립니다.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['"피부가 좋아지고 싶어요"', '"잠이 안 와요"', '"운동 전 에너지가 필요해요"'].map(ex => (
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
        <p>본 페이지는 AIZET의 쇼핑몰 플랫폼 데모입니다. 표시된 제품 및 가격은 가상 데이터이며 실제 판매가 이루어지지 않습니다. 주식회사 아이젯(aizet.co.kr) / HanCandy(hancandy.co.kr)는 현재 법인 설립 준비 중입니다.</p>
      </div>
    </div>
  );
}
