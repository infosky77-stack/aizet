'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CreditCard, Smartphone, Loader2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { PRICES } from '@/config/prices';

type Method = 'CARD' | 'KAKAOPAY' | 'NAVERPAY' | 'TOSSPAY';

const METHODS: { value: Method; label: string; icon: React.ReactNode; border: string }[] = [
  { value: 'CARD',     label: '신용/체크카드', icon: <CreditCard size={20} />,  border: 'border-stone-300 hover:border-slate-500'  },
  { value: 'KAKAOPAY', label: '카카오페이',    icon: <Smartphone size={20} />,  border: 'border-yellow-300 hover:border-yellow-500' },
  { value: 'NAVERPAY', label: '네이버페이',    icon: <Smartphone size={20} />,  border: 'border-green-300 hover:border-green-500'   },
  { value: 'TOSSPAY',  label: '토스페이',      icon: <Smartphone size={20} />,  border: 'border-blue-300 hover:border-blue-500'    },
];

function ImagePaymentContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const orderId      = searchParams.get('orderId') ?? '';

  const [method,        setMethod]        = useState<Method | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  // TODO: 테스트용, 배포 전 제거
  const [bypassLoading, setBypassLoading] = useState(false);

  useEffect(() => {
    if (!orderId) router.replace('/admin/settings');
  }, [orderId, router]);

  async function handlePay() {
    if (!method || !orderId) return;

    // payment.requestPayment()는 CARD/TRANSFER/MOBILE_PHONE만 지원
    // KAKAOPAY/NAVERPAY/TOSSPAY(EASY_PAY)는 위젯 플로우 전용 → 현재 미지원
    if (method !== 'CARD') {
      setError('현재 신용/체크카드 결제만 지원됩니다. 카드를 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: 'CARD',
        amount:    { currency: 'KRW' as const, value: PRICES.image_generation },
        orderId,
        orderName: 'AI 이미지 자동 생성',
        successUrl: `${window.location.origin}/admin/image-payment/success`,
        failUrl:    `${window.location.origin}/admin/image-payment/fail`,
      });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'PAY_PROCESS_CANCELED' || e?.code === 'PAY_PROCESS_ABORTED') return;
      setError(`결제 중 오류가 발생했습니다. (${e?.code ?? ''} ${e?.message ?? ''})`);
    } finally {
      setLoading(false);
    }
  }

  // TODO: 테스트용, 배포 전 제거
  async function handleBypass() {
    if (!orderId) return;
    setBypassLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/image-payment/bypass', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '바이패스 실패'); return; }
      // success 페이지로 이동 — confirm 호출 시 alreadyPaid 경로를 타서 이미지 생성 시작
      router.push(`/admin/image-payment/success?orderId=${orderId}&paymentKey=bypass&amount=1`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBypassLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.replace('/admin/settings')}
            className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-violet-800 text-sm">AI 이미지 자동 생성</p>
              <p className="text-xs text-stone-400">결제 후 이미지가 생성됩니다</p>
            </div>
          </div>
        </div>

        {/* 결제 금액 요약 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-3">
          <p className="font-semibold text-stone-700 text-sm">결제 내역</p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">업종별 AI 이미지 일괄 생성</span>
            <span className="text-stone-800 font-medium">{PRICES.image_generation.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-bold border-t border-stone-100 pt-3">
            <span>총 결제금액</span>
            <span className="text-violet-700 text-lg">{PRICES.image_generation.toLocaleString()}원</span>
          </div>
        </div>

        {/* 결제수단 선택 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
          <p className="font-semibold text-stone-700 text-sm">결제 방법 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(m => {
              const isCard = m.value === 'CARD';
              return (
                <button key={m.value} onClick={() => setMethod(m.value)}
                  className={clsx(
                    'flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-colors relative',
                    method === m.value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : `border-stone-200 text-stone-600 ${m.border}`,
                    !isCard && 'opacity-60',
                  )}>
                  {m.icon}
                  {m.label}
                  {!isCard && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-stone-200 text-stone-500 px-1 py-0.5 rounded font-semibold">
                      준비 중
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button onClick={handlePay} disabled={!method || loading}
            className={clsx(
              'w-full py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-white',
              method && !loading ? 'bg-violet-600 hover:bg-violet-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            )}>
            {loading
              ? <><Loader2 size={18} className="animate-spin" />결제 진행 중...</>
              : `${PRICES.image_generation.toLocaleString()}원 결제하기`}
          </button>

          {method && (
            <p className="text-xs text-stone-400 text-center">토스페이먼츠 안전결제로 연결됩니다</p>
          )}
        </div>

        {/* TODO: 테스트용, 배포 전 제거 */}
        <div className="text-center pb-2">
          <button
            onClick={handleBypass}
            disabled={bypassLoading}
            className="text-xs text-stone-300 hover:text-stone-500 transition-colors disabled:opacity-50"
          >
            {bypassLoading ? '처리 중...' : '🧪 테스트 결제 건너뛰기 (개발용)'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ImagePaymentPage() {
  return (
    <Suspense>
      <ImagePaymentContent />
    </Suspense>
  );
}
