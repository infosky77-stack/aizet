'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  CheckCircle, XCircle, Loader2, Sparkles, ExternalLink, AlertCircle, StopCircle,
} from 'lucide-react';

type GenStatus = 'pending' | 'generating' | 'done' | 'error';
type Phase     = 'confirming' | 'generating' | 'done' | 'error' | 'aborted';

interface ImageItem { key: string; label: string; status: GenStatus }

function ImagePaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { session }  = useSession();

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId    = searchParams.get('orderId')    ?? '';
  const amount     = searchParams.get('amount')     ?? '';

  const [phase,      setPhase]      = useState<Phase>('confirming');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [imageList,  setImageList]  = useState<ImageItem[]>([]);
  const [driveLink,  setDriveLink]  = useState<string | null>(null);
  const [slug,       setSlug]       = useState<string | null>(null);
  const ranOnce    = useRef(false);
  const abortCtrl  = useRef<AbortController | null>(null);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startGeneration() {
    setPhase('generating');
    setImageList([]);

    const ac = new AbortController();
    abortCtrl.current = ac;
    try {
      const res = await fetch('/api/admin/generate-images', { method: 'POST', signal: ac.signal });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? `이미지 생성 오류 (${res.status})`);
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
              setImageList(ev.images.map((img: { key: string; label: string }) => ({
                key: img.key, label: img.label, status: 'pending' as const,
              })));
            } else if (ev.type === 'progress') {
              setImageList(prev => prev.map(item =>
                item.key === ev.key ? { ...item, status: ev.status } : item
              ));
            } else if (ev.type === 'complete') {
              if (ev.driveWebViewLink) setDriveLink(ev.driveWebViewLink);
              receivedComplete = true;
              if (ev.aborted) {
                setPhase('aborted');
              } else {
                // 생성 완료 → 결제 건 자동 종료 (다음에 새 결제 필요)
                fetch('/api/admin/image-payment/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId }),
                }).catch(() => {});
                setPhase('done');
              }
            }
          } catch { /* 파싱 실패 무시 */ }
        }
      }

      if (!receivedComplete) {
        setErrorMsg('연결이 끊겼습니다. 설정 페이지에서 이미지를 확인해주세요.');
        setPhase('error');
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return; // 사용자 중단 — 이미 'aborted' 처리됨
      setErrorMsg('이미지 생성 중 오류가 발생했습니다.');
      setPhase('error');
    }
  }

  async function run() {
    // 1. Toss 승인 + DB 기록 (idempotent — 이미 paid면 ok 반환)
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

    // 2. 프로필에서 slug 미리 조회 (완료 후 홈페이지 링크용)
    fetch('/api/user/profile').then(r => r.json()).then(d => {
      if (d.user?.slug) setSlug(d.user.slug);
    }).catch(() => {});

    // 3. SSE 이미지 생성
    await startGeneration();
  }

  function handleAbort() {
    setPhase('aborted');
    abortCtrl.current?.abort();
  }

  function handleResume() {
    // 같은 결제 건으로 이어서 생성 — 결제 재승인 없이 생성만 재시작
    setDriveLink(null);
    startGeneration();
  }

  function handleComplete() {
    // 결제 건 명시적 종료 → 다음 생성 시 새 결제 필요
    fetch('/api/admin/image-payment/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
    router.replace('/admin/settings');
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

  // ── 생성 중 / 완료 ──
  const doneCount  = imageList.filter(i => i.status === 'done' || i.status === 'error').length;
  const totalCount = imageList.length;
  const succeeded  = imageList.filter(i => i.status === 'done').length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-violet-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* 결제 완료 배너 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={22} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 text-sm">결제 완료</p>
            <p className="text-xs text-emerald-600">이미지 생성을 시작합니다</p>
          </div>
        </div>

        {/* 진행 상황 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-violet-500" />
            <p className="font-semibold text-stone-700 text-sm">AI 이미지 생성</p>
          </div>

          {/* 준비 중 스피너 */}
          {phase === 'generating' && imageList.length === 0 && (
            <div className="flex items-center gap-2 text-violet-600 text-sm py-2">
              <Loader2 size={16} className="animate-spin" />
              준비 중...
            </div>
          )}

          {/* 체크리스트 */}
          {imageList.length > 0 && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {imageList.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.status === 'done'       && <CheckCircle size={18} className="text-emerald-500" />}
                    {item.status === 'generating' && <Loader2 size={18} className="animate-spin text-violet-500" />}
                    {item.status === 'error'      && <XCircle size={18} className="text-red-400" />}
                    {item.status === 'pending'    && <span className="w-4 h-4 rounded-full border-2 border-stone-300 block" />}
                  </span>
                  <span className={[
                    'text-sm',
                    item.status === 'done'       ? 'text-stone-700 font-medium'   : '',
                    item.status === 'generating' ? 'text-violet-700 font-semibold' : '',
                    item.status === 'error'      ? 'text-red-500'                  : '',
                    item.status === 'pending'    ? 'text-stone-400'                : '',
                  ].join(' ')}>
                    {item.label} 사진
                    {item.status === 'generating' && ' 생성 중...'}
                    {item.status === 'done'       && ' 완료'}
                    {item.status === 'error'      && ' 실패'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 진행률 바 + 중단 버튼 */}
          {phase === 'generating' && totalCount > 0 && (
            <div className="flex flex-col gap-2">
              <div>
                <div className="flex justify-between text-xs text-stone-400 mb-1">
                  <span>{doneCount}/{totalCount}장</span>
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
            <div className="border-t border-stone-100 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <StopCircle size={18} />
                {succeeded}장 완료, 중단됨
              </div>
              <p className="text-xs text-stone-400">
                완료된 이미지는 홈페이지에 반영됩니다. 나머지 이미지를 생성하려면 다시 생성하기를 눌러주세요.
              </p>
              <div className="flex flex-col gap-2">
                {slug && (
                  <a href={`/site/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl transition-colors">
                    <ExternalLink size={14} /> 현재 홈페이지 보기
                  </a>
                )}
                <button onClick={handleResume}
                  className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
                  이어서 만들기
                </button>
                <button onClick={handleComplete}
                  className="py-2.5 border border-stone-200 text-stone-500 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">
                  완료 (이 결제 건 종료)
                </button>
              </div>
            </div>
          )}

          {/* 완료 */}
          {phase === 'done' && (
            <div className="border-t border-stone-100 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle size={18} />
                완성! ({succeeded}/{totalCount}장 성공)
              </div>
              <div className="flex flex-col gap-2">
                {slug && (
                  <a href={`/site/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                    <ExternalLink size={14} /> 내 홈페이지 보기
                  </a>
                )}
                {driveLink && (
                  <a href={driveLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl transition-colors">
                    <ExternalLink size={14} /> 구글 드라이브 보기
                  </a>
                )}
                <button onClick={() => router.replace('/admin/settings')}
                  className="py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">
                  설정으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ImagePaymentSuccessPage() {
  return (
    <Suspense>
      <ImagePaymentSuccessContent />
    </Suspense>
  );
}
