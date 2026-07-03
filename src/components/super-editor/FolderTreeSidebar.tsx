'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import type { FolderNode } from './FolderTreeBrowser';

interface FolderTreeSidebarProps {
  tree:            FolderNode[];
  currentFolderId: string | null;
  onNavigate:      (folderId: string | null) => void;
}

// 트리를 뒤져 targetId까지의 조상 id들을 acc에 채운다. 반환값은 "이 서브트리 안에 targetId가 있는지"만 알려준다.
function collectAncestorIds(nodes: FolderNode[], targetId: string, acc: Set<string>): boolean {
  for (const node of nodes) {
    if (node.id === targetId) return true;
    if (collectAncestorIds(node.children, targetId, acc)) {
      acc.add(node.id);
      return true;
    }
  }
  return false;
}

export function FolderTreeSidebar({ tree, currentFolderId, onNavigate }: FolderTreeSidebarProps) {
  // 현재 위치까지의 조상 경로는 트리/현재 폴더가 바뀔 때마다 다시 계산되는 파생값이라
  // effect+setState로 동기화할 필요가 없다 — 매 렌더마다 순수하게 유도한다.
  const autoExpanded = useMemo(() => {
    const acc = new Set<string>();
    if (currentFolderId) collectAncestorIds(tree, currentFolderId, acc);
    return acc;
  }, [tree, currentFolderId]);

  // 사용자가 화살표를 직접 눌러 조상 경로의 기본값을 뒤집은 폴더만 별도로 추적한다.
  const [manualExpanded, setManualExpanded]   = useState<Set<string>>(new Set());
  const [manualCollapsed, setManualCollapsed] = useState<Set<string>>(new Set());

  function isExpandedId(id: string): boolean {
    if (manualCollapsed.has(id)) return false;
    if (manualExpanded.has(id)) return true;
    return autoExpanded.has(id);
  }

  function toggle(id: string) {
    if (isExpandedId(id)) {
      setManualCollapsed((prev) => new Set(prev).add(id));
      setManualExpanded((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } else {
      setManualExpanded((prev) => new Set(prev).add(id));
      setManualCollapsed((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  function renderNode(node: FolderNode, depth: number) {
    const hasChildren = node.children.length > 0;
    const isExpanded   = isExpandedId(node.id);
    const isActive     = node.id === currentFolderId;

    return (
      <div key={node.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(node.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(node.id); } }}
          style={{ paddingLeft: 8 + depth * 16 }}
          className={clsx(
            'flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer text-sm outline-none transition-colors',
            isActive ? 'bg-violet-100 text-violet-700 font-medium' : 'text-stone-600 hover:bg-stone-100',
          )}
        >
          <button
            onClick={(e) => { e.stopPropagation(); if (hasChildren) toggle(node.id); }}
            className={clsx('shrink-0 p-0.5 text-stone-400', !hasChildren && 'invisible')}
            tabIndex={-1}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <Folder size={14} className="text-amber-400 shrink-0" fill="currentColor" fillOpacity={0.15} />
          <span className="truncate">{node.title}</span>
        </div>
        {hasChildren && isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <nav className="w-52 shrink-0 border-r border-stone-100 overflow-y-auto py-3 px-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate(null)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(null); } }}
        className={clsx(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-sm outline-none mb-1 transition-colors',
          currentFolderId === null ? 'bg-violet-100 text-violet-700 font-medium' : 'text-stone-600 hover:bg-stone-100',
        )}
      >
        <Folder size={14} className="text-amber-400 shrink-0" fill="currentColor" fillOpacity={0.15} />
        최상위
      </div>
      {tree.map((node) => renderNode(node, 1))}
    </nav>
  );
}
