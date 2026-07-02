'use client';

// 파일 관리자 탭 — 표시/조작 전용 컴포넌트. 파일 상태는 전혀 소유하지 않고 전부 원장(useFileLedgerStore)
// 에서 읽는다. 도록/영상/인쇄물처럼 파일을 "무엇에 쓸지"는 order-type마다 다르므로 그 부분만
// isIncluded/onToggleInclude/onInsert 콜백으로 위임받는다 — 이 컴포넌트 자체는 order 개념을 모른다.

import { useEffect, useRef, useState } from 'react';
import {
  Upload, Image as ImageIcon, Film, Music, Trash2, Loader2, RefreshCw, X, Pencil,
  LayoutGrid, List as ListIcon, ChevronUp, ChevronDown, HardDrive, CloudUpload,
} from 'lucide-react';
import { clsx } from 'clsx';
import { CachedImg } from '@/components/ui/CachedImg';
import type { FileEntry } from '@/lib/super-editor/ledger/types';
import { useOrderedFileEntries, useLedgerNotices, useFileLedgerStore } from '@/lib/super-editor/ledger/store';
import { getEntryStatus, getEntryError, resolveDisplayUrl, getPresentLocationKinds } from '@/lib/super-editor/ledger/selectors';
import { ingestFromPicker } from '@/lib/super-editor/ledger/ingest/fromPicker';
import { ingestFromDrop } from '@/lib/super-editor/ledger/ingest/fromDrop';

type Accent = 'violet' | 'amber';
type ViewMode = 'grid' | 'list';

interface FileManagerPanelProps {
  accent:          Accent;
  accept?:         string;
  locked:          boolean;
  isIncluded?:     (entry: FileEntry) => boolean;
  includedLabel?:  string;
  onToggleInclude?: (entry: FileEntry) => void;
  onInsert?:       (entry: FileEntry) => void;
  insertLabel?:    string;
  emptyTitle?:     string;
  emptyHint?:      string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ kind, className }: { kind: FileEntry['kind']; className?: string }) {
  if (kind === 'video') return <Film size={20} className={className} />;
  if (kind === 'audio') return <Music size={20} className={className} />;
  return <ImageIcon size={20} className={className} />;
}

function LocationBadges({ entry }: { entry: FileEntry }) {
  const kinds = getPresentLocationKinds(entry);
  if (kinds.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {kinds.includes('local') && (
        <span title="이 기기에 저장됨" className="text-stone-400"><HardDrive size={10} /></span>
      )}
      {kinds.includes('serverLight') && (
        <span title="서버에 저장됨" className="text-stone-400"><CloudUpload size={10} /></span>
      )}
    </div>
  );
}

