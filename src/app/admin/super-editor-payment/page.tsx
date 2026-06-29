'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Printer, CreditCard, Smartphone, Loader2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

type Method = 'CARD' | 'KAKAOPAY' | 'NAVERPAY' | 'TOSSPAY';

const METHODS: { value: Method; label: string; icon: React.ReactNode; border: string }[] = [
  { value: 'CARD',     label: '신용/체크카드', icon: <CreditCard size={20} />, border: 'border-stone-300 hover:border-slate-500'  },
  { value: 'KAKAOPAY', label: '카카오페이',    icon: <Smartphone size={20} />, border: 'border-yellow-300 hover:border-yellow-500' },
  { value: 'NAVERPAY', label: '네이버페이',    icon: <Smartphone size={20} />, border: 'border-green-300 hover:border-green-500'   },
  { value: 'TOSSPAY',  label: '토스페이',      icon: <Smartphone size={20} />, border: 'border-blue-300 hover:border-blue-500'    },
];

function SuperEditorPaymentContent() {
  const searchParams     = useSearchParams();
  const router           = useRouter();
  const orderId          = searchParams.get('orderId')          ?? '';
  const paymentOrderId   = searchParams.get('paymentOrderId')   ?? '';
  const amount           = Number(searchParams.get('amount')    ?? '0');
  const orderType        = (searchParams.get('orderType') ?? 'video') as 'video' | 'print';

  const [method,  setMethod]  = useState<Method | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!orderId || !paymentOrderId) router.replace('/admin/super-editor');
  }, [orderId, paymentOrderId, router]);

  async function handlePay() {
    if (!method || !paymentOrderId) return;
    setLoading(true);
    setError('');
    try {
      const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      const base = {
        amount:    { currency: 'KRW' as const, value: amount },
        orderId:   paymentOrderId,
        orderName: orderType === 'video' ? '영상 자동 컴파일 (FullAutoCut)' : '인쇄 자동 컴파일 (FullAutoShot)',
        successUrl: `${window.location.origin}/admin/super-editor-payment/success?mediaOrderId=${orderId}`,
        failUrl:    `${window.location.origin}/admin/super-editor-payment/fail?mediaOrderId=${orderId}`,
      };

      if (method === 'CARD') {
        await payment.requestPayment({ method: 'CARD', ...base });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (payment.requestPayment as any)({
          method: 'EASY_PAY',
          ...base,
          easyPay: { easyPayProvider: method },
        });
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code !== 'PAY_PROCESS_CANCELED') setError('결제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const icon = orderType === 'video' ? <Film size={17} className="text-white" /> : <Printer size={17} className="text-white" />;
  const name = orderType === 'video' ? 'FullAutoCut (영상 컴파일)' : 'FullAutoShot (인쇄 컴파일)';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="font-bold text-violet-800 text-sm">{name}</p>
              <p className="text-xs text-stone-400">결제 후 자동 처리 큐에 등록됩니다</p>
            </div>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-3">
          <p className="font-semibold text-stone-700 text-sm">결제 내역</p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">{name}</span>
            <span className="text-stone-800 font-medium">{amount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-bold border-t border-stone-100 pt-3">
            <span>총 결제금액</span>
            <span className="text-violet-700 text-lg">{amount.toLocaleString()}원</span>
          </div>
        </div>

        {/* 결제수단 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
          <p className="font-semibold text-stone-700 text-sm">결제 방법 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-colors',
                  method === m.value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : `border-stone-200 text-stone-600 ${m.border}`,
                )}>
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button onClick={handlePay} disabled={!method || loading}
            className={clsx(
              'w-full py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-white',
              method && !loading ? 'bg-violet-600 hover:bg-violet-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
            )}>
            {loading
              ? <><Loader2 size={18} className="animate-spin" />결제 진행 중...</>
              : `${amount.toLocaleString()}원 결제하기`}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function SuperEditorPaymentPage() {
  return (
    <Suspense>
      <SuperEditorPaymentContent />
    </Suspense>
  );
}
