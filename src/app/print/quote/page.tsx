'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Printer,
  Calculator,
  ChevronLeft,
  Check,
  Loader2,
  ShoppingCart,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  PRINT_PRODUCTS,
  PAPER_OPTIONS,
  COATING_OPTIONS,
  BINDING_OPTIONS,
} from '@/lib/db/print';
import { PrintCategory, PaperType, CoatingType, BindingType, PrintSide } from '@/types/print';

const CATEGORIES: { id: PrintCategory; label: string }[] = [
  { id: 'business-card', label: '명함' },
  { id: 'flyer', label: '전단·리플렛' },
  { id: 'booklet', label: '책자·카탈로그' },
  { id: 'banner', label: '배너·현수막' },
  { id: 'sticker', label: '스티커·라벨' },
  { id: 'package', label: '패키지·박스' },
];

const QUANTITIES = [100, 200, 500, 1000, 2000, 5000];

type OptionBtnProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  description?: string;
};

function OptionBtn({ active, onClick, children, description }: OptionBtnProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all',
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-stone-600 border-stone-200 hover:border-blue-300'
      )}
    >
      {active && <Check size={10} className="absolute top-1.5 right-1.5 opacity-80" />}
      <span className="font-semibold">{children}</span>
      {description && (
        <span className={clsx('text-[10px] leading-tight', active ? 'text-blue-100' : 'text-stone-400')}>
          {description}
        </span>
      )}
    </button>
  );
}

function QuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initCategory = (searchParams.get('category') as PrintCategory) ?? 'business-card';
  const initSize = searchParams.get('size') ?? '';

  const [category, setCategory] = useState<PrintCategory>(initCategory);
  const [size, setSize] = useState<string>(initSize);
  const [paper, setPaper] = useState<PaperType>('art');
  const [quantity, setQuantity] = useState<number>(100);
  const [binding, setBinding] = useState<BindingType>('none');
  const [coating, setCoating] = useState<CoatingType>('none');
  const [sides, setSides] = useState<PrintSide>('single');
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const products = PRINT_PRODUCTS.filter((p) => p.category === category);
  const sizes = products.flatMap((p) => p.sizes).filter((v, i, a) => a.indexOf(v) === i);

  useEffect(() => {
    if (sizes.length > 0 && !sizes.includes(size)) {
      setSize(sizes[0]);
    }
  }, [category, sizes, size]);

  const calcQuote = useCallback(async () => {
    if (!size) return;
    setLoading(true);
    try {
      const res = await fetch('/api/print/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, size, paper, quantity, binding, coating, sides }),
      });
      const { price: p } = await res.json();
      setPrice(p);
    } finally {
      setLoading(false);
    }
  }, [category, size, paper, quantity, binding, coating, sides]);

  useEffect(() => {
    const t = setTimeout(calcQuote, 200);
    return () => clearTimeout(t);
  }, [calcQuote]);

  const unitPrice = price !== null ? Math.round(price / quantity) : null;

  function handleOrder() {
    router.push(`/print/upload?category=${category}&size=${encodeURIComponent(size)}&quantity=${quantity}&price=${price}`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/print" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Printer size={13} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm leading-tight">견적 계산기</p>
            <p className="text-[10px] text-stone-400">옵션 선택 → 실시간 가격 확인</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-32 flex flex-col gap-6">
        {/* Category */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            상품 종류
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <OptionBtn key={cat.id} active={category === cat.id} onClick={() => setCategory(cat.id)}>
                {cat.label}
              </OptionBtn>
            ))}
          </div>
        </section>

        {/* Size */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            사이즈
          </h2>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <OptionBtn key={s} active={size === s} onClick={() => setSize(s)}>
                {s}
              </OptionBtn>
            ))}
          </div>
        </section>

        {/* Paper */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            용지 종류
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(PAPER_OPTIONS).map(([key, val]) => (
              <OptionBtn
                key={key}
                active={paper === key}
                onClick={() => setPaper(key as PaperType)}
                description={val.description}
              >
                {val.label}
              </OptionBtn>
            ))}
          </div>
        </section>

        {/* Quantity */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">4</span>
            수량
            <span className="ml-auto text-[10px] text-stone-400 font-normal">많을수록 단가 ↓</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUANTITIES.map((q) => (
              <OptionBtn key={q} active={quantity === q} onClick={() => setQuantity(q)}>
                {q.toLocaleString()}부
              </OptionBtn>
            ))}
          </div>
        </section>

        {/* Sides */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">5</span>
            인쇄 면
          </h2>
          <div className="flex gap-2">
            <OptionBtn active={sides === 'single'} onClick={() => setSides('single')}>단면</OptionBtn>
            <OptionBtn active={sides === 'double'} onClick={() => setSides('double')}>양면</OptionBtn>
          </div>
        </section>

        {/* Coating */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">6</span>
            코팅
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(COATING_OPTIONS).map(([key, val]) => (
              <OptionBtn key={key} active={coating === key} onClick={() => setCoating(key as CoatingType)}>
                {val.label}
              </OptionBtn>
            ))}
          </div>
        </section>

        {/* Binding */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">7</span>
            제본 (책자류)
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BINDING_OPTIONS).map(([key, val]) => (
              <OptionBtn key={key} active={binding === key} onClick={() => setBinding(key as BindingType)}>
                {val.label}
                {val.adder > 0 && <span className="text-[10px] opacity-70"> +{val.adder.toLocaleString()}원</span>}
              </OptionBtn>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky price footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-xl px-4 py-4 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-stone-400 mb-0.5">총 견적 금액</p>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <Loader2 size={20} className="text-blue-600 animate-spin" />
              ) : price !== null ? (
                <>
                  <span className="text-2xl font-black text-blue-700">{price.toLocaleString()}원</span>
                  <span className="text-xs text-stone-400">부당 {unitPrice?.toLocaleString()}원</span>
                </>
              ) : (
                <span className="text-stone-300 text-lg">—</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/print/upload')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:border-blue-300 transition-colors"
            >
              <Upload size={13} />
              파일 업로드
            </button>
            <button
              onClick={handleOrder}
              disabled={price === null}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 text-white text-xs font-bold transition-colors"
            >
              <ShoppingCart size={13} />
              주문하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteContent />
    </Suspense>
  );
}
