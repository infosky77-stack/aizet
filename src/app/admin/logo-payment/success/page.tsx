'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle, XCircle, Loader2, Sparkles, AlertCircle,
  StopCircle, Download, ImageIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

type GenStatus = 'pending' | 'generating' | 'done' | 'error';
type Phase     = 'confirming' | 'generating' | 'selecting' | 'making-card' | 'card-done' | 'error' | 'aborted';

interface LogoItem { key: string; label: string; status: GenStatus; url?: string }

function LogoPaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId    = searchParams.get('orderId')    ?? '';
  const amount     = searchParams.get('amount')     ?? '';

  const [phase,       setPhase]       = useState<Phase>('confirming');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [logoList,    setLogoList]    = useState<LogoItem[]>([]);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);

  const ranOnce   = useRef(false);
  const abortCtrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startGeneration() {
    setPhase('generating');
    setLogoList([]);

    const ac = new AbortController();
    abortCtrl.current = ac;

    try {
      const res = await fetch('/api/admin/generate-logos', { method: 'POST', signal: ac.signal });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? `로고 생성 오류 (${res.status})`);
        setPhase('error');
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let receivedComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'start') {
              setLogoList(ev.styles.map((s: { key: string; label: string }) => ({
                key: s.key, label: s.label, status: 'pending' as const,
              })));
            } else if (ev.type === 'progress') {
              setLogoList(prev => prev.map(item =>
                item.key === ev.key ? { ...item, status: ev.status, url: ev.url } : item
              ));
            } else if (ev.type === 'complete') {
              receivedComplete = true;
              if (ev.aborted) {
                setPhase('aborted');
              } else {
                // 생성 완료 → 결제 건 자동 종료
                fetch('/api/admin/image-payment/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId }),
                }).catch(() => {});
                setPhase('selecting');
              }
            }
          } catch { /* 파싱 실패 무시 */ }
        }
      }

      if (!receivedComplete) {
        setErrorMsg('연결이 끊겼습니다. 다시 시도해 주세요.');
        setPhase('error');
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return;
      setErrorMsg('로고 생성 중 오류가 발생했습니다.');
      setPhase('error');
    }
  }

  async function run() {
    // 1. Toss 승인 (idempotent)
    try {
      const res  = await fetch('/api/admin/image-payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '결제 승인에 실패했습니다.');
        setPhase('error');
        return;
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setPhase('error');
      return;
    }

    await startGeneration();
  }

  function handleAbort() {
    setPhase('aborted');
    abortCtrl.current?.abort();
  }

  function handleResume() {
    startGeneration();
  }

  function handleComplete() {
    fetch('/api/admin/image-payment/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
    router.replace('/admin/settings');
  }

  async function handleMakeCard() {
    if (!selected) return;
    setPhase('making-card');
    try {
      const res = await fetch('/api/admin/generate-card', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ selectedStyle: selected }),
      });
      if (!res.ok) {
        setErrorMsg('명함 생성에 실패했습니다.');
        setPhase('selecting');
        return;
      }
      const blob = await res.blob();
      setCardDataUrl(URL.createObjectURL(blob));
      setPhase('card-done');
    } catch {
      setErrorMsg('명함 생성 중 오류가 발생했습니다.');
      setPhase('selecting');
    }
  }

  function downloadCard() {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href     = cardDataUrl;
    a.download = 'business-card.png';
    a.click();
  }

  // ── 승인 중 ──
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

  // ── 오류 ──
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-red-100 p-8 flex flex-col items-center gap-4">
          <AlertCircle size={44} className="text-red-400" />
          <p className="font-bold text-red-700 text-lg">오류가 발생했습니다</p>
          <p className="text-sm text-stone-500 text-center">{errorMsg}</p>
          <button onClick={() => router.replace('/admin/settings')}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors">
            설정 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const doneCount = logoList.filter(i => i.status === 'done' || i.status === 'error').length;
  const totalCount = logoList.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-lg flex flex-col gap-5">

        {/* 결제 완료 배너 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={22} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 text-sm">결제 완료</p>
            <p className="text-xs text-emerald-600">AI가 로고를 만들고 있습니다</p>
          </div>
        </div>

        {/* 로고 생성 진행 */}
        {(phase === 'generating' || phase === 'aborted') && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-violet-500" />
              <p className="font-semibold text-stone-700 text-sm">AI 로고 생성</p>
            </div>

            {phase === 'generating' && logoList.length === 0 && (
              <div className="flex items-center gap-2 text-violet-600 text-sm py-2">
                <Loader2 size={16} className="animate-spin" /> 준비 중...
              </div>
            )}

            {/* 로고 그리드 */}
            {logoList.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {logoList.map(item => (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <div className="aspect-square rounded-xl border-2 border-stone-100 bg-stone-50 flex items-center justify-center overflow-hidden">
                      {item.status === 'done' && item.url
                        ? <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        : item.status === 'generating'
                          ? <Loader2 size={24} className="animate-spin text-violet-400" />
                          : item.status === 'error'
                            ? <XCircle size={24} className="text-red-300" />
                            : <ImageIcon size={24} className="text-stone-300" />
                      }
                    </div>
                    <p className="text-xs text-center text-stone-500">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 진행률 + 중단 */}
            {phase === 'generating' && totalCount > 0 && (
              <div className="flex flex-col gap-2">
                <div>
                  <div className="flex justify-between text-xs text-stone-400 mb-1">
                    <span>{doneCount}/{totalCount}개</span>
                    <span>{Math.round((doneCount / totalCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5">
                    <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(doneCount / totalCount) * 100}%` }} />
                  </div>
                </div>
                <button onClick={handleAbort}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
                  <StopCircle size={14} /> 중단
                </button>
              </div>
            )}

            {/* 중단됨 */}
            {phase === 'aborted' && (
              <div className="border-t border-stone-100 pt-3 flex flex-col gap-2">
                <p className="text-sm text-amber-600 font-semibold flex items-center gap-1.5">
                  <StopCircle size={15} /> 중단됨
                </p>
                <button onClick={handleResume}
                  className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
                  이어서 만들기
                </button>
                <button onClick={handleComplete}
                  className="py-2.5 border border-stone-200 text-stone-500 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">
                  완료 (이 결제 건 종료)
                </button>
              </div>
            )}
          </div>
        )}

        {/* 로고 선택 */}
        {(phase === 'selecting' || phase === 'making-card' || phase === 'card-done') && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
            <p className="font-semibold text-stone-700 text-sm">마음에 드는 로고를 선택하세요</p>

            <div className="grid grid-cols-3 gap-3">
              {logoList.map(item => (
                <button key={item.key}
                  onClick={() => { if (phase === 'selecting') { setSelected(item.key); setCardDataUrl(null); } }}
                  disabled={item.status !== 'done' || phase !== 'selecting'}
                  className={clsx(
                    'flex flex-col gap-1.5 rounded-xl transition-all',
                    item.status !== 'done' && 'opacity-40 cursor-not-allowed',
                    selected === item.key && phase === 'selecting'
                      ? 'ring-2 ring-violet-500 ring-offset-2'
                      : '',
                  )}>
                  <div className="aspect-square rounded-xl border-2 border-stone-100 bg-stone-50 overflow-hidden">
                    {item.url
                      ? <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                      : <XCircle size={24} className="text-red-300 m-auto mt-8" />
                    }
                  </div>
                  <p className="text-xs text-center text-stone-500">{item.label}</p>
                  {selected === item.key && (
                    <p className="text-xs text-center text-violet-600 font-bold">✓ 선택됨</p>
                  )}
                </button>
              ))}
            </div>

            {phase === 'selecting' && (
              <button onClick={handleMakeCard} disabled={!selected}
                className={clsx(
                  'w-full py-3.5 font-bold rounded-xl transition-colors text-sm',
                  selected
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                )}>
                선택한 로고로 명함 만들기
              </button>
            )}

            {phase === 'making-card' && (
              <div className="flex items-center justify-center gap-2 py-3 text-violet-600 text-sm font-medium">
                <Loader2 size={18} className="animate-spin" /> 명함 합성 중...
              </div>
            )}

            {errorMsg && phase === 'selecting' && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}
          </div>
        )}

        {/* 명함 완성 */}
        {phase === 'card-done' && cardDataUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle size={16} /> 명함이 완성됐습니다!
            </div>
            <img src={cardDataUrl} alt="명함 미리보기" className="w-full rounded-xl border border-stone-100 shadow-sm" />
            <button onClick={downloadCard}
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
              <Download size={16} /> 명함 이미지 다운로드 (PNG)
            </button>
            <button onClick={() => router.replace('/admin/settings')}
              className="py-2.5 border border-stone-200 text-stone-500 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors text-center">
              설정으로 돌아가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LogoPaymentSuccessPage() {
  return <Suspense><LogoPaymentSuccessContent /></Suspense>;
}
