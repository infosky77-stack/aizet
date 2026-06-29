'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Loader2,
  Film, Printer, Lock, CreditCard, Clock,
  FolderOpen, Image, Music, Trash2, Upload, ExternalLink, X, Type,
  Smartphone, RefreshCw, Download,
} from 'lucide-react';
import { clsx } from 'clsx';

type OrderType   = 'video' | 'print';
type OrderStatus = 'editing' | 'queued' | 'processing' | 'done' | 'failed';
type SaveStatus  = 'idle' | 'saving' | 'saved' | 'error';
type PanelTab    = 'preview' | 'files';
type SEFileType  = 'image' | 'video' | 'audio';

interface SEFile {
  id:         string;
  user_id:    string;
  filename:   string;
  orig_name:  string;
  file_type:  SEFileType;
  mime_type:  string;
  size_bytes: number;
  created_at: number;
}

interface MediaOrder {
  id:          string;
  user_id:     string;
  order_type:  OrderType;
  title:       string;
  snapshot:    string;
  is_paid:     number;
  payment_id:  string | null;
  status:      OrderStatus;
  updated_at:  number;
  output_uuid: string | null;
}

// 캔버스 블록
interface CanvasBlock {
  id:      string;
  type:    'text' | 'image';
  content: string;
}
interface CanvasState {
  blocks: CanvasBlock[];
}

// 영상 스냅샷 스키마
interface VideoSnapshot {
  title:        string;
  description:  string;
  duration_sec: number;
  style:        string;
  bgm:          string;
  extra_notes:  string;
  canvas:       CanvasState;
}

// 인쇄 스냅샷 스키마
interface PrintSnapshot {
  title:       string;
  paper_size:  string;
  quantity:    number;
  color_mode:  string;
  headline:    string;
  body_text:   string;
  extra_notes: string;
  canvas:      CanvasState;
}

