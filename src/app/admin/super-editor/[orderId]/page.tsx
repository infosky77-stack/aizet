'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Loader2,
  Film, Printer, BookOpen, Lock, CreditCard, Clock,
  FolderOpen, Image, Music, Trash2, ExternalLink, X, Type,
  Smartphone, RefreshCw, Download, ChevronUp, ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import { CachedImg } from '@/components/ui/CachedImg';
import { FileManagerPanel } from '@/components/super-editor/FileManagerPanel';
import { FullscreenDropZone } from '@/components/super-editor/FullscreenDropZone';
import { useFileLedgerStore, useOrderedFileEntries } from '@/lib/super-editor/ledger/store';
import { getEntryStatus, getOrderedEntries, resolveDisplayUrl, findLocation } from '@/lib/super-editor/ledger/selectors';
import type { FileEntry } from '@/lib/super-editor/ledger/types';
import { buildCatalogPdf } from '@/lib/super-editor/pdf/buildCatalogPdf';

const CatalogFlipbook = dynamic(
  () => import('@/components/catalog/CatalogFlipbook'),
  { ssr: false },
);

type OrderType   = 'video' | 'print' | 'catalog' | 'magazine';
type OrderStatus = 'editing' | 'queued' | 'processing' | 'done' | 'failed';
type SaveStatus  = 'idle' | 'saving' | 'saved' | 'error';
type PanelTab    = 'preview' | 'files';

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

// ── 캔버스 블록 (영상·인쇄 공용) ───────────────────────────────────────────
interface CanvasBlock { id: string; type: 'text' | 'image'; content: string; }
interface CanvasState { blocks: CanvasBlock[]; }

// ── 영상 스냅샷 ─────────────────────────────────────────────────────────────
interface VideoSnapshot {
  title: string; description: string; duration_sec: number;
  style: string; bgm: string; extra_notes: string; canvas: CanvasState;
}

// ── 인쇄 스냅샷 ─────────────────────────────────────────────────────────────
interface PrintSnapshot {
  title: string; paper_size: string; quantity: number; color_mode: string;
  headline: string; body_text: string; extra_notes: string; canvas: CanvasState;
}

// ── 도록 스냅샷 ─────────────────────────────────────────────────────────────
interface ArtworkEntry {
  id:            string;
  imageUrl:      string;
  title:         string;
  year:          string;
  medium:        string;
  size:          string;
  description:   string;
  sourceFileId?: string; // 영속 — 실제 서버 파일 id(중복 추가 방지, "포함됨" 판정용) — 기존 스냅샷엔 없을 수 있음
  sourceEntryId?: string; // 세션 한정 — 원장(ledger) 항목 id. 업로드 진행 중 실시간 상태 동기화용, 새로고침 후엔 의미 없음(저장 대상 아님)
  uploadStatus?: 'uploading' | 'error'; // 로컬 낙관적 미리보기 상태 — 서버 저장 대상 아님(휘발성)
}
interface CatalogSnapshot {
  exhibition_title: string;
  artist_name:      string;
  paper_size:       'A4' | 'A5';
  artworks:         ArtworkEntry[];
}

const DEFAULT_VIDEO: VideoSnapshot = {
  title: '', description: '', duration_sec: 30, style: 'modern', bgm: 'none', extra_notes: '',
  canvas: { blocks: [] },
};
const DEFAULT_PRINT: PrintSnapshot = {
  title: '', paper_size: 'A4', quantity: 100, color_mode: 'color', headline: '', body_text: '', extra_notes: '',
  canvas: { blocks: [] },
};
const DEFAULT_CATALOG: CatalogSnapshot = {
  exhibition_title: '', artist_name: '', paper_size: 'A4', artworks: [],
};

const VIDEO_STYLES = ['modern', 'cinematic', 'minimal', 'energetic'];
const BGM_OPTIONS  = ['none', 'upbeat', 'calm', 'dramatic', 'corporate'];
const PAPER_SIZES  = ['A4', 'A3', 'B5', '명함', '전단지'];
const COLOR_MODES  = ['color', 'mono', 'spot'];

