'use client';

import { useState } from 'react';
import { Folder, FolderPlus, FileText, Plus, Loader2, ChevronRight, Trash2, PenLine } from 'lucide-react';
import { clsx } from 'clsx';

export interface FolderNode {
  id:               string;
  parent_folder_id: string | null;
  title:            string;
  domain:           string;
  children:         FolderNode[];
  leafOrders:       { id: string; title: string; status: string; is_paid: number }[];
}

export interface FolderPathItem {
  id:    string;
  title: string;
}

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

      {/* 생성 버튼 */}
      <div className="flex gap-2">
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

      {/* 하위 폴더 */}
      {childFolders.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            하위 폴더 · 클릭하면 안으로 들어갑니다
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {childFolders.map((f) => (
              <div
                key={f.id}
                className="group relative bg-violet-50/60 border-2 border-violet-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-violet-300 transition-colors cursor-pointer"
                onClick={() => onNavigate(f.id)}
              >
                <Folder size={28} className="text-violet-400" />
                <p className="text-sm font-medium text-stone-700 truncate w-full text-center">{f.title}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                  disabled={deletingId === f.id}
                  className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingId === f.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이 폴더의 콘텐츠(leaf) */}
      {leafOrders.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            콘텐츠 · 클릭하면 편집기가 열립니다
          </p>
          {leafOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => onOpenOrder(o.id)}
              className="flex items-center gap-3 bg-amber-50/60 border-2 border-amber-100 rounded-xl p-3 hover:border-amber-300 transition-colors cursor-pointer"
            >
              <FileText size={16} className="text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-stone-700 truncate flex-1">{o.title}</p>
              {o.is_paid === 1 && (
                <span className="text-[11px] text-emerald-600 font-medium shrink-0">결제완료</span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium shrink-0">
                <PenLine size={11} />
                편집기로 열기
              </span>
            </div>
          ))}
        </div>
      )}

      {childFolders.length === 0 && leafOrders.length === 0 && (
        <div className={clsx('flex flex-col items-center gap-2 py-12 text-stone-400')}>
          <Folder size={32} className="opacity-30" />
          <p className="text-sm">비어 있습니다. 하위 폴더나 콘텐츠를 만들어보세요.</p>
        </div>
      )}
    </div>
  );
}
