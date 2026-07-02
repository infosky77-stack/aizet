'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, Clock, ArrowRight, Download, FolderCheck, FolderOpen } from 'lucide-react';
import { useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { findLocation } from '@/lib/super-editor/ledger/selectors';
import { buildCatalogPdf, type CatalogPdfInput } from '@/lib/super-editor/pdf/buildCatalogPdf';
import {
  isFileSystemAccessSupported, getFolderConnectionStatus, connectRootFolder, reconfirmPermission,
} from '@/lib/super-editor/ledger/locations/userFolderAdapter';
import { localAdapter } from '@/lib/super-editor/ledger/locations/localAdapter';

type Phase = 'confirming' | 'generating' | 'done' | 'queued' | 'error';

interface BackupInfo {
  /** local(OPFS)에는 있지만 아직 사용자 폴더에는 없는 원본 개수 — 재산 손실 위험이 있는 파일 수 */
  pendingCount: number;
}

// 결제 완료된 도록 주문의 PDF를 브라우저에서 직접 생성해 서버에 보관.
// 실패하면 catalog-server-fallback으로 기존 서버(python) 렌더 경로를 태워 절대 멈춰있지 않게 한다.
async function generateCatalogAndStore(mediaOrderId: string): Promise<{ outputUuid: string; backup: BackupInfo } | { fallback: true }> {
  const orderRes = await fetch(`/api/admin/super-editor?orderId=${mediaOrderId}`);
  if (!orderRes.ok) throw new Error('주문 조회 실패');
  const { order } = await orderRes.json();
  const snapshot = JSON.parse(order.snapshot || '{}') as CatalogPdfInput;

  const ledger = useFileLedgerStore.getState();
  ledger.setCurrentOrder(mediaOrderId);
  // Toss 결제창을 다녀오며 브라우저 메모리가 리셋됐으므로, 로컬(OPFS) 전용 원본을 먼저 복원한 뒤
  // 서버 파일(QR 업로드 등)을 병합한다 — 이게 없으면 로컬 전용 원본이 PDF 재료에서 통째로 빠진다.
  await Promise.all([
    ledger.hydrateFromLocalIndex(mediaOrderId),
    ledger.refreshFromServer(),
  ]);
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

  // 원본 백업: 폴더 권한이 이미 'granted' 상태로 남아있다면(Chrome Persistent Permissions 등)
  // 제스처 없이 조용히 마저 백업. 'prompt'/'not-connected'면 여기선 건너뛰고 화면에서 버튼으로 안내
  // (requestPermission/showDirectoryPicker는 반드시 클릭 안에서 호출해야 하므로).
  const folderStatus = await getFolderConnectionStatus();
  if (folderStatus === 'granted') await ledger.backfillFolderBackup();

  const finalEntries = Object.values(useFileLedgerStore.getState().entries).filter((e) => e.orderId === mediaOrderId);
  const pendingCount = finalEntries.filter((e) => {
    const local  = findLocation(e, 'local');
    const folder = findLocation(e, 'userFolder');
    return local?.status === 'present' && folder?.status !== 'present';
  }).length;

  return { outputUuid: data.outputUuid, backup: { pendingCount } };
}

// 미지원 브라우저(Firefox/Safari) 폴백 — 개별 파일을 순차 다운로드. 브라우저가 다중 다운로드를
// 차단/확인 요구할 수 있어 100% 신뢰할 수는 없다는 걸 호출부가 안내 문구로 알려야 한다.
async function downloadPendingOriginals(mediaOrderId: string): Promise<void> {
  const entries = Object.values(useFileLedgerStore.getState().entries).filter((e) => e.orderId === mediaOrderId);
  for (const entry of entries) {
    const local = findLocation(entry, 'local');
    if (local?.status !== 'present') continue;
    const url = await localAdapter.resolveUrl(local.ref);
    if (!url) continue;
    const a = document.createElement('a');
    a.href = url;
    a.download = entry.origName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((r) => setTimeout(r, 400)); // 연속 다운로드 차단 완화용 짧은 간격
  }
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
  const [backupPending, setBackupPending] = useState(0);
  const [backupBusy,    setBackupBusy]    = useState(false);
  const [backupDone,    setBackupDone]    = useState(false);
  const ranOnce = useRef(false);

  async function handleBackupOriginals() {
    setBackupBusy(true);
    try {
      const status = await getFolderConnectionStatus();
      const res = status === 'not-connected' ? await connectRootFolder() : await reconfirmPermission();
      if (res.ok) {
        await useFileLedgerStore.getState().backfillFolderBackup();
        const remain = Object.values(useFileLedgerStore.getState().entries)
          .filter((e) => e.orderId === mediaOrderId)
          .filter((e) => {
            const local  = findLocation(e, 'local');
            const folder = findLocation(e, 'userFolder');
            return local?.status === 'present' && folder?.status !== 'present';
          }).length;
        setBackupPending(remain);
        if (remain === 0) setBackupDone(true);
      }
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleDownloadOriginals() {
    setBackupBusy(true);
    try {
      await downloadPendingOriginals(mediaOrderId);
      setBackupDone(true);
    } finally {
      setBackupBusy(false);
    }
  }

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
            setBackupPending(result.backup.pendingCount);
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

              {/* 원본(초고해상도) 백업 상태 — 재산이므로 안내를 명확히 한다 */}
              {backupPending === 0 || backupDone ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  <FolderCheck size={14} className="shrink-0" />
                  원본이 이 기기와 내 컴퓨터 폴더에 안전하게 보관되어 있습니다.
                </div>
              ) : isFileSystemAccessSupported() ? (
                <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    원본 {backupPending}개가 아직 이 브라우저에만 있습니다. 폴더를 연결해 내 컴퓨터에도 백업해주세요 — 원본은 AIZET 서버에 올라가지 않습니다.
                  </p>
                  <button onClick={handleBackupOriginals} disabled={backupBusy}
                    className="flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-lg text-xs transition-colors">
                    {backupBusy ? <Loader2 size={13} className="animate-spin" /> : <FolderOpen size={13} />}
                    원본 백업 폴더 연결/재확인
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    이 브라우저는 폴더 자동 연결을 지원하지 않습니다(Chrome/Edge 권장). 원본 {backupPending}개를 지금 개별 다운로드해 안전하게 보관해주세요.
                  </p>
                  <button onClick={handleDownloadOriginals} disabled={backupBusy}
                    className="flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-lg text-xs transition-colors">
                    {backupBusy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    원본 {backupPending}개 다운로드
                  </button>
                </div>
              )}
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
