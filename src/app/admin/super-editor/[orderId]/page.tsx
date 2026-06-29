'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Loader2,
  Film, Printer, Lock, CreditCard, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

type OrderType   = 'video' | 'print';
type OrderStatus = 'editing' | 'queued' | 'processing' | 'done' | 'failed';
type SaveStatus  = 'idle' | 'saving' | 'saved' | 'error';

interface MediaOrder {
  id:         string;
  user_id:    string;
  order_type: OrderType;
  title:      string;
  snapshot:   string;
  is_paid:    number;
  payment_id: string | null;
  status:     OrderStatus;
  updated_at: number;
}

// 영상 스냅샷 스키마 (1단계 더미 필드)
interface VideoSnapshot {
  title:        string;
  description:  string;
  duration_sec: number;
  style:        string;
  bgm:          string;
  extra_notes:  string;
}

// 인쇄 스냅샷 스키마 (1단계 더미 필드)
interface PrintSnapshot {
  title:       string;
  paper_size:  string;
  quantity:    number;
  color_mode:  string;
  headline:    string;
  body_text:   string;
  extra_notes: string;
}

const DEFAULT_VIDEO: VideoSnapshot = {
  title: '', description: '', duration_sec: 30, style: 'modern', bgm: 'none', extra_notes: '',
};
const DEFAULT_PRINT: PrintSnapshot = {
  title: '', paper_size: 'A4', quantity: 100, color_mode: 'color', headline: '', body_text: '', extra_notes: '',
};

const VIDEO_STYLES  = ['modern', 'cinematic', 'minimal', 'energetic'];
const BGM_OPTIONS   = ['none', 'upbeat', 'calm', 'dramatic', 'corporate'];
const PAPER_SIZES   = ['A4', 'A3', 'B5', '명함', '전단지'];
const COLOR_MODES   = ['color', 'mono', 'spot'];

