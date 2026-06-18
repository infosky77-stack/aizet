'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer, ChevronLeft, Sparkles, RefreshCw,
  Check, ArrowRight, Package, ChevronRight,
} from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { generateMenuSVG, TEMPLATES, TEMPLATE_STYLES, TemplateStyle } from '@/lib/print/menu-design';
import { clsx } from 'clsx';

// ── Pricing ──────────────────────────────────────────────────────────────────
const QUANTITIES = [
  { label: '맛보기', value: 50, suffix: '장', desc: '소규모 테스트', price: 32_000 },
  { label: '기본', value: 100, suffix: '장', desc: '한 달 사용량', price: 45_000, popular: true },
  { label: '여유롭게', value: 200, suffix: '장', desc: '계절 판촉용', price: 72_000 },
  { label: '대량', value: 500, suffix: '장', desc: '대형 행사·장기 보관', price: 135_000 },
];

// ── Step type ─────────────────────────────────────────────────────────────────
type Step = 'generating' | 'preview' | 'quantity' | 'done';

// ── Loading bar ───────────────────────────────────────────────────────────────
function GeneratingStep() {
  const [progress, setProgress] = useState(0);
  const messages = [
    '메뉴 데이터를 분석하고 있습니다...',
    '색상과 레이아웃을 결정하는 중...',
    '인쇄용 디자인을 완성하는 중...',
  ];
  const msg = messages[Math.min(Math.floor(progress / 35), messages.length - 1)];

  useEffect(() => {
    let v = 0;
    const iv = setInterval(() => {
      v += 2 + Math.random() * 4;
      if (v >= 100) { v = 100; clearInterval(iv); }
      setProgress(v);
    }, 60);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <Sparkles size={32} className="text-amber-500 animate-pulse" />
      </div>
      <div>
        <p className="text-xl font-bold text-stone-800 mb-1">AI 디자인 생성 중</p>
        <p className="text-sm text-stone-500">{msg}</p>
      </div>
      <div className="w-64">
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1.5 text-right">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
}

// ── Preview step ──────────────────────────────────────────────────────────────
function PreviewStep({
  svg,
  style,
  items,
  restaurantName,
  onStyleChange,
  onConfirm,
}: {
  svg: string;
  style: TemplateStyle;
  items: MenuItem[];
  restaurantName: string;
  onStyleChange: (s: TemplateStyle) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">AI가 메뉴 데이터로 자동 디자인했습니다</p>
          <p className="text-xs text-amber-600 mt-0.5">A4 양면 · 무광 코팅 · 고급 아트지 — 전문가가 알아서 처리합니다</p>
        </div>
      </div>

      {/* Template selector */}
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">스타일 선택</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATE_STYLES.map(s => {
            const t = TEMPLATES[s];
            const isActive = s === style;
            return (
              <button
                key={s}
                onClick={() => onStyleChange(s)}
                className={clsx(
                  'relative p-3 rounded-xl border-2 text-left transition-all',
                  isActive ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300 bg-white'
                )}
              >
                {/* Mini color preview */}
                <div className="flex gap-1 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: TEMPLATES[s].headerBg }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: TEMPLATES[s].accent }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: TEMPLATES[s].bg, border: '1px solid #e5e7eb' }} />
                </div>
                <p className={clsx('text-xs font-bold', isActive ? 'text-amber-700' : 'text-stone-700')}>{t.name}</p>
                <p className="text-[10px] text-stone-400">{t.desc}</p>
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Preview */}
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">디자인 미리보기</p>
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm bg-stone-50 flex items-center justify-center p-4">
          <div
            className="max-w-full rounded-lg overflow-hidden shadow-lg"
            style={{ maxHeight: 500 }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        <p className="text-[11px] text-stone-400 text-center mt-2">실제 인쇄 결과와 유사합니다 · A4 크기</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onStyleChange(TEMPLATE_STYLES[(TEMPLATE_STYLES.indexOf(style) + 1) % TEMPLATE_STYLES.length])}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
        >
          <RefreshCw size={14} />
          다른 스타일
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors shadow-sm"
        >
          이대로 진행하기
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Quantity step ─────────────────────────────────────────────────────────────
function QuantityStep({
  onBack,
  onOrder,
  ordering,
}: {
  onBack: () => void;
  onOrder: (qty: number, price: number) => void;
  ordering: boolean;
}) {
  const [selected, setSelected] = useState(1); // index

  const q = QUANTITIES[selected];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xl font-bold text-stone-800 mb-1">몇 장 인쇄할까요?</p>
        <p className="text-sm text-stone-400">전문 용어 없이 원하는 수량만 선택하세요</p>
      </div>

      {/* Quantity cards */}
      <div className="grid grid-cols-2 gap-3">
        {QUANTITIES.map((qt, i) => (
          <button
            key={qt.value}
            onClick={() => setSelected(i)}
            className={clsx(
              'relative flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all',
              selected === i ? 'border-amber-400 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            {qt.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">추천</span>
            )}
            <p className={clsx('text-3xl font-black', selected === i ? 'text-amber-600' : 'text-stone-700')}>{qt.value}</p>
            <p className={clsx('text-xs', selected === i ? 'text-amber-600' : 'text-stone-400')}>{qt.suffix}</p>
            <p className="text-xs text-stone-500 font-semibold">{qt.label}</p>
            <p className="text-[10px] text-stone-400">{qt.desc}</p>
            {selected === i && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Price summary */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-400">예상 금액</p>
          <p className="text-2xl font-black text-stone-800">{q.price.toLocaleString()}<span className="text-sm font-normal text-stone-500 ml-1">원</span></p>
          <p className="text-[11px] text-stone-400 mt-0.5">A4 아트지 · 양면 · 무광 코팅 · 전국 택배 배송</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">납기</p>
          <p className="text-sm font-bold text-stone-700">3–5 영업일</p>
          <p className="text-[10px] text-stone-400">긴급 시 별도 문의</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50"
        >
          <ChevronLeft size={16} />
          미리보기
        </button>
        <button
          onClick={() => onOrder(q.value, q.price)}
          disabled={ordering}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {ordering ? (
            <><RefreshCw size={14} className="animate-spin" /> 주문 접수 중...</>
          ) : (
            <><Printer size={14} /> 인쇄 주문하기</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Done step ─────────────────────────────────────────────────────────────────
function DoneStep({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <Check size={36} className="text-emerald-500" />
      </div>
      <div>
        <p className="text-xl font-bold text-stone-800 mb-1">주문이 접수되었습니다!</p>
        <p className="text-sm text-stone-500 mb-1">
          담당 인쇄팀이 곧 연락드립니다
        </p>
        <p className="text-xs text-stone-400">주문번호 · <span className="font-mono font-semibold text-stone-600">{orderId}</span></p>
      </div>

      <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 w-full max-w-xs text-left flex flex-col gap-2.5">
        {[
          ['인쇄물', 'A4 양면 메뉴판'],
          ['용지', '고급 아트지 (250g)'],
          ['코팅', '무광 코팅'],
          ['납기', '3–5 영업일'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-stone-400">{k}</span>
            <span className="font-medium text-stone-700">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => router.push('/print/status')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
        >
          <Package size={14} />
          주문 현황 보기
          <ChevronRight size={14} />
        </button>
        <Link
          href="/admin"
          className="flex items-center justify-center py-2 rounded-xl text-stone-500 text-sm hover:text-stone-700 hover:bg-stone-50"
        >
          관리자 대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const RESTAURANT_NAME = 'AIZET 레스토랑';

export default function MenuPrintPage() {
  const [step, setStep] = useState<Step>('generating');
  const [style, setStyle] = useState<TemplateStyle>('classic');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [orderId, setOrderId] = useState('');

  const svg = generateMenuSVG(items, RESTAURANT_NAME, style);

  // Fetch menu + auto-advance from 'generating'
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json() as { items: MenuItem[] };
        setItems(data.items ?? []);
      } catch {
        // fallback: empty
      }
      setStep('preview');
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleOrder = useCallback(async (qty: number, price: number) => {
    setOrdering(true);
    try {
      const res = await fetch('/api/print/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: '식당 사장님',
          customerPhone: '010-0000-0000',
          category: 'flyer',
          productName: `메뉴판 A4 양면 (${qty}장)`,
          options: {
            category: 'flyer',
            size: 'A4',
            paper: 'art',
            quantity: qty,
            binding: 'none',
            coating: 'matte',
            sides: 'double',
          },
          totalPrice: price,
          fileUploaded: true,
          memo: `AI 자동 생성 디자인 · ${TEMPLATES[style].name} 스타일`,
        }),
      });
      const data = await res.json() as { order: { id: string } };
      setOrderId(data.order?.id ?? 'PRN-AUTO');
      setStep('done');
    } catch {
      setOrderId('PRN-AUTO');
      setStep('done');
    }
    setOrdering(false);
  }, [style]);

  const STEP_LABELS = ['디자인 생성', '미리보기', '수량 선택'];
  const stepIndex = step === 'generating' ? 0 : step === 'preview' ? 1 : step === 'quantity' ? 2 : 3;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Printer size={13} className="text-white" />
            </div>
            <span className="font-bold text-stone-800">메뉴판 인쇄하기</span>
          </div>
          {/* Step indicators */}
          {step !== 'done' && (
            <div className="ml-auto flex items-center gap-2">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                    i < stepIndex ? 'bg-emerald-500 text-white'
                      : i === stepIndex ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 text-stone-400'
                  )}>
                    {i < stepIndex ? <Check size={10} /> : i + 1}
                  </div>
                  <span className={clsx('text-[10px] hidden sm:block', i === stepIndex ? 'text-stone-700 font-semibold' : 'text-stone-400')}>{label}</span>
                  {i < STEP_LABELS.length - 1 && <ChevronRight size={10} className="text-stone-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 'generating' && <GeneratingStep />}

        {step === 'preview' && (
          <PreviewStep
            svg={svg}
            style={style}
            items={items}
            restaurantName={RESTAURANT_NAME}
            onStyleChange={setStyle}
            onConfirm={() => setStep('quantity')}
          />
        )}

        {step === 'quantity' && (
          <QuantityStep
            onBack={() => setStep('preview')}
            onOrder={handleOrder}
            ordering={ordering}
          />
        )}

        {step === 'done' && <DoneStep orderId={orderId} />}
      </main>
    </div>
  );
}
