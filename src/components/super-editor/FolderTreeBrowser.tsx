'use client';

import { useState } from 'react';
import {
  Folder, FolderPlus, FileText, Plus, Loader2, ChevronRight, Trash2,
  LayoutGrid, List as ListIcon, ArrowUpDown,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface FolderNode {
  id:               string;
  parent_folder_id: string | null;
  title:            string;
  domain:           string;
  created_at:       number;
  children:         FolderNode[];
  leafOrders:       { id: string; title: string; status: string; is_paid: number; created_at: number; updated_at: number }[];
}

export interface FolderPathItem {
  id:    string;
  title: string;
}

type ViewMode = 'grid' | 'list';
type SortBy   = 'name' | 'recent';

// 폴더 카드와 콘텐츠 카드를 하나의 목록으로 합치기 위한 공통 형태 — kind로만 구분한다.
// (지난 iteration의 "색깔 다른 두 섹션" 대신, 진짜 탐색기처럼 아이콘 모양이 1차 구분 신호가 되도록)
type ExplorerItem =
  | { kind: 'folder';  id: string; title: string; sortKey: number }
  | { kind: 'content'; id: string; title: string; sortKey: number; isPaid: boolean };

interface Props {
  /** 현재 위치의 하위 폴더들 */
  childFolders: FolderNode[];
  /** 현재 위치에 연결된 콘텐츠(leaf) */
  leafOrders:   FolderNode['leafOrders'];
  /** 최상위부터 현재 위치까지의 경로 */
  path:         FolderPathItem[];
  onNavigate:   (folderId: string | null) => void;
  onCreateFolder:  (title: string) => Promise<void>;
  onCreateContent: (title: string) => Promise<void>;
  onDeleteFolder:  (folderId: string) => Promise<void>;
  onOpenOrder:     (orderId: string) => void;
}

function buildItems(childFolders: FolderNode[], leafOrders: FolderNode['leafOrders'], sortBy: SortBy): ExplorerItem[] {
  const folders: ExplorerItem[] = childFolders.map((f) => ({
    kind: 'folder', id: f.id, title: f.title, sortKey: sortBy === 'recent' ? f.created_at : 0,
  }));
  const content: ExplorerItem[] = leafOrders.map((o) => ({
    kind: 'content', id: o.id, title: o.title, isPaid: o.is_paid === 1,
    sortKey: sortBy === 'recent' ? o.updated_at : 0,
  }));
  const byName = (a: ExplorerItem, b: ExplorerItem) => a.title.localeCompare(b.title, 'ko');
  const byRecent = (a: ExplorerItem, b: ExplorerItem) => b.sortKey - a.sortKey;
  const cmp = sortBy === 'name' ? byName : byRecent;
  // 폴더를 먼저, 그다음 콘텐츠 — 진짜 탐색기처럼. 그룹 내부는 선택한 정렬 기준 적용.
  return [...folders.sort(cmp), ...content.sort(cmp)];
}

export function FolderTreeBrowser({
  childFolders, leafOrders, path,
  onNavigate, onCreateFolder, onCreateContent, onDeleteFolder, onOpenOrder,
}: Props) {
  const [creatingFolder,  setCreatingFolder]  = useState(false);
  const [creatingContent, setCreatingContent] = useState(false);
  const [newFolderTitle,  setNewFolderTitle]  = useState('');
  const [newContentTitle, setNewContentTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  async function handleCreateFolder() {
    if (!newFolderTitle.trim()) return;
    setBusy(true);
    try {
      await onCreateFolder(newFolderTitle.trim());
      setNewFolderTitle('');
      setCreatingFolder(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateContent() {
    if (!newContentTitle.trim()) return;
    setBusy(true);
    try {
      await onCreateContent(newContentTitle.trim());
      setNewContentTitle('');
      setCreatingContent(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(folderId: string) {
    if (!confirm('이 폴더(하위 폴더/콘텐츠 포함)를 삭제하시겠습니까?')) return;
    setDeletingId(folderId);
    try {
      await onDeleteFolder(folderId);
    } finally {
      setDeletingId(null);
    }
  }

  function openItem(item: ExplorerItem) {
    if (item.kind === 'folder') onNavigate(item.id);
    else onOpenOrder(item.id);
  }

  function handleItemKeyDown(e: React.KeyboardEvent, item: ExplorerItem) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openItem(item);
    }
  }

  const items = buildItems(childFolders, leafOrders, sortBy);

  return (
    <div className="flex flex-col gap-5">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-stone-500 flex-wrap">
        <button onClick={() => onNavigate(null)} className="hover:text-violet-600 font-medium">
          최상위
        </button>
        {path.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <ChevronRight size={13} className="text-stone-300" />
            <button onClick={() => onNavigate(p.id)} className="hover:text-violet-600 font-medium">
              {p.title}
            </button>
          </span>
        ))}
      </div>

      {/* 생성 버튼 + 보기/정렬 툴바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCreatingFolder((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
        >
          <FolderPlus size={14} /> 새 하위 폴더
        </button>
        <button
          onClick={() => setCreatingContent((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
        >
          <Plus size={14} /> 여기에 콘텐츠 만들기
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSortBy((s) => (s === 'name' ? 'recent' : 'name'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="정렬 기준 전환"
          >
            <ArrowUpDown size={13} />
            {sortBy === 'name' ? '이름순' : '최근순'}
          </button>
          <div className="flex items-center gap-0.5 border border-stone-200 rounded-lg p-0.5 bg-white">
            <button onClick={() => setViewMode('grid')}
              className={clsx('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-stone-100 text-violet-700' : 'text-stone-400 hover:text-stone-600')}>
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={clsx('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-stone-100 text-violet-700' : 'text-stone-400 hover:text-stone-600')}>
              <ListIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      {creatingFolder && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newFolderTitle}
            onChange={(e) => setNewFolderTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="폴더 이름"
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderTitle.trim() || busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : '만들기'}
          </button>
        </div>
      )}

      {creatingContent && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newContentTitle}
            onChange={(e) => setNewContentTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateContent()}
            placeholder="콘텐츠 제목 (예: 11월호 표지)"
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            onClick={handleCreateContent}
            disabled={!newContentTitle.trim() || busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : '만들기'}
          </button>
        </div>
      )}

      {/* 폴더 + 콘텐츠 통합 목록 — 아이콘 모양이 1차 구분 신호(폴더 아이콘 vs 문서 아이콘) */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-stone-400">
          <Folder size={32} className="opacity-30" />
          <p className="text-sm">비어 있습니다. 하위 폴더나 콘텐츠를 만들어보세요.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          onClick={() => setSelectedId(null)}
        >
          {items.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              tabIndex={0}
              role="button"
              onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); openItem(item); }}
              onKeyDown={(e) => handleItemKeyDown(e, item)}
              className={clsx(
                'group relative bg-white border rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors outline-none',
                selectedId === item.id ? 'ring-2 ring-violet-400 border-violet-300' : 'border-stone-200 hover:border-violet-200',
              )}
            >
              {item.kind === 'folder' ? (
                <Folder size={30} className="text-amber-400" fill="currentColor" fillOpacity={0.15} />
              ) : (
                <FileText size={30} className="text-stone-400" />
              )}
              <p className="text-sm font-medium text-stone-700 truncate w-full text-center">{item.title}</p>
              {item.kind === 'content' && item.isPaid && (
                <span className="text-[10px] text-emerald-600 font-medium">결제완료</span>
              )}
              {item.kind === 'folder' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5" onClick={() => setSelectedId(null)}>
          {items.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              tabIndex={0}
              role="button"
              onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); openItem(item); }}
              onKeyDown={(e) => handleItemKeyDown(e, item)}
              className={clsx(
                'group flex items-center gap-3 bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-colors outline-none',
                selectedId === item.id ? 'ring-2 ring-violet-400 border-violet-300' : 'border-stone-200 hover:border-violet-200',
              )}
            >
              {item.kind === 'folder' ? (
                <Folder size={18} className="text-amber-400 shrink-0" fill="currentColor" fillOpacity={0.15} />
              ) : (
                <FileText size={18} className="text-stone-400 shrink-0" />
              )}
              <p className="text-sm font-medium text-stone-700 truncate flex-1">{item.title}</p>
              {item.kind === 'content' && item.isPaid && (
                <span className="text-[11px] text-emerald-600 font-medium shrink-0">결제완료</span>
              )}
              {item.kind === 'folder' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  disabled={deletingId === item.id}
                  className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
