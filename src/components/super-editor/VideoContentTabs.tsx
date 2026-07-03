'use client';

// 영상 콘텐츠 하나를 열었을 때의 메인 화면 — 기본은 장면 목록(SceneListPanel).
// MagazineContentTabs와 대칭 구조: 파일 관리는 z-[120] 두 번째 전체화면 오버레이,
// 열림 여부는 부모(URL ?view=files)가 소유.
//
// 스냅샷의 소유자는 이 컴포넌트다: 로드 시 migrateVideoSnapshot으로 항상 version 2로
// 올리고, 저장 시 toLegacyFields를 병합해 서버 fallback 렌더러(render-video.py)가
// 코드 수정 없이 같은 스냅샷을 읽을 수 있게 한다. 저장은 1.5초 디바운스.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Files, Loader2, X } from 'lucide-react';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { SceneListPanel } from '@/components/super-editor/SceneListPanel';
import { VideoRenderButton } from '@/components/super-editor/VideoRenderButton';
import { useFileLedgerStore, useOrderedFileEntries } from '@/lib/super-editor/ledger/store';
import { resolveDisplayUrl } from '@/lib/super-editor/ledger/selectors';
import type { VideoProjectSnapshot, VideoScene } from '@/lib/super-editor/video/types';
import { migrateVideoSnapshot, toLegacyFields } from '@/lib/super-editor/video/migrate';

interface Props {
  orderId: string;
  title:   string;
  isPaid:  boolean;
  /** 파일 관리 오버레이 열림 여부 — 출처는 부모(URL) */
  filesOpen: boolean;
  onFilesOpenChange: (open: boolean) => void;
  onBack:           () => void;
  onOpenFullEditor: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function VideoContentTabs({
  orderId, title, isPaid, filesOpen, onFilesOpenChange, onBack, onOpenFullEditor,
}: Props) {
  const [project, setProject] = useState<VideoProjectSnapshot | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const entries = useOrderedFileEntries(orderId);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 원장 하이드레이션 — 장면 선택기/썸네일이 파일 화면을 안 거쳐도 원장을 읽을 수 있게(멱등)
  useEffect(() => {
    const ledger = useFileLedgerStore.getState();
    void ledger.hydrateFromLocalIndex(orderId);
    void ledger.refreshFromServer(orderId);
  }, [orderId]);

  // 스냅샷 로드 + version 2 마이그레이션
  useEffect(() => {
    let cancelled = false;
    setProject(null);
    fetch(`/api/admin/super-editor?orderId=${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.order) return;
        let raw: unknown = {};
        try { raw = JSON.parse(data.order.snapshot || '{}'); } catch { /* 빈 프로젝트로 */ }
        setProject(migrateVideoSnapshot(raw, data.order.title || title));
      });
    return () => { cancelled = true; };
  }, [orderId, title]);

  // 저장 — 장면의 이미지 URL 해석(원장 → 서버 URL)은 여기(원장을 아는 쪽)에서 주입
  const persist = useCallback(async (next: VideoProjectSnapshot) => {
    setSaveStatus('saving');
    const resolveUrl = (scene: VideoScene): string | null => {
      if (scene.ledgerRef) {
        const entry = entries.find((e) => e.id === scene.ledgerRef);
        // fallback 렌더러는 서버 파일 URL(파일명)만 이해한다 — 로컬 전용 blob URL은 제외
        if (entry?.filename) return resolveDisplayUrl(entry);
        return null;
      }
      return scene.srcUrl;
    };
    const snapshot = { ...next, ...toLegacyFields(next, resolveUrl), title: next.title };
    const res = await fetch('/api/admin/super-editor', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, snapshot, title: next.title }),
    }).catch(() => null);
    setSaveStatus(res?.ok ? 'saved' : 'error');
    if (res?.ok) setTimeout(() => setSaveStatus('idle'), 2000);
  }, [orderId, entries]);

  function handleScenesChange(scenes: VideoScene[]) {
    if (!project) return;
    const next = { ...project, scenes };
    setProject(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void persist(next); }, 1500);
  }

  // 언마운트 시 대기 중인 저장 타이머 정리(마지막 변경은 이미 state에 반영돼 다음 열람 때 저장됨)
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> 폴더로
          </button>
          <p className="font-bold text-stone-800 text-sm flex-1 truncate">
            {title || '제목 없음'}
            {saveStatus === 'saving' && <span className="ml-2 text-[11px] font-medium text-stone-400">저장 중…</span>}
            {saveStatus === 'saved'  && <span className="ml-2 text-[11px] font-medium text-emerald-600">저장됨</span>}
            {saveStatus === 'error'  && <span className="ml-2 text-[11px] font-medium text-red-500">저장 실패 — 변경 시 재시도</span>}
          </p>
          <button
            onClick={() => onFilesOpenChange(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors shrink-0"
          >
            <Files size={14} /> 파일 관리
          </button>
          <VideoRenderButton orderId={orderId} title={title} project={project} />
          <button
            onClick={onOpenFullEditor}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shrink-0"
          >
            <ExternalLink size={14} /> 전체 편집기에서 열기
          </button>
        </div>

        {project === null ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : (
          <SceneListPanel
            orderId={orderId}
            scenes={project.scenes}
            onChange={handleScenesChange}
            locked={isPaid}
          />
        )}
      </div>

      {/* 파일 관리 — 폴더 팝업과 같은 전체화면 오버레이, 한 겹 위(z-120) */}
      {filesOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-800">파일 관리</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate">{title || '제목 없음'}</p>
              </div>
              <button
                onClick={() => onFilesOpenChange(false)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ContentFileViewer
                orderId={orderId}
                title={title}
                isPaid={isPaid}
                onBack={() => onFilesOpenChange(false)}
                onOpenFullEditor={onOpenFullEditor}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
