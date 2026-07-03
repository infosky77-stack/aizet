'use client';

import { useState } from 'react';
import {
  Folder, FolderPlus, FileText, Plus, Loader2, ChevronRight, Trash2,
  LayoutGrid, List as ListIcon, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getOrderTypeLabel } from '@/lib/super-editor/labels';

export interface FolderNode {
  id:               string;
  parent_folder_id: string | null;
  title:            string;
  domain:           string;
  created_at:       number;
  updated_at:       number;
  children:         FolderNode[];
  leafOrders:       { id: string; title: string; status: string; is_paid: number; order_type: string; created_at: number; updated_at: number }[];
}

export interface FolderPathItem {
  id:    string;
  title: string;
}

type ViewMode  = 'grid' | 'list';
type SortField = 'name' | 'modified' | 'type' | 'size';
type SortDir   = 'asc' | 'desc';
interface SortState { field: SortField; dir: SortDir }

// 폴더 카드와 콘텐츠 카드를 하나의 목록으로 합치기 위한 공통 형태 — kind로만 구분한다.
// (지난 iteration의 "색깔 다른 두 섹션" 대신, 진짜 탐색기처럼 아이콘 모양이 1차 구분 신호가 되도록)
type ExplorerItem =
  | { kind: 'folder';  id: string; title: string; modifiedAt: number; childCount: number }
  | { kind: 'content'; id: string; title: string; modifiedAt: number; isPaid: boolean; orderType: string };

interface Props {
  /** 현재 위치의 하위 폴더들 */
  childFolders: FolderNode[];
  /** 현재 위치에 연결된 콘텐츠(leaf) */
  leafOrders:   FolderNode['leafOrders'];
  /** 최상위부터 현재 위치까지의 경로 */
  path:         FolderPathItem[];
  /** 콘텐츠 생성 입력 placeholder — 팝업 도메인(잡지/영상)별 문구 */
  contentPlaceholder?: string;
  onNavigate:   (folderId: string | null) => void;
  onCreateFolder:  (title: string) => Promise<void>;
  onCreateContent: (title: string) => Promise<void>;
  onDeleteFolder:  (folderId: string) => Promise<void>;
  onOpenOrder:     (orderId: string) => void;
}

function buildItems(childFolders: FolderNode[], leafOrders: FolderNode['leafOrders']): ExplorerItem[] {
  const folders: ExplorerItem[] = childFolders.map((f) => ({
    kind: 'folder', id: f.id, title: f.title, modifiedAt: f.updated_at,
    childCount: f.children.length + f.leafOrders.length,
  }));
  const content: ExplorerItem[] = leafOrders.map((o) => ({
    kind: 'content', id: o.id, title: o.title, isPaid: o.is_paid === 1,
    modifiedAt: o.updated_at, orderType: o.order_type,
  }));
  return [...folders, ...content];
}

// "유형" 정렬용 라벨: 폴더는 고정 '폴더', 콘텐츠는 order_type의 한글 라벨.
function typeLabelOf(item: ExplorerItem): string {
  return item.kind === 'folder' ? '폴더' : getOrderTypeLabel(item.orderType);
}

// "크기" 정렬용 값: 폴더는 하위 개수, 콘텐츠는 크기 표시가 없으므로(전부 "—") 0으로 취급 —
// 콘텐츠끼리는 사실상 동률이라 이름순으로 안정적으로 유지된다.
function sizeValueOf(item: ExplorerItem): number {
  return item.kind === 'folder' ? item.childCount : 0;
}

function compareBy(field: SortField, dir: SortDir) {
  const sign = dir === 'asc' ? 1 : -1;
  return (a: ExplorerItem, b: ExplorerItem) => {
    let base: number;
    switch (field) {
      case 'modified': base = a.modifiedAt - b.modifiedAt; break;
      case 'type':     base = typeLabelOf(a).localeCompare(typeLabelOf(b), 'ko'); break;
      case 'size':     base = sizeValueOf(a) - sizeValueOf(b); break;
      case 'name':
      default:          base = a.title.localeCompare(b.title, 'ko');
    }
    if (base !== 0) return base * sign;
    // 동률이면 이름순으로 안정적인 순서를 보장
    return a.title.localeCompare(b.title, 'ko');
  };
}

