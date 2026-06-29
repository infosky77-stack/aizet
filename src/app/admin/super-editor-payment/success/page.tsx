'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, Clock, ArrowRight } from 'lucide-react';

type Phase = 'confirming' | 'done' | 'error';

function SuperEditorPaymentSuccessContent() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const paymentKey     = searchParams.get('paymentKey')    ?? '';
  const paymentOrderId = searchParams.get('orderId')       ?? '';
  const amount         = searchParams.get('amount')        ?? '';
  const mediaOrderId   = searchParams.get('mediaOrderId')  ?? '';

  const [phase,    setPhase]    = useState<Phase>('confirming');
  const [jobId,    setJobId]    = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    try {
      const res = await fetch('/api/admin/super-editor-payment/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentKey, paymentOrderId, amount: Number(amount), mediaOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '결제 승인 실패');
        setPhase('error');
        return;
      }
      // 결제 complete 마킹
      await fetch('/api/admin/super-editor-payment/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentOrderId }),
      }).catch(() => {});
      setJobId(data.jobId ?? '');
      setPhase('done');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setPhase('error');
    }
  }

  if (phase === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-[#fafaf8]">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Loader2 size={40} className="animate-spin text-violet-500" />
          <p className="font-bold text-stone-700">결제를 승인하는 중...</p>
          <p className="text-sm text-stone-400">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-red-100 p-8 flex flex-col items-center gap-4">
          <AlertCircle size={44} className="text-red-400" />
          <p className="font-bold text-red-700 text-lg">오류가 발생했습니다</p>
          <p className="text-sm text-stone-500 text-center">{errorMsg}</p>
          <button onClick={() => router.replace('/admin/super-editor')}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* 완료 배너 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={22} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 text-sm">결제 완료 · 큐 등록</p>
            <p className="text-xs text-emerald-600">자동 처리 대기열에 추가되었습니다</p>
          </div>
        </div>

        {/* 상태 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Clock size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-700 text-sm">처리 대기 중</p>
              <p className="text-xs text-stone-400">
                {jobId ? `잡 ID: ${jobId.slice(0, 8)}…` : '처리 중'}
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            서버에서 순서대로 처리합니다. 완료되면 주문 목록에서 결과를 확인하실 수 있습니다.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => router.replace('/admin/super-editor')}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              주문 목록 보기 <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SuperEditorPaymentSuccessPage() {
  return (
    <Suspense>
      <SuperEditorPaymentSuccessContent />
    </Suspense>
  );
}
