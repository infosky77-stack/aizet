'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, Clock, ArrowRight, Download } from 'lucide-react';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { buildCatalogPdf, type CatalogPdfInput } from '@/lib/super-editor/pdf/buildCatalogPdf';

type Phase = 'confirming' | 'generating' | 'done' | 'queued' | 'error';

// 결제 완료된 도록 주문의 PDF를 브라우저에서 직접 생성해 서버에 보관.
// 실패하면 catalog-server-fallback으로 기존 서버(python) 렌더 경로를 태워 절대 멈춰있지 않게 한다.
async function generateCatalogAndStore(mediaOrderId: string): Promise<{ outputUuid: string } | { fallback: true }> {
  const orderRes = await fetch(`/api/admin/super-editor?orderId=${mediaOrderId}`);
  if (!orderRes.ok) throw new Error('주문 조회 실패');
  const { order } = await orderRes.json();
  const snapshot = JSON.parse(order.snapshot || '{}') as CatalogPdfInput;

  const ledger = useFileLedgerStore.getState();
  ledger.setCurrentOrder(mediaOrderId);
  await ledger.refreshFromServer();
  const entries = useFileLedgerStore.getState().entries;

  const pdfBytes = await buildCatalogPdf(snapshot, entries);

  const formData = new FormData();
  formData.append('orderId', mediaOrderId);
  formData.append('pdf', new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }), 'catalog.pdf');

  const storeRes = await fetch('/api/admin/super-editor/catalog-store-render', {
    method: 'POST', body: formData,
  });
  if (!storeRes.ok) throw new Error('PDF 보관 실패');
  const data = await storeRes.json();
  return { outputUuid: data.outputUuid };
}

function SuperEditorPaymentSuccessContent() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const paymentKey     = searchParams.get('paymentKey')    ?? '';
  const paymentOrderId = searchParams.get('orderId')       ?? '';
  const amount         = searchParams.get('amount')        ?? '';
  const mediaOrderId   = searchParams.get('mediaOrderId')  ?? '';

  const [phase,      setPhase]      = useState<Phase>('confirming');
  const [jobId,      setJobId]      = useState('');
  const [outputUuid, setOutputUuid] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');
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

      if (data.orderType === 'catalog') {
        setPhase('generating');
        try {
          const result = await generateCatalogAndStore(mediaOrderId);
          if ('outputUuid' in result) {
            setOutputUuid(result.outputUuid);
            setPhase('done');
          }
        } catch {
          // 클라이언트 생성 실패 — 서버 렌더 안전망으로 전환
          await fetch('/api/admin/super-editor/catalog-server-fallback', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: mediaOrderId }),
          }).catch(() => {});
          setPhase('queued');
        }
        return;
      }

      setJobId(data.jobId ?? '');
      setPhase('queued');
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
            <p className="font-bold text-emerald-700 text-sm">결제 완료</p>
            <p className="text-xs text-emerald-600">
              {phase === 'generating' ? 'PDF를 만드는 중입니다' : phase === 'done' ? 'PDF가 준비됐습니다' : '자동 처리 대기열에 추가되었습니다'}
            </p>
          </div>
        </div>

        {/* 상태 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4">
          {phase === 'done' ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-700 text-sm">PDF 생성 완료</p>
                  <p className="text-xs text-stone-400">바로 다운로드할 수 있습니다</p>
                </div>
              </div>
              <a
                href={`/api/admin/render-output/${outputUuid}`}
                download
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} />도록 PDF 다운로드
              </a>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                {phase === 'generating'
                  ? <Loader2 size={20} className="text-violet-600 animate-spin" />
                  : <Clock size={20} className="text-violet-600" />}
              </div>
              <div>
                <p className="font-semibold text-stone-700 text-sm">
                  {phase === 'generating' ? 'PDF 생성 중...' : '처리 대기 중'}
                </p>
                <p className="text-xs text-stone-400">
                  {phase === 'generating' ? '잠시만 기다려 주세요' : jobId ? `잡 ID: ${jobId.slice(0, 8)}…` : '처리 중'}
                </p>
              </div>
            </div>
          )}
          {phase === 'queued' && (
            <p className="text-xs text-stone-500 leading-relaxed">
              서버에서 순서대로 처리합니다. 완료되면 주문 목록에서 결과를 확인하실 수 있습니다.
            </p>
          )}
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