function sortItems(items: ExplorerItem[], sort: SortState): ExplorerItem[] {
  const folders  = items.filter((i) => i.kind === 'folder');
  const content  = items.filter((i) => i.kind === 'content');
  const cmp = compareBy(sort.field, sort.dir);
  // 폴더를 먼저, 그다음 콘텐츠 — 진짜 탐색기처럼. 그룹 내부는 선택한 정렬 기준 적용.
  return [...folders.sort(cmp), ...content.sort(cmp)];
}

export function FolderTreeBrowser({
  childFolders, leafOrders, path,
  contentPlaceholder = '콘텐츠 제목 (예: 11월호 표지)',
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
  const [sort, setSort] = useState<SortState>({ field: 'name', dir: 'asc' });

  // list 모드 컬럼 헤더 클릭: 같은 필드를 다시 클릭하면 방향 반전, 다른 필드면 기본 방향으로 시작.
  function handleSort(field: SortField) {
    setSort((prev) => prev.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'name' || field === 'type' ? 'asc' : 'desc' });
  }

  function sortIndicator(field: SortField) {
    if (sort.field !== field) return null;
    return sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  }

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

  const items = sortItems(buildItems(childFolders, leafOrders), sort);

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
          {viewMode === 'grid' && (
            <button
              onClick={() => setSort((s) => (s.field === 'name'
                ? { field: 'modified', dir: 'desc' }
                : { field: 'name', dir: 'asc' }))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="정렬 기준 전환"
            >
              <ArrowUpDown size={13} />
              {sort.field === 'name' ? '이름순' : '최근순'}
            </button>
          )}
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
            placeholder={contentPlaceholder}
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
        <div className="flex flex-col">
          {/* 컬럼 헤더 — 클릭해서 정렬 기준/방향 전환 */}
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold text-stone-400 border-b border-stone-100">
            <span className="w-[18px] shrink-0" />
            <button onClick={() => handleSort('name')} className="flex-1 min-w-0 flex items-center gap-1 text-left hover:text-stone-600">
              이름 {sortIndicator('name')}
            </button>
            <button onClick={() => handleSort('modified')} className="w-40 shrink-0 flex items-center gap-1 text-left hover:text-stone-600">
              수정한 날짜 {sortIndicator('modified')}
            </button>
            <button onClick={() => handleSort('type')} className="w-16 shrink-0 flex items-center gap-1 text-left hover:text-stone-600">
              유형 {sortIndicator('type')}
            </button>
            <button onClick={() => handleSort('size')} className="w-16 shrink-0 flex items-center justify-end gap-1 text-right hover:text-stone-600">
              크기 {sortIndicator('size')}
            </button>
            <span className="w-[25px] shrink-0" />
          </div>

          <div className="flex flex-col gap-1.5 pt-1.5" onClick={() => setSelectedId(null)}>
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
                <span className="text-sm font-medium text-stone-700 truncate flex-1 min-w-0 flex items-center gap-2">
                  {item.title}
                  {item.kind === 'content' && item.isPaid && (
                    <span className="text-[11px] text-emerald-600 font-medium shrink-0">결제완료</span>
                  )}
                </span>
                <span className="w-40 shrink-0 text-xs text-stone-400">
                  {new Date(item.modifiedAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className="w-16 shrink-0 text-xs text-stone-500 truncate">
                  {item.kind === 'folder' ? '폴더' : getOrderTypeLabel(item.orderType)}
                </span>
                <span className="w-16 shrink-0 text-xs text-stone-400 text-right">
                  {item.kind === 'folder' ? `${item.childCount}개` : '—'}
                </span>
                <span className="w-[25px] shrink-0 flex justify-center">
                  {item.kind === 'folder' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      disabled={deletingId === item.id}
                      className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