export default function SuperEditorPage() {
  const params  = useParams();
  const router  = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  // 사업장 컨텍스트로 진입했으면 siteId 보유(인덱스→editHref가 ?siteId= 로 전달). QR 발급 시
  // 이 값을 실어 보내 모바일 업로드가 그 사업장에 격리 저장되게 한다. 없으면 null → 안 붙임(하위호환).
  const siteId = searchParams.get('siteId');

  const [order,        setOrder]        = useState<MediaOrder | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>('idle');
  const [paying,       setPaying]       = useState(false);
  const [payError,     setPayError]     = useState('');
  const [panelTab,     setPanelTab]     = useState<PanelTab>('preview');
  const [pdfResetLoading, setPdfResetLoading] = useState(false);
  const [testRenderState, setTestRenderState] = useState<'idle' | 'generating' | 'error'>('idle');
  const catalogTabInit = useRef(false);
  const [mobilePanelView, setMobilePanelView] = useState<'edit' | 'right'>('right');
  const ledgerEntries = useOrderedFileEntries(orderId);
  // 이 세션에서 처음 마운트될 때 이미 있던(=과거에 업로드된) 파일 id 집합 — 도록 자동추가가
  // "이 세션에서 새로 들어온 파일"만 대상으로 삼기 위한 기준선(사용자 전체 공용 라이브러리가
  // 새 도록에 통째로 딸려들어오는 걸 막음). 최초 refreshFromServer 완료 직후 한 번만 채워짐.
  const seenAtMountRef = useRef<Set<string> | null>(null);

  // QR / 모바일 전송
  const [qrDataUrl,  setQrDataUrl]  = useState<string | null>(null);
  const [qrLoading,  setQrLoading]  = useState(false);
  const [showQr,     setShowQr]     = useState(false);
  const [mobileNote, setMobileNote] = useState('');

  // 스냅샷 상태
  const [vSnap, setVSnap] = useState<VideoSnapshot>(DEFAULT_VIDEO);
  const [pSnap, setPSnap] = useState<PrintSnapshot>(DEFAULT_PRINT);
  const [cSnap, setCSnap] = useState<CatalogSnapshot>(DEFAULT_CATALOG);

  // Auto-Save 관련 ref
  const dirtyRef    = useRef(false);
  const latestSnap  = useRef<VideoSnapshot | PrintSnapshot | CatalogSnapshot>(DEFAULT_VIDEO);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const orderRef    = useRef<MediaOrder | null>(null);

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current || !orderRef.current || orderRef.current.is_paid) return;
    dirtyRef.current = false;
    setSaveStatus('saving');
    try {
      let snap = latestSnap.current;
      // 도록: 아직 로컬 미리보기(blob URL) 상태인 작품은 저장 대상에서 제외
      // (업로드 완료 후 서버 URL로 교체되면 다음 auto-save 때 자동으로 포함됨)
      if (orderRef.current.order_type === 'catalog' || orderRef.current.order_type === 'magazine') {
        const c = snap as CatalogSnapshot;
        snap = { ...c, artworks: c.artworks.filter(a => !a.imageUrl.startsWith('blob:')) };
      }
      const res = await fetch('/api/admin/super-editor', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderId,
          snapshot: snap,
          title:    (snap as { title?: string }).title || orderRef.current.title,
        }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      dirtyRef.current = true;
      setSaveStatus('error');
    }
  }, [orderId]);

  function handlePanelTab(tab: PanelTab) {
    setPanelTab(tab);
  }

  // 원장(ledger)이 유일한 진실 원천 — 이 effect 하나가 두 가지를 함께 담당한다:
  //  1) 이미 연결된 작품 카드의 미리보기/업로드상태를 원장 최신값으로 동기화(낙관적 표시 유지)
  //  2) 이 세션에서 새로 들어온(마운트 이전엔 없던) 이미지 파일을 작품으로 자동추가
  // 여러 곳에서 각자 artwork.uploadStatus를 직접 mutate하던 기존 방식을 없애고, 원장 하나를
  // 구독해서 파생시키는 방식으로 바꿔 "표시가 실제 상태와 어긋나는" 경우를 구조적으로 없앴다.
  useEffect(() => {
    if ((order?.order_type !== 'catalog' && order?.order_type !== 'magazine') || !seenAtMountRef.current) return;
    setCSnap(prev => {
      let changed = false;
      // sourceEntryId(이번 세션 업로드)뿐 아니라 sourceFileId(리팩터 이전 데이터·재조회로 얻은 것)도
      // "이미 연결됨"으로 잡아야 함 — 안 그러면 새로고침마다 같은 파일이 작품으로 중복 추가될 수 있음.
      const linkedIds = new Set(prev.artworks.map(a => a.sourceEntryId).filter(Boolean));
      const linkedFileIds = new Set(prev.artworks.map(a => a.sourceFileId).filter(Boolean));

      let artworks = prev.artworks.map(a => {
        if (!a.sourceEntryId) return a;
        const e = ledgerEntries.find(x => x.id === a.sourceEntryId);
        if (!e) return a;
        const st = getEntryStatus(e);
        const serverRef = findLocation(e, 'serverLight')?.ref;
        const nextUploadStatus: ArtworkEntry['uploadStatus'] = st === 'ready' ? undefined : st === 'error' ? 'error' : 'uploading';
        const nextUrl = resolveDisplayUrl(e) || a.imageUrl;
        const nextSourceFileId = serverRef ?? a.sourceFileId;
        if (a.uploadStatus === nextUploadStatus && a.imageUrl === nextUrl && a.sourceFileId === nextSourceFileId) return a;
        changed = true;
        return { ...a, imageUrl: nextUrl, uploadStatus: nextUploadStatus, sourceFileId: nextSourceFileId };
      });

      const newOnes = ledgerEntries.filter((e) => {
        if (e.kind !== 'image' || seenAtMountRef.current!.has(e.id) || linkedIds.has(e.id)) return false;
        const serverRef = findLocation(e, 'serverLight')?.ref;
        if (serverRef && linkedFileIds.has(serverRef)) return false;
        return true;
      });
      if (newOnes.length > 0) {
        changed = true;
        artworks = [...artworks, ...newOnes.map((e) => ({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          imageUrl: resolveDisplayUrl(e), title: '', year: '', medium: '', size: '', description: '',
          sourceEntryId: e.id, sourceFileId: findLocation(e, 'serverLight')?.ref,
        }))];
      }

      if (!changed) return prev;
      const next = { ...prev, artworks };
      latestSnap.current = next;
      dirtyRef.current   = true;
      return next;
    });
  }, [ledgerEntries, order?.order_type]);

  // 업로드 실패한 작품 카드에서 재시도 — 실제 재시도는 원장에 위임(원본 File은 원장이 들고 있음)
  function handleRetryUpload(artworkId: string) {
    const artwork = cSnap.artworks.find(a => a.id === artworkId);
    if (artwork?.sourceEntryId) useFileLedgerStore.getState().retry(artwork.sourceEntryId);
  }

  function isEntryIncludedInCatalog(entry: FileEntry): boolean {
    const serverRef = findLocation(entry, 'serverLight')?.ref;
    return cSnap.artworks.some(a => a.sourceEntryId === entry.id || (!!serverRef && a.sourceFileId === serverRef));
  }

  function handleToggleCatalogInclude(entry: FileEntry) {
    const serverRef = findLocation(entry, 'serverLight')?.ref;
    const match = cSnap.artworks.find(a => a.sourceEntryId === entry.id || (!!serverRef && a.sourceFileId === serverRef));
    if (match) {
      handleDeleteArtwork(match.id);
    } else {
      const newArtwork: ArtworkEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        imageUrl: resolveDisplayUrl(entry), title: '', year: '', medium: '', size: '', description: '',
        sourceEntryId: entry.id, sourceFileId: serverRef,
      };
      updateC({ artworks: [...cSnap.artworks, newArtwork] });
    }
  }

  async function fetchQr() {
    setQrLoading(true);
    setMobileNote('');
    try {
      const res = await fetch('/api/admin/super-editor/mobile-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // siteId가 있을 때만 실어 보낸다 — 서버가 소유 검증 후 토큰에 각인 → 모바일 업로드 격리 저장.
        // 없으면 orderId만 보냄 → 서버가 siteId 없는 토큰 발급 → old 저장(하위호환).
        body:    JSON.stringify(siteId ? { orderId, siteId } : { orderId }),
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
    if (!showQr) { setShowQr(true); if (!qrDataUrl) fetchQr(); }
    else { setShowQr(false); }
  }

  // SSE — 스마트폰 업로드 실시간 수신
  useEffect(() => {
    const es = new EventSource(`/api/admin/super-editor/sse/${orderId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as {
          type: string; url?: string; fileId?: string; fileType?: string; filename?: string;
        };
        if (data.type !== 'file_uploaded' || !data.url) return;

        const isVideo = data.fileType === 'video';

        // 파일 관리자 탭(원장)에 반영 — 다른 기기에서 올린 파일이라 원장이 직접 만든 게 아니므로
        // 서버에서 새로 조회해서 채운다. 도록의 "자동추가"는 이 refresh가 만드는 새 원장 엔트리를
        // 위 catalog effect가 감지해서 처리하므로 여기서 따로 artwork를 만들 필요가 없다.
        void useFileLedgerStore.getState().refreshFromServer(orderId);

        if (!isVideo && orderRef.current?.order_type !== 'catalog' && orderRef.current?.order_type !== 'magazine') {
          // 영상·인쇄: 모바일에서 온 이미지는 기존과 동일하게 캔버스에 바로 삽입
          const url = data.url;
          const newBlock: CanvasBlock = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            type: 'image', content: url,
          };
          if (orderRef.current?.order_type === 'video') {
            setVSnap(prev => {
              const next = { ...prev, canvas: { blocks: [...prev.canvas.blocks, newBlock] } };
              latestSnap.current = next;
              dirtyRef.current   = true;
              return next;
            });
          } else {
            setPSnap(prev => {
              const next = { ...prev, canvas: { blocks: [...prev.canvas.blocks, newBlock] } };
              latestSnap.current = next;
              dirtyRef.current   = true;
              return next;
            });
          }
          setSaveStatus('saving');
          setPanelTab('preview');
        }

        const note = isVideo
          ? '📹 동영상이 파일 관리자에 추가됐습니다'
          : (orderRef.current?.order_type === 'catalog' || orderRef.current?.order_type === 'magazine')
          ? '📱 작품이 도록에 추가됐습니다'
          : '📱 이미지가 캔버스에 삽입됐습니다';
        setMobileNote(note);
        setTimeout(() => setMobileNote(''), 4000);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [orderId]);

  // 3초 Auto-Save
  useEffect(() => {
    intervalRef.current = setInterval(() => { saveNow(); }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [saveNow]);

  // 파일 원장 하이드레이션 — 이 주문(도록/영상/인쇄) 소속 파일만 불러온다.
  // 원장은 orderId 키잉이라 스코프 전환/리셋이 없다 — 다른 주문 엔트리가 메모리에 남아 있어도
  // 읽는 쪽(useOrderedFileEntries(orderId))이 걸러 보므로 이전 주문 파일이 화면에 섞이지 않는다.
  // seenAtMountRef는 하이드레이션 완료 직후의 id 집합을 기준선으로 남겨서, 이후 "이 세션에서 새로
  // 들어온 파일"만 도록에 자동추가되도록(이미 저장돼 있던 작품이 중복으로 다시 추가되는 것 방지)한다.
  useEffect(() => {
    seenAtMountRef.current = null;
    const ledger = useFileLedgerStore.getState();
    // 로컬(OPFS) 전용 파일 복원과 서버 파일 조회(QR 업로드 등)를 병행 — 서로 다른 위치를 채울 뿐
    // 서로의 결과를 지우지 않으므로 순서 상관없이 동시에 돌려도 안전하다.
    Promise.all([
      ledger.hydrateFromLocalIndex(orderId),
      ledger.refreshFromServer(orderId),
    ]).then(() => {
      seenAtMountRef.current = new Set(
        getOrderedEntries(useFileLedgerStore.getState().entries, orderId).map((e) => e.id),
      );
    });
  }, [orderId]);

  // 초기 로드
  useEffect(() => {
    fetch(`/api/admin/super-editor?orderId=${orderId}`)
      .then(r => r.json())
      .then(data => {
        const o: MediaOrder = data.order;
        setOrder(o);
        orderRef.current = o;
        // 도록 모드: 처음 진입 시 "작품 이미지" 탭으로
        if ((o.order_type === 'catalog' || o.order_type === 'magazine') && !catalogTabInit.current) {
          catalogTabInit.current = true;
          setPanelTab('files');
        }
        const snap = JSON.parse(o.snapshot || '{}');
        if (o.order_type === 'video') {
          const v = { ...DEFAULT_VIDEO, ...snap };
          setVSnap(v);
          latestSnap.current = v;
        } else if (o.order_type === 'catalog' || o.order_type === 'magazine') {
          const c = { ...DEFAULT_CATALOG, ...snap };
          setCSnap(c);
          latestSnap.current = c;
        } else {
          const p = { ...DEFAULT_PRINT, ...snap };
          setPSnap(p);
          latestSnap.current = p;
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // 렌더링 중 폴링
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
        .catch(() => { /* ignore */ });
    }, 5000);
    return () => clearInterval(id);
  }, [order?.status, orderId]);

  function updateV(patch: Partial<VideoSnapshot>) {
    if (orderRef.current?.is_paid) return;
    const next = { ...vSnap, ...patch };
    setVSnap(next); latestSnap.current = next; dirtyRef.current = true; setSaveStatus('saving');
  }
  function updateP(patch: Partial<PrintSnapshot>) {
    if (orderRef.current?.is_paid) return;
    const next = { ...pSnap, ...patch };
    setPSnap(next); latestSnap.current = next; dirtyRef.current = true; setSaveStatus('saving');
  }
  function updateC(patch: Partial<CatalogSnapshot>) {
    if (orderRef.current?.is_paid) return;
    const next = { ...cSnap, ...patch };
    setCSnap(next); latestSnap.current = next; dirtyRef.current = true; setSaveStatus('saving');
  }

  // ── 캔버스 헬퍼 (영상·인쇄 전용) ─────────────────────────────────────────
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

  // ── 도록 헬퍼 ──────────────────────────────────────────────────────────────
  function handleInsertImage(url: string) {
    if (order?.order_type === 'catalog' || order?.order_type === 'magazine') {
      const newArtwork: ArtworkEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        imageUrl: url, title: '', year: '', medium: '', size: '', description: '',
      };
      updateC({ artworks: [...cSnap.artworks, newArtwork] });
      // 도록: 파일 탭 유지 (여러 작품 연속 추가 가능)
    } else {
      addCanvasBlock({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), type: 'image', content: url });
      setPanelTab('preview');
    }
  }

  function handleMoveArtwork(id: string, dir: 'up' | 'down') {
    if (orderRef.current?.is_paid) return;
    const arr = [...cSnap.artworks];
    const idx = arr.findIndex(a => a.id === id);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === arr.length - 1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    updateC({ artworks: arr });
  }

  // 작품 목록에서 빼는 것 — 원본 파일 자체를 라이브러리에서 지우는 게 아님(그건 파일 관리자의 삭제).
  // blob URL 정리는 더 이상 여기서 하지 않는다 — 그 책임은 원장(ledger)이 진다(entry가 지워지거나
  // 서버로 확정될 때 원장이 알아서 revoke).
  function handleDeleteArtwork(id: string) {
    if (orderRef.current?.is_paid) return;
    updateC({ artworks: cSnap.artworks.filter(a => a.id !== id) });
  }
  // ──────────────────────────────────────────────────────────────────────────

  async function handleManualSave() { dirtyRef.current = true; await saveNow(); }

  async function handlePay() {
    if (!order || paying) return;
    setPaying(true); setPayError('');
    try {
      const initRes = await fetch('/api/admin/super-editor-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!initRes.ok) { const d = await initRes.json(); setPayError(d.error ?? '결제 시작 실패'); return; }
      const { paymentOrderId, amount } = await initRes.json();
      dirtyRef.current = true; await saveNow();
      router.push(`/admin/super-editor-payment?orderId=${orderId}&paymentOrderId=${paymentOrderId}&amount=${amount}`);
    } catch { setPayError('결제 시작 중 오류가 발생했습니다.'); }
    finally { setPaying(false); }
  }

  // 테스트 PDF 생성 (결제 없이) — 서버 왕복 없이 브라우저에서 바로 생성 후 즉시 다운로드.
  // order.status는 건드리지 않는다(휘발성 미리보기라 서버에 보관하지 않음 — 계속 'editing'에 머무름).
  async function handleTestRender() {
    if (!order || cSnap.artworks.length === 0) return;
    dirtyRef.current = true;
    await saveNow();
    setTestRenderState('generating');
    try {
      const entries = useFileLedgerStore.getState().entries;
      const pdfBytes = await buildCatalogPdf(cSnap, entries);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.title || '도록'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setTestRenderState('idle');
    } catch (e) {
      console.error('[handleTestRender]', e);
      setTestRenderState('error');
    }
  }

  // 편집 모드 복귀
  async function handleResetToEditing() {
    if (!order) return;
    setPdfResetLoading(true);
    const res = await fetch('/api/admin/super-editor/catalog-test-render', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reset: true }),
    });
    if (res.ok) setOrder(prev => prev ? { ...prev, status: 'editing', output_uuid: null } : prev);
    setPdfResetLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={28} className="animate-spin text-stone-300" /></div>;
  }
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
        <AlertCircle size={36} />
        <p className="text-sm">주문을 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/admin/super-editor')} className="text-violet-600 font-bold text-sm hover:underline">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isLocked  = order.is_paid === 1;
  // 잡지(magazine) leaf는 도록(catalog)과 완전히 동일한 편집기 엔진을 공유한다 —
  // 폴더 트리(super_editor_folders)는 이 편집기 레벨에서는 아예 존재를 모르고,
  // order_type만으로 도록과 동일하게 취급된다.
  const isCatalog = order.order_type === 'catalog' || order.order_type === 'magazine';

  // 아이콘·색상 테마
  const typeTheme = {
    video:    { icon: <Film size={14} className="text-violet-600" />,  bg: 'bg-violet-100', ring: 'focus:ring-violet-300' },
    print:    { icon: <Printer size={14} className="text-indigo-600" />, bg: 'bg-indigo-100', ring: 'focus:ring-indigo-300' },
    catalog:  { icon: <BookOpen size={14} className="text-amber-700" />,  bg: 'bg-amber-100',   ring: 'focus:ring-amber-300'   },
    magazine: { icon: <BookOpen size={14} className="text-amber-700" />,  bg: 'bg-amber-100',   ring: 'focus:ring-amber-300'   },
  }[order.order_type];

  return (
    <FullscreenDropZone
      orderId={orderId}
      active={!isLocked}
      onDropped={() => setPanelTab('files')}
    >
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">

      {/* ── 모바일 패널 전환 탭 (lg 이상에서는 숨김) ──────────────── */}
      <div className="lg:hidden flex shrink-0 border-b border-stone-200 bg-white">
        <button
          onClick={() => setMobilePanelView('right')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors',
            mobilePanelView === 'right'
              ? isCatalog ? 'border-amber-500 text-amber-700' : 'border-violet-500 text-violet-700'
              : 'border-transparent text-stone-400',
          )}
        >
          {isCatalog ? '① 이미지 · ③ 미리보기' : '파일 / 미리보기'}
        </button>
        <button
          onClick={() => setMobilePanelView('edit')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors',
            mobilePanelView === 'edit'
              ? isCatalog ? 'border-amber-500 text-amber-700' : 'border-violet-500 text-violet-700'
              : 'border-transparent text-stone-400',
          )}
        >
          {isCatalog ? '② 작품 정보 입력' : '편집 설정'}
        </button>
      </div>

      {/* ── 좌측 편집 패널 ──────────────────────────────────────── */}
      <aside className={clsx(
        'w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 bg-white flex-col overflow-hidden',
        mobilePanelView === 'edit' ? 'flex' : 'hidden lg:flex',
      )}>

        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 shrink-0">
          <button onClick={() => router.push('/admin/super-editor')}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', typeTheme.bg)}>
            {typeTheme.icon}
          </div>
          <span className="font-bold text-stone-800 text-sm flex-1 truncate">{order.title || '제목 없음'}</span>

          <span className="text-xs shrink-0">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-stone-400"><Loader2 size={11} className="animate-spin" /> 저장 중</span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle size={11} /> 저장됨</span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} /> 오류</span>
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
            : (order.order_type === 'catalog' || order.order_type === 'magazine')
            ? <CatalogForm
                snap={cSnap}
                onChange={updateC}
                locked={isLocked}
                onMoveArtwork={handleMoveArtwork}
                onDeleteArtwork={handleDeleteArtwork}
                onRetryUpload={handleRetryUpload}
              />
            : <PrintForm snap={pSnap} onChange={updateP} locked={isLocked} />}
        </div>

        {/* 하단 — 결제 / 테스트 PDF */}
        <div className="border-t border-stone-100 px-4 py-3 shrink-0 flex flex-col gap-2">

          {/* ── 도록: 테스트 PDF 생성 (결제 없이) ── */}
          {isCatalog && !isLocked && (
            <>
              {order.status === 'editing' && testRenderState !== 'generating' && (
                <>
                  <button
                    onClick={handleTestRender}
                    disabled={cSnap.artworks.length === 0}
                    className={clsx(
                      'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors',
                      cSnap.artworks.length > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed',
                    )}
                  >
                    <BookOpen size={15} />
                    {cSnap.artworks.length === 0 ? '작품을 추가해야 PDF를 만들 수 있어요' : '도록 PDF 만들기 (테스트)'}
                  </button>
                  {testRenderState === 'error' && (
                    <p className="text-xs text-red-500 text-center mt-1">PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
                  )}
                </>
              )}

              {order.status === 'editing' && testRenderState === 'generating' && (
                <div className="flex flex-col items-center gap-2 py-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-amber-600 animate-spin" />
                    <span className="text-sm text-amber-700 font-medium">PDF 생성 중...</span>
                  </div>
                  <p className="text-[11px] text-amber-600">완료되면 바로 다운로드됩니다(브라우저에서 생성 중 — 서버 대기 아님)</p>
                </div>
              )}

              {(order.status === 'queued' || order.status === 'processing') && (
                <div className="flex flex-col items-center gap-2 py-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-amber-600 animate-spin" />
                    <span className="text-sm text-amber-700 font-medium">
                      {order.status === 'queued' ? 'PDF 생성 대기 중...' : 'PDF 생성 중...'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-600">우측 탭에서 완료 후 다운로드됩니다</p>
                </div>
              )}

              {order.status === 'done' && order.output_uuid && (
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/admin/render-output/${order.output_uuid}`}
                    download
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                  >
                    <Download size={15} />
                    도록 PDF 다운로드
                  </a>
                  <button
                    onClick={handleResetToEditing}
                    disabled={pdfResetLoading}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-stone-200 flex items-center justify-center gap-1.5"
                  >
                    {pdfResetLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                    다시 편집하기
                  </button>
                </div>
              )}

              {order.status === 'failed' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 py-2 bg-red-50 rounded-xl border border-red-200">
                    <AlertCircle size={14} className="text-red-400" />
                    <span className="text-sm text-red-600 font-medium">PDF 생성 실패</span>
                  </div>
                  <button
                    onClick={handleResetToEditing}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 border border-stone-200 transition-colors"
                  >
                    다시 시도하기
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── 도록 잠금(결제 완료) 상태 ── */}
          {isCatalog && isLocked && (
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

          {/* ── 영상·인쇄: 기존 결제 버튼 ── */}
          {!isCatalog && (
            <>
              {payError && <p className="text-xs text-red-500 text-center">{payError}</p>}
              {!isLocked ? (
                <button onClick={handlePay} disabled={paying}
                  className={clsx(
                    'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors',
                    !paying ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
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
            </>
          )}
        </div>
      </aside>

      {/* ── 우측 패널 ───────────────────────────────────────────── */}
      <div className={clsx(
        'flex-1 flex-col overflow-hidden bg-stone-100',
        mobilePanelView === 'right' ? 'flex' : 'hidden lg:flex',
      )}>

        {/* 탭 헤더 */}
        <div className="flex items-center bg-white border-b border-stone-200 shrink-0">
          <button
            onClick={() => handlePanelTab('preview')}
            className={clsx(
              'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              panelTab === 'preview'
                ? isCatalog ? 'border-amber-500 text-amber-700' : 'border-violet-500 text-violet-700'
                : 'border-transparent text-stone-400 hover:text-stone-600',
            )}
          >
            {isCatalog ? '③ 도록 미리보기' : '미리보기'}
          </button>
          <button
            onClick={() => handlePanelTab('files')}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
              panelTab === 'files'
                ? isCatalog ? 'border-amber-500 text-amber-700' : 'border-violet-500 text-violet-700'
                : 'border-transparent text-stone-400 hover:text-stone-600',
            )}
          >
            <FolderOpen size={12} />
            {isCatalog ? '① 작품 이미지' : '파일 관리자'}
            {ledgerEntries.length > 0 && (
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full', isCatalog ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-600')}>{ledgerEntries.length}</span>
            )}
          </button>

          {/* 우측 액션 버튼 */}
          {panelTab === 'preview' && !isLocked && !isCatalog && (
            <div className="ml-auto flex items-center gap-2 px-3">
              <button
                onClick={handleAddText}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-700 transition-colors"
              >
                <Type size={11} />텍스트 추가
              </button>
            </div>
          )}
          {panelTab === 'files' && !isCatalog && (
            <div className="ml-auto flex items-center gap-2 px-3">
              <a href="/admin/super-editor/files" target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:bg-stone-100 transition-colors">
                <ExternalLink size={11} />전체 관리
              </a>
            </div>
          )}
        </div>

        {/* ── 미리보기 탭 ── */}
        {panelTab === 'preview' && order.status === 'done' && order.output_uuid ? (
          // 완료 — 결과물 다운로드
          order.order_type === 'video' ? (
            <div className="flex-1 flex flex-col bg-stone-900 overflow-hidden">
              <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
                <video controls className="w-full rounded-xl shadow-lg" style={{ maxHeight: '100%' }}
                  src={`/api/admin/render-output/${order.output_uuid}`} />
              </div>
              <div className="shrink-0 flex justify-center pb-5">
                <a href={`/api/admin/render-output/${order.output_uuid}`} download
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <Download size={14} />다운로드
                </a>
              </div>
            </div>
          ) : (
            // PDF 결과물 (도록·인쇄)
            <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-stone-50">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <BookOpen size={32} className="text-amber-700" />
              </div>
              <div className="text-center">
                <p className="font-bold text-stone-800 text-base">PDF 생성 완료</p>
                <p className="text-sm text-stone-400 mt-1">도록 PDF가 준비됐습니다.</p>
              </div>
              <a
                href={`/api/admin/render-output/${order.output_uuid}`}
                download
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg"
              >
                <Download size={15} />
                도록 PDF 다운로드
              </a>
              <a
                href={`/api/admin/render-output/${order.output_uuid}`}
                target="_blank"
                className="text-xs text-stone-400 hover:text-amber-700 transition-colors"
              >
                브라우저에서 미리보기 →
              </a>
            </div>
          )
        ) : panelTab === 'preview' ? (
          isCatalog ? (
            cSnap.artworks.length > 0 ? (
              <CatalogFlipbook
                artworks={cSnap.artworks}
                exhibitionTitle={cSnap.exhibition_title}
                artistName={cSnap.artist_name}
              />
            ) : (
              <CatalogCanvas artworks={[]} locked={isLocked} />
            )
          ) : (
            <EditorCanvas
              blocks={getCanvas().blocks}
              orderType={order.order_type as 'video' | 'print'}
              locked={isLocked}
              onDelete={deleteCanvasBlock}
              onUpdateText={updateCanvasText}
            />
          )
        ) : null}

        {/* ── 파일 관리자 탭 ── */}
        {panelTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* QR 무선 전송 */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <button
                onClick={handleToggleQr}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-stone-50 transition-colors text-left"
              >
                <Smartphone size={14} className={clsx('shrink-0', isCatalog ? 'text-amber-600' : 'text-violet-500')} />
                <span className="text-sm font-semibold text-stone-700 flex-1">
                  {isCatalog ? '스마트폰으로 작품 촬영 전송' : '스마트폰으로 사진 전송'}
                </span>
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
                        <span className="text-stone-400">
                          {isCatalog
                            ? '유효시간 15분 · 촬영 즉시 도록에 작품으로 추가됩니다'
                            : '유효시간 15분 · 업로드 즉시 캔버스에 삽입됩니다'}
                        </span>
                      </p>
                      <button onClick={fetchQr} disabled={qrLoading}
                        className={clsx('flex items-center gap-1.5 text-xs font-semibold', isCatalog ? 'text-amber-600 hover:text-amber-800' : 'text-violet-600 hover:text-violet-800')}>
                        <RefreshCw size={11} />QR 새로고침
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

            {/* 파일 관리자 — 썸네일/목록, 상태 표시, 이름변경·삭제·정렬, 중복판정 알림 전부
                이 컴포넌트 하나가 원장(useFileLedgerStore)만 보고 처리한다 */}
            <FileManagerPanel
              orderId={orderId}
              accent={isCatalog ? 'amber' : 'violet'}
              accept={isCatalog ? 'image/*' : 'image/*,video/*,audio/*'}
              locked={isLocked}
              isIncluded={isCatalog ? isEntryIncludedInCatalog : undefined}
              includedLabel="포함됨"
              onToggleInclude={isCatalog ? handleToggleCatalogInclude : undefined}
              onInsert={!isCatalog ? (entry) => handleInsertImage(resolveDisplayUrl(entry)) : undefined}
              insertLabel="삽입"
              emptyTitle={isCatalog ? '① 여기에 작품 이미지를 올려주세요' : '클릭해서 소재를 업로드하세요'}
              emptyHint={isCatalog ? '클릭하거나 이미지 파일을 드래그해서 올리세요 · 또는 위 QR로 스마트폰 전송' : '이미지 · 영상 · 오디오'}
            />
          </div>
        )}
      </div>
    </div>
    </FullscreenDropZone>
  );
}

// ── 캔버스 에디터 (영상·인쇄 전용) ──────────────────────────────────────────
function EditorCanvas({
  blocks, orderType, locked, onDelete, onUpdateText,
}: {
  blocks:       CanvasBlock[];
  orderType:    'video' | 'print';
  locked:       boolean;
  onDelete:     (id: string) => void;
  onUpdateText: (id: string, content: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const isVideo = orderType === 'video';

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    setSelectedId(null); setEditingId(null);
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
      <div
        onClick={handleCanvasClick}
        className={clsx(
          'w-full rounded-2xl overflow-hidden shadow-xl relative',
          isVideo ? 'bg-stone-900 max-w-2xl' : 'bg-white border border-stone-200 max-w-lg',
        )}
        style={isVideo ? { aspectRatio: '16 / 9' } : { aspectRatio: '1 / 1.414' }}
      >
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {isVideo ? <Film size={40} className="text-stone-600" /> : <Printer size={40} className="text-stone-300" />}
            <p className={clsx('text-sm text-center px-6', isVideo ? 'text-stone-500' : 'text-stone-300')}>
              {locked ? '결제 완료 — 컴파일 처리 중입니다' : '위 [텍스트 추가] 버튼 또는 파일 관리자 [삽입]으로 소재를 추가하세요'}
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
                  selectedId === block.id ? 'ring-2 ring-violet-400' : 'ring-1 ring-transparent hover:ring-stone-300',
                )}
              >
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
                    <textarea autoFocus value={block.content}
                      onChange={(e) => onUpdateText(block.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      placeholder="텍스트를 입력하세요" rows={3}
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
                    <img src={block.content} alt="" className="w-full h-auto object-contain max-h-64" />
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

// ── 도록 캔버스 미리보기 ───────────────────────────────────────────────────
function CatalogCanvas({ artworks, locked }: { artworks: ArtworkEntry[]; locked: boolean }) {
  if (artworks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-stone-400">
        <BookOpen size={40} className="opacity-25" />
        <p className="text-sm">
          {locked ? '결제 완료 — PDF 생성 중입니다' : '파일 탭에서 작품 이미지를 [추가]하세요'}
        </p>
      </div>
    );
  }

  // A4 비율 페이지: 미리보기 너비 300px 기준
  const PAGE_W = 300;
  const PAGE_H = Math.round(PAGE_W * 1.414); // A4 비율
  const MARGIN = Math.round(PAGE_W * 0.085);
  const CAP_H  = Math.round(PAGE_H * 0.10);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-10">
      {artworks.map((artwork, idx) => (
        <div key={artwork.id} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-stone-400 font-semibold tracking-widest uppercase">
            p.{idx + 1}
          </span>
          {/* A4 페이지 */}
          <div
            className="relative bg-white shadow-2xl border border-stone-200"
            style={{ width: PAGE_W, height: PAGE_H }}
          >
            {/* 이미지 영역 */}
            <div
              className="absolute"
              style={{
                top:    MARGIN,
                left:   MARGIN,
                right:  MARGIN,
                bottom: CAP_H + MARGIN * 0.5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artwork.imageUrl}
                alt={artwork.title || `작품 ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 캡션 */}
            <div
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center gap-0.5"
              style={{ height: CAP_H, paddingBottom: MARGIN * 0.6, paddingLeft: MARGIN, paddingRight: MARGIN }}
            >
              {/* 구분선 */}
              <div className="w-full border-t border-stone-200 mb-2" />
              {artwork.title && (
                <p className="text-[10px] font-semibold text-stone-800 text-center leading-tight">
                  {artwork.title}
                </p>
              )}
              {(artwork.year || artwork.medium) && (
                <p className="text-[9px] text-stone-500 text-center leading-tight">
                  {[artwork.year, artwork.medium].filter(Boolean).join(',  ')}
                </p>
              )}
              {artwork.size && (
                <p className="text-[8px] text-stone-400 text-center leading-tight">{artwork.size}</p>
              )}
              {!artwork.title && !artwork.year && !artwork.medium && !artwork.size && !locked && (
                <p className="text-[9px] text-stone-300 italic text-center">좌측 패널에서 작품 정보를 입력하세요</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 총 페이지 안내 */}
      <p className="text-xs text-stone-400 pb-4">
        총 {artworks.length}점 · {artworks.length + 1}페이지 (표지 1 포함)
      </p>
    </div>
  );
}

// ── 영상 편집 폼 ─────────────────────────────────────────────────────────────
function VideoForm({ snap, onChange, locked }: { snap: VideoSnapshot; onChange: (p: Partial<VideoSnapshot>) => void; locked: boolean }) {
  const cls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-stone-50 disabled:text-stone-400';
  return (
    <>
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">기본 정보</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">제목</label>
            <input value={snap.title} disabled={locked} onChange={e => onChange({ title: e.target.value })} placeholder="영상 제목" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">설명 / 스크립트</label>
            <textarea value={snap.description} disabled={locked} onChange={e => onChange({ description: e.target.value })} placeholder="영상에 들어갈 내용" rows={4} className={cls + ' resize-none'} />
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">영상 설정</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">목표 길이 (초)</label>
            <input type="number" min={10} max={300} value={snap.duration_sec} disabled={locked} onChange={e => onChange({ duration_sec: Number(e.target.value) || 30 })} className={cls} />
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
        <textarea value={snap.extra_notes} disabled={locked} onChange={e => onChange({ extra_notes: e.target.value })} placeholder="특별 요청사항" rows={3} className={cls + ' resize-none'} />
      </section>
    </>
  );
}

// ── 인쇄 편집 폼 ─────────────────────────────────────────────────────────────
function PrintForm({ snap, onChange, locked }: { snap: PrintSnapshot; onChange: (p: Partial<PrintSnapshot>) => void; locked: boolean }) {
  const cls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-stone-50 disabled:text-stone-400';
  return (
    <>
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">기본 정보</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">제목</label>
            <input value={snap.title} disabled={locked} onChange={e => onChange({ title: e.target.value })} placeholder="인쇄물 제목" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">헤드라인</label>
            <input value={snap.headline} disabled={locked} onChange={e => onChange({ headline: e.target.value })} placeholder="메인 문구" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">본문</label>
            <textarea value={snap.body_text} disabled={locked} onChange={e => onChange({ body_text: e.target.value })} placeholder="본문 텍스트" rows={4} className={cls + ' resize-none'} />
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
            <input type="number" min={1} max={10000} value={snap.quantity} disabled={locked} onChange={e => onChange({ quantity: Number(e.target.value) || 100 })} className={cls} />
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
        <textarea value={snap.extra_notes} disabled={locked} onChange={e => onChange({ extra_notes: e.target.value })} placeholder="특별 요청사항" rows={3} className={cls + ' resize-none'} />
      </section>
    </>
  );
}

// ── 도록 편집 폼 ─────────────────────────────────────────────────────────────
function CatalogForm({ snap, onChange, locked, onMoveArtwork, onDeleteArtwork, onRetryUpload }: {
  snap:            CatalogSnapshot;
  onChange:        (p: Partial<CatalogSnapshot>) => void;
  locked:          boolean;
  onMoveArtwork:   (id: string, dir: 'up' | 'down') => void;
  onDeleteArtwork: (id: string) => void;
  onRetryUpload:   (id: string) => void;
}) {
  const cls    = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-stone-50 disabled:text-stone-400';
  const clsS   = 'w-full border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:bg-stone-50 disabled:text-stone-400';
  const [guideOpen, setGuideOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [mockupLoading, setMockupLoading] = useState<Record<string, boolean>>({});
  const [mockupUrls, setMockupUrls] = useState<Record<string, string>>({});
  const [mockupErrors, setMockupErrors] = useState<Record<string, string>>({});
  const [mockupImgLoaded, setMockupImgLoaded] = useState<Record<string, boolean>>({});
  const [mockupModal, setMockupModal] = useState<{ url: string; title: string } | null>(null);
  const pendingModalId = useRef<string | null>(null);

  function updateArtwork(id: string, patch: Partial<ArtworkEntry>) {
    if (locked) return;
    onChange({ artworks: snap.artworks.map(a => a.id === id ? { ...a, ...patch } : a) });
  }

  async function generateDescription(artwork: ArtworkEntry) {
    if (!artwork.title) return;
    setAiLoading(prev => ({ ...prev, [artwork.id]: true }));
    try {
      const res = await fetch('/api/admin/super-editor/catalog-ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:      artwork.title,
          year:       artwork.year,
          medium:     artwork.medium,
          size:       artwork.size,
          artistName: snap.artist_name,
        }),
      });
      const data = await res.json();
      if (data.description) {
        updateArtwork(artwork.id, { description: data.description });
      }
    } finally {
      setAiLoading(prev => ({ ...prev, [artwork.id]: false }));
    }
  }

  async function generateMockup(artwork: ArtworkEntry) {
    if (!artwork.title) return;
    setMockupLoading(prev => ({ ...prev, [artwork.id]: true }));
    setMockupErrors(prev => ({ ...prev, [artwork.id]: '' }));
    setMockupImgLoaded(prev => ({ ...prev, [artwork.id]: false }));
    pendingModalId.current = artwork.id;
    try {
      const res = await fetch('/api/admin/catalog-mockup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:      artwork.title,
          year:       artwork.year,
          medium:     artwork.medium,
          size:       artwork.size,
          artistName: snap.artist_name,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setMockupUrls(prev => ({ ...prev, [artwork.id]: data.imageUrl }));
      } else {
        setMockupErrors(prev => ({ ...prev, [artwork.id]: data.error ?? '생성 실패' }));
      }
    } catch {
      setMockupErrors(prev => ({ ...prev, [artwork.id]: '네트워크 오류' }));
    } finally {
      setMockupLoading(prev => ({ ...prev, [artwork.id]: false }));
    }
  }

  return (
    <>
      {/* 처음 사용 안내 (접기 가능) */}
      {!locked && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setGuideOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
          >
            <span className="text-xs font-semibold text-amber-700">📋 처음 쓰시나요? 사용법 안내</span>
            <span className="text-xs text-amber-400">{guideOpen ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
          {guideOpen && (
            <div className="px-3 pb-3 flex flex-col gap-1.5 text-[11px] text-amber-900 leading-relaxed border-t border-amber-100 pt-2.5">
              <p>① 오른쪽 <strong>[① 작품 이미지]</strong> 탭에서 이미지를 업로드하거나, QR로 스마트폰에서 바로 전송하세요.</p>
              <p>② 각 작품 카드에 <strong>제목·재료·크기·연도</strong>를 입력하세요. <strong>✦ AI 자동 생성</strong>으로 작품 설명도 만들 수 있어요.</p>
              <p>③ 오른쪽 <strong>[③ 도록 미리보기]</strong> 탭에서 A4 레이아웃을 확인하고, ▲ ▼로 순서를 조정하세요.</p>
              <p>④ 완성되면 하단 <strong>[도록 PDF 만들기]</strong>를 눌러 PDF를 즉시 확인하세요.</p>
            </div>
          )}
        </div>
      )}

      {/* 도록 기본 정보 */}
      <section>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">도록 정보</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">전시명</label>
            <input value={snap.exhibition_title} disabled={locked}
              onChange={e => onChange({ exhibition_title: e.target.value })}
              placeholder="예: 2024 봄 기획전" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">작가명</label>
            <input value={snap.artist_name} disabled={locked}
              onChange={e => onChange({ artist_name: e.target.value })}
              placeholder="예: 홍길동" className={cls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">판형</label>
            <select value={snap.paper_size} disabled={locked}
              onChange={e => onChange({ paper_size: e.target.value as 'A4' | 'A5' })}
              className={cls}>
              <option value="A4">A4 (210×297mm)</option>
              <option value="A5">A5 (148×210mm)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 작품 목록 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            ② 작품 목록
          </h3>
          <span className="text-[11px] text-stone-400 font-semibold">{snap.artworks.length}점</span>
        </div>

        {snap.artworks.length > 0 && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-3">
            입력 완료 후 오른쪽 <strong>③ 도록 미리보기</strong> 탭에서 레이아웃을 확인하세요.
          </p>
        )}

        {snap.artworks.length === 0 ? (
          <div className="border border-dashed border-stone-200 rounded-xl py-6 flex flex-col items-center gap-2 text-stone-400">
            <Image size={20} className="opacity-40" />
            <p className="text-xs text-center">
              오른쪽 [작품 이미지] 탭에서<br />이미지를 업로드하고 [추가]하세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {snap.artworks.map((artwork, idx) => (
              <div key={artwork.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">

                {/* 썸네일 + 순서 + 삭제 */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-200 shrink-0 relative">
                    <CachedImg id={artwork.imageUrl} src={artwork.imageUrl} alt="" className="w-full h-full object-cover" />
                    {artwork.uploadStatus === 'uploading' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Loader2 size={12} className="text-white animate-spin" />
                      </div>
                    )}
                    {artwork.uploadStatus === 'error' && (
                      <button
                        onClick={() => onRetryUpload(artwork.id)}
                        title="업로드 실패 — 클릭해서 재시도"
                        className="absolute inset-0 bg-red-500/70 flex items-center justify-center"
                      >
                        <RefreshCw size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-stone-500 flex-1">작품 {idx + 1}</span>
                  {!locked && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onMoveArtwork(artwork.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-stone-200 text-stone-400 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => onMoveArtwork(artwork.id, 'down')}
                        disabled={idx === snap.artworks.length - 1}
                        className="p-1 rounded hover:bg-stone-200 text-stone-400 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteArtwork(artwork.id)}
                        className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 작품명 */}
                <input
                  value={artwork.title} disabled={locked}
                  onChange={e => updateArtwork(artwork.id, { title: e.target.value })}
                  placeholder="작품명 (입력하면 ✦ AI가 설명을 써드려요)" className={clsS} />

                {/* 연도 / 크기 */}
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    value={artwork.year} disabled={locked}
                    onChange={e => updateArtwork(artwork.id, { year: e.target.value })}
                    placeholder="제작연도 (예: 2024)" className={clsS} />
                  <input
                    value={artwork.size} disabled={locked}
                    onChange={e => updateArtwork(artwork.id, { size: e.target.value })}
                    placeholder="크기 (예: 72.7×60.6cm)" className={clsS} />
                </div>

                {/* 재료 */}
                <input
                  value={artwork.medium} disabled={locked}
                  onChange={e => updateArtwork(artwork.id, { medium: e.target.value })}
                  placeholder="재료 (예: oil on canvas)" className={clsS} />

                {/* 작품 설명 + AI 생성 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-medium">작품 설명 (선택)</span>
                    {!locked && (
                      <button
                        onClick={() => generateDescription(artwork)}
                        disabled={!artwork.title || aiLoading[artwork.id]}
                        className="flex items-center gap-1 px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-[10px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {aiLoading[artwork.id]
                          ? <><Loader2 size={10} className="animate-spin" />생성 중</>
                          : <>✦ AI 자동 생성</>}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={artwork.description ?? ''} disabled={locked}
                    onChange={e => updateArtwork(artwork.id, { description: e.target.value })}
                    placeholder="작품 설명을 직접 입력하거나 AI 자동 생성을 사용하세요."
                    rows={3}
                    className={clsS + ' resize-none'} />
                </div>

                {/* 실사 목업 미리보기 */}
                {!locked && (
                  <div className="space-y-1.5 pt-1.5 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 font-medium">실사 목업 미리보기</span>
                      <button
                        onClick={() => generateMockup(artwork)}
                        disabled={!artwork.title || mockupLoading[artwork.id]}
                        className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {mockupLoading[artwork.id]
                          ? <><Loader2 size={10} className="animate-spin" />생성 중</>
                          : <>✦ 목업 생성</>}
                      </button>
                    </div>
                    {mockupUrls[artwork.id] && (
                      <div
                        className="relative rounded-lg overflow-hidden bg-stone-100 cursor-pointer"
                        style={{ minHeight: 80 }}
                        onClick={() => mockupImgLoaded[artwork.id] && setMockupModal({ url: mockupUrls[artwork.id], title: artwork.title })}
                        title="클릭하면 크게 볼 수 있어요"
                      >
                        {!mockupImgLoaded[artwork.id] && (
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-stone-400">
                            <Loader2 size={13} className="animate-spin" />
                            <span className="text-[10px]">이미지 생성 중…</span>
                          </div>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mockupUrls[artwork.id]}
                          alt="실사 목업"
                          className="w-full h-auto rounded-lg"
                          style={{ opacity: mockupImgLoaded[artwork.id] ? 1 : 0, transition: 'opacity 0.3s' }}
                          onLoad={(e) => {
                            setMockupImgLoaded(prev => ({ ...prev, [artwork.id]: true }));
                            if (pendingModalId.current === artwork.id) {
                              pendingModalId.current = null;
                              setMockupModal({ url: (e.target as HTMLImageElement).src, title: artwork.title });
                            }
                          }}
                          onError={() => {
                            pendingModalId.current = null;
                            setMockupErrors(prev => ({ ...prev, [artwork.id]: '이미지 로드 실패 — 다시 시도하세요' }));
                            setMockupUrls(prev => { const n = { ...prev }; delete n[artwork.id]; return n; });
                          }}
                        />
                        {mockupImgLoaded[artwork.id] && (
                          <div className="absolute bottom-1.5 right-1.5 bg-black/40 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            클릭해서 크게 보기
                          </div>
                        )}
                      </div>
                    )}
                    {mockupErrors[artwork.id] && (
                      <p className="text-[10px] text-red-500">{mockupErrors[artwork.id]}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 실사 목업 전체화면 모달 */}
      {mockupModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
          onClick={() => setMockupModal(null)}
        >
          {/* 헤더 */}
          <div
            className="w-full max-w-3xl flex items-center justify-between mb-3"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="text-white font-bold text-base leading-tight">{mockupModal.title}</p>
              <p className="text-amber-300 text-xs font-semibold tracking-wide mt-0.5">✦ 도록 실사 목업 미리보기</p>
            </div>
            <button
              onClick={() => setMockupModal(null)}
              className="w-9 h-9 bg-white/15 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* 이미지 */}
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mockupModal.url}
              alt="실사 목업 전체보기"
              className="w-full h-auto"
              style={{ maxHeight: '72vh', objectFit: 'contain', background: '#1c1917' }}
            />
          </div>

          <p className="text-white/40 text-xs mt-4">클릭하거나 바깥을 눌러 닫기</p>
        </div>
      )}
    </>
  );
}