const DEFAULT_VIDEO: VideoSnapshot = {
  title: '', description: '', duration_sec: 30, style: 'modern', bgm: 'none', extra_notes: '',
  canvas: { blocks: [] },
};
const DEFAULT_PRINT: PrintSnapshot = {
  title: '', paper_size: 'A4', quantity: 100, color_mode: 'color', headline: '', body_text: '', extra_notes: '',
  canvas: { blocks: [] },
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
  const [panelTab,   setPanelTab]   = useState<PanelTab>('preview');
  const [seFiles,    setSeFiles]    = useState<SEFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR / 모바일 전송
  const [qrDataUrl,  setQrDataUrl]  = useState<string | null>(null);
  const [qrLoading,  setQrLoading]  = useState(false);
  const [showQr,     setShowQr]     = useState(false);
  const [mobileNote, setMobileNote] = useState('');

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

  async function fetchFiles() {
    setFilesLoading(true);
    const res = await fetch('/api/admin/super-editor/files');
    if (res.ok) {
      const data = await res.json();
      setSeFiles(data.files ?? []);
    }
    setFilesLoading(false);
  }

  function handlePanelTab(tab: PanelTab) {
    setPanelTab(tab);
    if (tab === 'files' && seFiles.length === 0 && !filesLoading) fetchFiles();
  }

  async function uploadFiles(fileList: FileList) {
    setUploading(true);
    const uploaded: SEFile[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/super-editor/files', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(data.file);
      }
    }
    setSeFiles(prev => [...uploaded, ...prev]);
    setUploading(false);
  }

  async function handleDeleteFile(id: string) {
    setDeletingFile(id);
    await fetch(`/api/admin/super-editor/files?fileId=${id}`, { method: 'DELETE' });
    setSeFiles(prev => prev.filter(f => f.id !== id));
    setDeletingFile(null);
  }

  async function fetchQr() {
    setQrLoading(true);
    setMobileNote('');
    try {
      const res = await fetch('/api/admin/super-editor/mobile-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      });
      if (!res.ok) { setMobileNote('QR 생성 실패'); return; }
      const { qrDataUrl: url } = await res.json();
      setQrDataUrl(url);
    } catch {
      setMobileNote('네트워크 오류');
    } finally {
      setQrLoading(false);
    }
  }

  function handleToggleQr() {
    if (!showQr) {
      setShowQr(true);
      if (!qrDataUrl) fetchQr();
    } else {
      setShowQr(false);
    }
  }

  // SSE 연결 — 스마트폰 업로드 실시간 수신
  // 주의: stale closure 방지를 위해 functional setState + ref 사용
  useEffect(() => {
    const es = new EventSource(`/api/admin/super-editor/sse/${orderId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as {
          type: string; url?: string; fileId?: string; fileType?: string; filename?: string;
        };
        if (data.type !== 'file_uploaded' || !data.url) return;

        const isVideo = data.fileType === 'video';

        // 이미지만 캔버스에 삽입 — 동영상은 파일 관리자에만 추가
        if (!isVideo) {
          const url = data.url;
          const newBlock: CanvasBlock = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            type: 'image',
            content: url,
          };
          // functional update — 항상 최신 상태 기반으로 블록 추가
          if (orderRef.current?.order_type === 'video') {
            setVSnap(prev => {
              const next = { ...prev, canvas: { blocks: [...prev.canvas.blocks, newBlock] } };
              latestSnap.current = next;
              dirtyRef.current = true;
              return next;
            });
          } else {
            setPSnap(prev => {
              const next = { ...prev, canvas: { blocks: [...prev.canvas.blocks, newBlock] } };
              latestSnap.current = next;
              dirtyRef.current = true;
              return next;
            });
          }
          setSaveStatus('saving');
          setPanelTab('preview');
        }

        // 파일 목록에 즉시 추가 (이미지/동영상 모두)
        if (data.fileId && data.filename) {
          setSeFiles(prev => [{
            id:         data.fileId!,
            user_id:    '',
            filename:   data.filename!,
            orig_name:  data.filename!,
            file_type:  (data.fileType as SEFileType) ?? 'image',
            mime_type:  '',
            size_bytes: 0,
            created_at: Date.now(),
          }, ...prev]);
        }

        const note = isVideo
          ? '📹 동영상이 파일 관리자에 추가됐습니다'
          : '📱 이미지가 캔버스에 삽입됐습니다';
        setMobileNote(note);
        setTimeout(() => setMobileNote(''), 4000);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [orderId]); // orderRef/latestSnap/dirtyRef는 stable ref라 deps 불필요

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

  // 렌더링 진행 중 폴링 (5초마다 상태 갱신)
  useEffect(() => {
    if (!order || !['queued', 'processing'].includes(order.status)) return;
    const id = setInterval(() => {
      fetch(`/api/admin/super-editor?orderId=${orderId}`)
        .then(r => r.json())
        .then(data => {
          const o: MediaOrder = data.order;
          if (!o) return;
          setOrder(o);
          orderRef.current = o;
          if (o.status === 'done' || o.status === 'failed') clearInterval(id);
        })
        .catch(() => { /* 폴링 오류는 무시 */ });
    }, 5000);
    return () => clearInterval(id);
  }, [order?.status, orderId]);

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

  // ── 캔버스 헬퍼 ────────────────────────────────────────────────────────────
  function getCanvas(): CanvasState {
    return (order?.order_type === 'video' ? vSnap : pSnap).canvas;
  }

  function addCanvasBlock(block: CanvasBlock) {
    const next: CanvasState = { blocks: [...getCanvas().blocks, block] };
    order?.order_type === 'video' ? updateV({ canvas: next }) : updateP({ canvas: next });
  }

  function deleteCanvasBlock(id: string) {
    const next: CanvasState = { blocks: getCanvas().blocks.filter(b => b.id !== id) };
    order?.order_type === 'video' ? updateV({ canvas: next }) : updateP({ canvas: next });
  }

  function updateCanvasText(id: string, content: string) {
    const next: CanvasState = {
      blocks: getCanvas().blocks.map(b => b.id === id ? { ...b, content } : b),
    };
    order?.order_type === 'video' ? updateV({ canvas: next }) : updateP({ canvas: next });
  }

  function handleAddText() {
    addCanvasBlock({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: 'text', content: '' });
  }

  function handleInsertImage(url: string) {
    addCanvasBlock({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: 'image', content: url });
    setPanelTab('preview');
  }
  // ────────────────────────────────────────────────────────────────────────────

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
              {order.status === 'queued'
                ? <><Clock size={14} className="text-blue-400 animate-pulse" /><span className="text-sm text-blue-600 font-medium">렌더링 대기 중...</span></>
                : order.status === 'processing'
                ? <><Loader2 size={14} className="text-violet-500 animate-spin" /><span className="text-sm text-violet-600 font-medium">렌더링 중...</span></>
                : order.status === 'failed'
                ? <><AlertCircle size={14} className="text-red-400" /><span className="text-sm text-red-600 font-medium">렌더링 실패</span></>
                : <><CheckCircle size={14} className="text-emerald-500" /><span className="text-sm text-emerald-700 font-medium">완료</span></>}
            </div>
          )}
        </div>
      </aside>

      {/* ── 우측 패널 ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone-100">

        {/* 탭 헤더 */}
        <div className="flex items-center bg-white border-b border-stone-200 shrink-0">
          <button
            onClick={() => handlePanelTab('preview')}
            className={clsx(
              'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              panelTab === 'preview'
                ? 'border-violet-500 text-violet-700'
                : 'border-transparent text-stone-400 hover:text-stone-600',
            )}
          >
            미리보기
          </button>
          <button
            onClick={() => handlePanelTab('files')}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              panelTab === 'files'
                ? 'border-violet-500 text-violet-700'
                : 'border-transparent text-stone-400 hover:text-stone-600',
            )}
          >
            <FolderOpen size={12} />
            파일 관리자
            {seFiles.length > 0 && (
              <span className="bg-violet-100 text-violet-600 text-[10px] px-1.5 py-0.5 rounded-full">
                {seFiles.length}
              </span>
            )}
          </button>
          {panelTab === 'preview' && !isLocked && (
            <div className="ml-auto flex items-center gap-2 px-3">
              <button
                onClick={handleAddText}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-700 transition-colors"
              >
                <Type size={11} />
                텍스트 추가
              </button>
            </div>
          )}
          {panelTab === 'files' && (
            <div className="ml-auto flex items-center gap-2 px-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  uploading ? 'bg-stone-100 text-stone-400' : 'bg-violet-100 hover:bg-violet-200 text-violet-700',
                )}
              >
                {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                {uploading ? '업로드 중' : '업로드'}
              </button>
              <a
                href="/admin/super-editor/files"
                target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:bg-stone-100 transition-colors"
              >
                <ExternalLink size={11} />
                전체 관리
              </a>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={e => { if (e.target.files?.length) { uploadFiles(e.target.files); e.target.value = ''; } }}
              />
            </div>
          )}
        </div>

        {/* 캔버스 탭 */}
        {panelTab === 'preview' && order.status === 'done' && order.output_uuid ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-stone-900">
            <video
              controls
              className="max-w-full max-h-full rounded-xl shadow-lg"
              src={`/api/admin/render-output/${order.output_uuid}`}
            />
            <a
              href={`/api/admin/render-output/${order.output_uuid}`}
              download
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Download size={14} />
              다운로드
            </a>
          </div>
        ) : panelTab === 'preview' ? (
          <EditorCanvas
            blocks={getCanvas().blocks}
            orderType={order.order_type}
            locked={isLocked}
            onDelete={deleteCanvasBlock}
            onUpdateText={updateCanvasText}
          />
        ) : null}

        {/* 파일 관리자 탭 */}
        {panelTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* QR 무선 전송 섹션 */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <button
                onClick={handleToggleQr}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-stone-50 transition-colors text-left"
              >
                <Smartphone size={14} className="text-violet-500 shrink-0" />
                <span className="text-sm font-semibold text-stone-700 flex-1">스마트폰으로 사진 전송</span>
                <span className="text-xs text-stone-400">{showQr ? '닫기' : 'QR 열기'}</span>
              </button>

              {showQr && (
                <div className="px-4 pb-4 flex flex-col items-center gap-3 border-t border-stone-100 pt-3">
                  {qrLoading ? (
                    <Loader2 size={24} className="animate-spin text-stone-300 my-4" />
                  ) : qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="QR 코드" className="w-48 h-48 rounded-lg border border-stone-100" />
                      <p className="text-xs text-stone-500 text-center">
                        스마트폰 카메라로 QR코드를 스캔하세요<br />
                        <span className="text-stone-400">유효시간 15분 · 업로드 즉시 캔버스에 삽입됩니다</span>
                      </p>
                      <button
                        onClick={fetchQr}
                        disabled={qrLoading}
                        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-semibold"
                      >
                        <RefreshCw size={11} />
                        QR 새로고침
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400 py-2">{mobileNote || 'QR 생성 오류'}</p>
                  )}
                  {mobileNote && qrDataUrl && (
                    <p className="text-xs font-semibold text-emerald-600 text-center animate-pulse">{mobileNote}</p>
                  )}
                </div>
              )}
            </div>

            {/* 파일 목록 */}
            {filesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-stone-300" />
              </div>
            ) : seFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 py-16 text-stone-400 cursor-pointer border-2 border-dashed border-stone-200 rounded-2xl hover:border-violet-300 hover:bg-white transition-colors"
              >
                <Upload size={32} className="opacity-30" />
                <p className="text-sm">클릭해서 소재를 업로드하세요</p>
                <p className="text-xs text-stone-300">이미지 · 영상 · 오디오</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {seFiles.map(file => (
                  <div key={file.id} className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-violet-300 transition-colors">
                    <div className="aspect-video bg-stone-100 flex items-center justify-center relative overflow-hidden">
                      {file.file_type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/super-editor-files/${file.user_id}/${file.filename}`}
                          alt={file.orig_name}
                          className="w-full h-full object-cover"
                        />
                      ) : file.file_type === 'video' ? (
                        <Film size={24} className="text-stone-300" />
                      ) : (
                        <Music size={24} className="text-stone-300" />
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deletingFile === file.id}
                        className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-red-50 hover:text-red-500 text-stone-400 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {deletingFile === file.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Trash2 size={11} />}
                      </button>
                    </div>
                    <div className="px-2 py-1.5 flex items-center gap-1">
                      <p className="text-[10px] font-medium text-stone-600 truncate flex-1" title={file.orig_name}>
                        {file.orig_name}
                      </p>
                      {file.file_type === 'image' && !isLocked && (
                        <button
                          onClick={() => handleInsertImage(`/api/super-editor-files/${file.user_id}/${file.filename}`)}
                          className="shrink-0 text-[10px] font-bold text-violet-600 hover:text-violet-800 px-1.5 py-0.5 rounded hover:bg-violet-50 transition-colors"
                        >
                          삽입
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 캔버스 에디터 ─────────────────────────────────────────────────────────────
function EditorCanvas({
  blocks, orderType, locked, onDelete, onUpdateText,
}: {
  blocks:       CanvasBlock[];
  orderType:    OrderType;
  locked:       boolean;
  onDelete:     (id: string) => void;
  onUpdateText: (id: string, content: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);

  const isVideo = orderType === 'video';

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    setSelectedId(null);
    setEditingId(null);
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
      <div
        onClick={handleCanvasClick}
        className={clsx(
          'w-full rounded-2xl overflow-hidden shadow-xl relative',
          isVideo
            ? 'bg-stone-900 max-w-2xl'
            : 'bg-white border border-stone-200 max-w-lg',
        )}
        style={isVideo ? { aspectRatio: '16 / 9' } : { aspectRatio: '1 / 1.414' }}
      >
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {isVideo
              ? <Film size={40} className="text-stone-600" />
              : <Printer size={40} className="text-stone-300" />}
            <p className={clsx('text-sm text-center px-6', isVideo ? 'text-stone-500' : 'text-stone-300')}>
              {locked
                ? '결제 완료 — 컴파일 처리 중입니다'
                : isVideo
                  ? '위 [텍스트 추가] 버튼 또는 파일 관리자 [삽입]으로 소재를 추가하세요'
                  : '위 [텍스트 추가] 버튼 또는 파일 관리자 [삽입]으로 소재를 추가하세요'}
            </p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-3 h-full overflow-y-auto">
            {blocks.map((block) => (
              <div
                key={block.id}
                data-block="1"
                onClick={(e) => { e.stopPropagation(); setSelectedId(block.id); }}
                className={clsx(
                  'relative rounded-xl transition-all',
                  selectedId === block.id
                    ? 'ring-2 ring-violet-400'
                    : 'ring-1 ring-transparent hover:ring-stone-300',
                )}
              >
                {/* 삭제 버튼 */}
                {!locked && selectedId === block.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(block.id); setSelectedId(null); }}
                    className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={10} />
                  </button>
                )}

                {block.type === 'text' ? (
                  editingId === block.id && !locked ? (
                    <textarea
                      autoFocus
                      value={block.content}
                      onChange={(e) => onUpdateText(block.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      placeholder="텍스트를 입력하세요"
                      rows={3}
                      className={clsx(
                        'w-full p-3 rounded-xl resize-none text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-300',
                        isVideo ? 'text-white placeholder:text-stone-500' : 'text-stone-800',
                      )}
                    />
                  ) : (
                    <div
                      onClick={() => { if (!locked) { setSelectedId(block.id); setEditingId(block.id); } }}
                      className={clsx(
                        'w-full min-h-[48px] p-3 rounded-xl text-sm whitespace-pre-wrap cursor-text select-none',
                        block.content
                          ? (isVideo ? 'text-white' : 'text-stone-800')
                          : (isVideo ? 'text-stone-500 italic' : 'text-stone-300 italic'),
                      )}
                    >
                      {block.content || '클릭하여 텍스트 입력'}
                    </div>
                  )
                ) : (
                  <div className="w-full rounded-xl overflow-hidden bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={block.content}
                      alt=""
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
