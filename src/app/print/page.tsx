'use client';

import { useState } from 'react';
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
  ChevronRight,
  Star,
  CreditCard,
  FileText,
  Tag,
  Layers,
  Sticker,
  Box,
  Folder,
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

export default function PrintCatalogPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<PrintCategory | 'all'>('all');

  const filtered = selectedCategory === 'all'
    ? PRINT_PRODUCTS
    : PRINT_PRODUCTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Printer size={14} className="text-white" />
            </div>
            <span className="font-bold text-blue-900 tracking-tight">AIZET 인쇄소</span>
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
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={11} />
              AI 상담 · 실시간 견적
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 leading-tight">
            빠르고 정확한<br />맞춤 인쇄 서비스
          </h1>
          <p className="text-blue-200 text-sm mb-7 max-w-lg">
            명함부터 패키지까지 — 전문 AI가 최적 옵션을 안내하고 실시간 견적을 제공합니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/print/quote')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Calculator size={15} />
              견적 계산기
            </button>
            <button
              onClick={() => router.push('/print/chat')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold rounded-xl text-sm transition-colors border border-white/20"
            >
              <MessageSquare size={15} />
              AI 상담하기
            </button>
          </div>

          {/* New feature quick links */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { href: '/print/files', icon: Folder, label: '거래처 파일 관리', sub: '버전 관리 · 재주문' },
              { href: '/print/labels', icon: Tag, label: '수출 라벨 생성기', sub: 'US/EU/JP/CN/KR/AU' },
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
      </main>
    </div>
  );
}