export default function SuperEditorPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order,      setOrder]      = useState<MediaOrder | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [paying,     setPaying]     = useState(false);
  const [payError,   setPayError]   = useState('');

  // 스냅샷 상태
  const [vSnap, setVSnap] = useState<VideoSnapshot>(DEFAULT_VIDEO);
  const [pSnap, setPSnap] = useState<PrintSnapshot>(DEFAULT_PRINT);

  // Auto-Save 관련 ref
  const dirtyRef    = useRef(false);
  const latestSnap  = useRef<VideoSnapshot | PrintSnapshot>(DEFAULT_VIDEO);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const orderRef    = useRef<MediaOrder | null>(null);

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current || !orderRef.current || orderRef.current.is_paid) return;
    dirtyRef.current = false;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/super-editor', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderId,
          snapshot: latestSnap.current,
          title:    (latestSnap.current as { title?: string }).title || orderRef.current.title,
        }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      dirtyRef.current = true; // 재시도를 위해 dirty 복원
      setSaveStatus('error');
    }
  }, [orderId]);

  // 3초 Auto-Save 인터벌
  useEffect(() => {
    intervalRef.current = setInterval(() => { saveNow(); }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [saveNow]);

  // 초기 로드
  useEffect(() => {
    fetch(`/api/admin/super-editor?orderId=${orderId}`)
      .then(r => r.json())
      .then(data => {
        const o: MediaOrder = data.order;
        setOrder(o);
        orderRef.current = o;
        const snap = JSON.parse(o.snapshot || '{}');
        if (o.order_type === 'video') {
          const v = { ...DEFAULT_VIDEO, ...snap };
          setVSnap(v);
          latestSnap.current = v;
        } else {
          const p = { ...DEFAULT_PRINT, ...snap };
          setPSnap(p);
          latestSnap.current = p;
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  function updateV(patch: Partial<VideoSnapshot>) {
    if (orderRef.current?.is_paid) return;
    const next = { ...vSnap, ...patch };
    setVSnap(next);
    latestSnap.current = next;
    dirtyRef.current   = true;
    setSaveStatus('saving');
  }

  function updateP(patch: Partial<PrintSnapshot>) {
    if (orderRef.current?.is_paid) return;
    const next = { ...pSnap, ...patch };
    setPSnap(next);
    latestSnap.current = next;
    dirtyRef.current   = true;
    setSaveStatus('saving');
  }

  async function handleManualSave() {
    dirtyRef.current = true;
    await saveNow();
  }

  async function handlePay() {
    if (!order || paying) return;
    setPaying(true);
    setPayError('');
    try {
      // 1. 결제 레코드 생성
      const initRes = await fetch('/api/admin/super-editor-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      });
      if (!initRes.ok) {
        const d = await initRes.json();
        setPayError(d.error ?? '결제 시작 실패');
        return;
      }
      const { paymentOrderId, amount } = await initRes.json();

      // 2. 미저장 내용 즉시 저장
      dirtyRef.current = true;
      await saveNow();

      // 3. Toss 결제 화면으로 이동
      router.push(
        `/admin/super-editor-payment?orderId=${orderId}&paymentOrderId=${paymentOrderId}&amount=${amount}`
      );
    } catch {
      setPayError('결제 시작 중 오류가 발생했습니다.');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-stone-300" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
        <AlertCircle size={36} />
        <p className="text-sm">주문을 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/admin/super-editor')}
          className="text-violet-600 font-bold text-sm hover:underline">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isLocked = order.is_paid === 1;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── 좌측 편집 패널 ──────────────────────────────────────── */}
      <aside className="w-80 shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 shrink-0">
          <button onClick={() => router.push('/admin/super-editor')}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            order.order_type === 'video' ? 'bg-violet-100' : 'bg-indigo-100',
          )}>
            {order.order_type === 'video'
              ? <Film size={14} className="text-violet-600" />
              : <Printer size={14} className="text-indigo-600" />}
          </div>
          <span className="font-bold text-stone-800 text-sm flex-1 truncate">{order.title || '제목 없음'}</span>

          {/* 저장 상태 */}
          <span className="text-xs shrink-0">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-stone-400">
                <Loader2 size={11} className="animate-spin" /> 저장 중
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle size={11} /> 저장됨
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle size={11} /> 오류
              </span>
            )}
          </span>

          {!isLocked && (
            <button onClick={handleManualSave} title="지금 저장"
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
              <Save size={14} />
            </button>
          )}
        </div>

        {/* 잠금 배너 */}
        {isLocked && (
          <div className="mx-4 mt-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shrink-0">
            <Lock size={14} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-700">결제 완료 — 편집 잠금</p>
              <p className="text-[11px] text-emerald-600">
                {order.status === 'queued'     && '처리 대기 중입니다.'}
                {order.status === 'processing' && '처리 중입니다...'}
                {order.status === 'done'       && '처리가 완료되었습니다.'}
                {order.status === 'failed'     && '처리에 실패했습니다.'}
              </p>
            </div>
          </div>
        )}

        {/* 편집 폼 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {order.order_type === 'video'
            ? <VideoForm snap={vSnap} onChange={updateV} locked={isLocked} />
            : <PrintForm snap={pSnap} onChange={updateP} locked={isLocked} />}
        </div>

        {/* 하단 — 결제 버튼 */}
        <div className="border-t border-stone-100 px-4 py-3 shrink-0 flex flex-col gap-2">
          {payError && (
            <p className="text-xs text-red-500 text-center">{payError}</p>
          )}
          {!isLocked ? (
            <button onClick={handlePay} disabled={paying}
              className={clsx(
                'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors',
                !paying
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed',
              )}>
              {paying
                ? <><Loader2 size={15} className="animate-spin" />처리 중...</>
                : <><CreditCard size={15} />결제하고 마감 제출</>}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-stone-50 rounded-xl border border-stone-200">
              {order.status === 'processing'
                ? <><Clock size={14} className="text-violet-500 animate-pulse" /><span className="text-sm text-stone-500 font-medium">처리 중...</span></>
                : <><CheckCircle size={14} className="text-emerald-500" /><span className="text-sm text-emerald-700 font-medium">제출 완료</span></>}
            </div>
          )}
        </div>
      </aside>

      {/* ── 우측 미리보기 패널 ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone-100">
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-stone-200 shrink-0">
          <span className="text-xs text-stone-400 font-medium">미리보기</span>
          <span className="text-xs text-stone-300">·</span>
          <span className="text-xs text-stone-500">
            {order.order_type === 'video' ? 'FullAutoCut (영상)' : 'FullAutoShot (인쇄)'}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-sm p-8 flex flex-col items-center gap-4 text-stone-400">
            {order.order_type === 'video'
              ? <Film size={48} className="opacity-20" />
              : <Printer size={48} className="opacity-20" />}
            <p className="text-sm font-medium">
              {order.order_type === 'video'
                ? '영상 미리보기는 컴파일 완료 후 제공됩니다'
                : '인쇄 미리보기는 컴파일 완료 후 제공됩니다'}
            </p>
            <p className="text-xs text-center leading-relaxed">
              결제 완료 후 자동으로 큐에 등록되어<br />
              {order.order_type === 'video' ? 'FullAutoCut' : 'FullAutoShot'} 엔진이 처리합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 영상 편집 폼 ──────────────────────────────────────────────────────────────
function VideoForm({ snap, onChange, locked }: {
  snap: VideoSnapshot;
  onChange: (p: Partial<VideoSnapshot>) => void;
  locked: boolean;
}) {
  const cls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50 disabled:text-stone-400';
  return (
    <>
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">기본 정보</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">제목</label>
            <input value={snap.title} disabled={locked} onChange={e => onChange({ title: e.target.value })}
              placeholder="영상 제목" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">설명 / 스크립트</label>
            <textarea value={snap.description} disabled={locked} onChange={e => onChange({ description: e.target.value })}
              placeholder="영상에 들어갈 내용을 자유롭게 입력하세요" rows={4}
              className={cls + ' resize-none'} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">영상 설정</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">목표 길이 (초)</label>
            <input type="number" min={10} max={300} value={snap.duration_sec} disabled={locked}
              onChange={e => onChange({ duration_sec: Number(e.target.value) || 30 })} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">스타일</label>
            <select value={snap.style} disabled={locked} onChange={e => onChange({ style: e.target.value })} className={cls}>
              {VIDEO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">배경음악</label>
            <select value={snap.bgm} disabled={locked} onChange={e => onChange({ bgm: e.target.value })} className={cls}>
              {BGM_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">추가 요청</h3>
        <textarea value={snap.extra_notes} disabled={locked} onChange={e => onChange({ extra_notes: e.target.value })}
          placeholder="특별 요청사항이 있으면 입력하세요" rows={3}
          className={cls + ' resize-none'} />
      </section>
    </>
  );
}

// ── 인쇄 편집 폼 ──────────────────────────────────────────────────────────────
function PrintForm({ snap, onChange, locked }: {
  snap: PrintSnapshot;
  onChange: (p: Partial<PrintSnapshot>) => void;
  locked: boolean;
}) {
  const cls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-stone-50 disabled:text-stone-400';
  return (
    <>
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">기본 정보</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">제목</label>
            <input value={snap.title} disabled={locked} onChange={e => onChange({ title: e.target.value })}
              placeholder="인쇄물 제목" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">헤드라인</label>
            <input value={snap.headline} disabled={locked} onChange={e => onChange({ headline: e.target.value })}
              placeholder="메인 문구 (크게 인쇄됨)" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">본문</label>
            <textarea value={snap.body_text} disabled={locked} onChange={e => onChange({ body_text: e.target.value })}
              placeholder="본문 텍스트를 입력하세요" rows={4}
              className={cls + ' resize-none'} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">인쇄 설정</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">용지 규격</label>
            <select value={snap.paper_size} disabled={locked} onChange={e => onChange({ paper_size: e.target.value })} className={cls}>
              {PAPER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">수량</label>
            <input type="number" min={1} max={10000} value={snap.quantity} disabled={locked}
              onChange={e => onChange({ quantity: Number(e.target.value) || 100 })} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">컬러 모드</label>
            <select value={snap.color_mode} disabled={locked} onChange={e => onChange({ color_mode: e.target.value })} className={cls}>
              {COLOR_MODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">추가 요청</h3>
        <textarea value={snap.extra_notes} disabled={locked} onChange={e => onChange({ extra_notes: e.target.value })}
          placeholder="특별 요청사항이 있으면 입력하세요" rows={3}
          className={cls + ' resize-none'} />
      </section>
    </>
  );
}