export function FileManagerPanel({
  accent, accept = 'image/*,video/*,audio/*', locked,
  isIncluded, includedLabel = '포함됨', onToggleInclude, onInsert, insertLabel = '삽입',
  emptyTitle = '파일이 없습니다', emptyHint = '클릭하거나 파일을 끌어다 놓으세요',
}: FileManagerPanelProps) {
  const entries = useOrderedFileEntries();
  const notices = useLedgerNotices();
  const dismissNotice = useFileLedgerStore((s) => s.dismissNotice);
  const removeEntry   = useFileLedgerStore((s) => s.removeEntry);
  const retry          = useFileLedgerStore((s) => s.retry);
  const renameEntry    = useFileLedgerStore((s) => s.renameEntry);
  const reorderEntries = useFileLedgerStore((s) => s.reorderEntries);

  const [viewMode,   setViewMode]   = useState<ViewMode>('grid');
  const [dragging,   setDragging]   = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accentText = accent === 'amber' ? 'text-amber-700' : 'text-violet-700';
  const accentBg   = accent === 'amber' ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-violet-100 hover:bg-violet-200 text-violet-700';
  const accentBorderHover = accent === 'amber' ? 'hover:border-amber-300' : 'hover:border-violet-300';
  const accentDrag = accent === 'amber' ? 'border-amber-400 bg-amber-50' : 'border-violet-400 bg-violet-50';

  // 알림은 일정 시간 뒤 자동으로 사라짐 — 사용자가 직접 닫을 수도 있음(X 버튼)
  useEffect(() => {
    if (notices.length === 0) return;
    const latest = notices[notices.length - 1];
    const timer = setTimeout(() => dismissNotice(latest.id), 6000);
    return () => clearTimeout(timer);
  }, [notices, dismissNotice]);

  function openPicker() { fileInputRef.current?.click(); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    ingestFromDrop(e.dataTransfer);
  }

  function startRename(entry: FileEntry) {
    setRenamingId(entry.id);
    setRenameDraft(entry.origName);
  }
  function commitRename() {
    if (renamingId) void renameEntry(renamingId, renameDraft);
    setRenamingId(null);
  }

  function moveEntry(id: string, dir: 'up' | 'down') {
    const ids = entries.map((e) => e.id);
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    void reorderEntries(ids);
  }

  return (
    <div className="flex flex-col gap-3">

      {/* 알림 — 중복 제외 / 이름 자동변경 등 */}
      {notices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {notices.slice(-3).map((n) => (
            <div
              key={n.id}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border',
                n.kind === 'duplicate' && 'bg-stone-50 border-stone-200 text-stone-600',
                n.kind === 'renamed'   && 'bg-blue-50 border-blue-200 text-blue-700',
                n.kind === 'error'     && 'bg-red-50 border-red-200 text-red-600',
              )}
            >
              <span className="flex-1">{n.message}</span>
              <button onClick={() => dismissNotice(n.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 툴바 — 업로드 / 보기전환 */}
      {!locked && (
        <div className="flex items-center gap-2">
          <button
            onClick={openPicker}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', accentBg)}
          >
            <Upload size={12} />업로드
          </button>
          <input ref={fileInputRef} type="file" multiple accept={accept} className="hidden"
            onChange={(e) => { ingestFromPicker(e.target.files); e.target.value = ''; }} />
          <div className="ml-auto flex items-center gap-0.5 border border-stone-200 rounded-lg p-0.5 bg-white">
            <button onClick={() => setViewMode('grid')}
              className={clsx('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? clsx('bg-stone-100', accentText) : 'text-stone-400 hover:text-stone-600')}>
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={clsx('p-1.5 rounded-md transition-colors', viewMode === 'list' ? clsx('bg-stone-100', accentText) : 'text-stone-400 hover:text-stone-600')}>
              <ListIcon size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 파일 목록 / 빈 상태 */}
      {entries.length === 0 ? (
        <label
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            'flex flex-col items-center gap-3 py-14 text-stone-400 cursor-pointer border-2 border-dashed rounded-2xl transition-colors bg-white',
            dragging ? accentDrag : clsx('border-stone-200', accentBorderHover),
          )}
        >
          <input type="file" multiple accept={accept} className="hidden"
            onChange={(e) => { ingestFromPicker(e.target.files); e.target.value = ''; }} />
          <Upload size={30} className="opacity-30" />
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="text-xs text-stone-300">{emptyHint}</p>
        </label>
      ) : viewMode === 'grid' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={clsx('grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl p-1 transition-colors', dragging && accentDrag)}
        >
          {entries.map((entry, idx) => {
            const status = getEntryStatus(entry);
            const error  = getEntryError(entry);
            const included = isIncluded?.(entry) ?? false;
            return (
              <div key={entry.id} className={clsx('group bg-white border rounded-xl overflow-hidden transition-colors', 'border-stone-200', accentBorderHover)}>
                <div className="aspect-video bg-stone-100 flex items-center justify-center relative overflow-hidden">
                  {entry.kind === 'image' ? (
                    <CachedImg id={entry.id} src={resolveDisplayUrl(entry)} alt={entry.origName} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon kind={entry.kind} className="text-stone-300" />
                  )}
                  {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Loader2 size={16} className="text-white animate-spin" />
                    </div>
                  )}
                  {status === 'error' && (
                    <button onClick={() => retry(entry.id)} title={error ?? '업로드 실패 — 클릭해서 재시도'}
                      className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                      <RefreshCw size={16} className="text-white" />
                    </button>
                  )}
                  {!locked && status === 'ready' && (
                    <button onClick={() => removeEntry(entry.id)}
                      className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-red-50 hover:text-red-500 text-stone-400 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={11} />
                    </button>
                  )}
                  {!locked && entries.length > 1 && (
                    <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => moveEntry(entry.id, 'up')} disabled={idx === 0}
                        className="p-0.5 bg-white/80 rounded text-stone-500 disabled:opacity-30"><ChevronUp size={11} /></button>
                      <button onClick={() => moveEntry(entry.id, 'down')} disabled={idx === entries.length - 1}
                        className="p-0.5 bg-white/80 rounded text-stone-500 disabled:opacity-30"><ChevronDown size={11} /></button>
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    {renamingId === entry.id ? (
                      <input
                        autoFocus value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
                        className="flex-1 text-[10px] border border-stone-300 rounded px-1 py-0.5 min-w-0"
                      />
                    ) : (
                      <p
                        onClick={() => !locked && startRename(entry)}
                        title={entry.origName}
                        className={clsx('text-[10px] font-medium text-stone-600 truncate flex-1', !locked && 'cursor-text hover:underline')}
                      >
                        {entry.origName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <LocationBadges entry={entry} />
                    <span className="text-[9px] text-stone-300">{formatBytes(entry.sizeBytes)}</span>
                  </div>
                  {entry.kind === 'image' && !locked && status === 'ready' && (onInsert || onToggleInclude) && (
                    <button
                      onClick={() => (onToggleInclude ? onToggleInclude(entry) : onInsert?.(entry))}
                      className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors self-start',
                        included ? 'text-emerald-600 hover:text-red-600 hover:bg-red-50' : accentText + ' hover:bg-stone-100',
                      )}
                    >
                      {included ? `${includedLabel} ✕` : (onToggleInclude ? '추가' : insertLabel)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={clsx('flex flex-col gap-1.5 rounded-2xl p-1 transition-colors', dragging && accentDrag)}
        >
          {entries.map((entry, idx) => {
            const status = getEntryStatus(entry);
            const error  = getEntryError(entry);
            const included = isIncluded?.(entry) ?? false;
            return (
              <div key={entry.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-2 py-1.5">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center relative overflow-hidden shrink-0">
                  {entry.kind === 'image' ? (
                    <CachedImg id={entry.id} src={resolveDisplayUrl(entry)} alt={entry.origName} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon kind={entry.kind} className="text-stone-300" />
                  )}
                  {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Loader2 size={12} className="text-white animate-spin" />
                    </div>
                  )}
                  {status === 'error' && (
                    <button onClick={() => retry(entry.id)} title={error ?? '재시도'}
                      className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                      <RefreshCw size={12} className="text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {renamingId === entry.id ? (
                    <input
                      autoFocus value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
                      className="w-full text-xs border border-stone-300 rounded px-1.5 py-0.5"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <p onClick={() => !locked && startRename(entry)}
                        className={clsx('text-xs font-medium text-stone-700 truncate', !locked && 'cursor-text hover:underline')}>
                        {entry.origName}
                      </p>
                      {!locked && (
                        <button onClick={() => startRename(entry)} className="shrink-0 text-stone-300 hover:text-stone-500">
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <LocationBadges entry={entry} />
                    <span className="text-[10px] text-stone-400">{formatBytes(entry.sizeBytes)}</span>
                  </div>
                </div>
                {entry.kind === 'image' && !locked && status === 'ready' && (onInsert || onToggleInclude) && (
                  <button
                    onClick={() => (onToggleInclude ? onToggleInclude(entry) : onInsert?.(entry))}
                    className={clsx(
                      'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors',
                      included ? 'text-emerald-600 hover:text-red-600 hover:bg-red-50' : accentText + ' hover:bg-stone-100',
                    )}
                  >
                    {included ? `${includedLabel} ✕` : (onToggleInclude ? '추가' : insertLabel)}
                  </button>
                )}
                {!locked && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveEntry(entry.id, 'up')} disabled={idx === 0}
                      className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronUp size={12} /></button>
                    <button onClick={() => moveEntry(entry.id, 'down')} disabled={idx === entries.length - 1}
                      className="p-1 rounded hover:bg-stone-100 text-stone-400 disabled:opacity-30"><ChevronDown size={12} /></button>
                    {status === 'ready' && (
                      <button onClick={() => removeEntry(entry.id)} className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
