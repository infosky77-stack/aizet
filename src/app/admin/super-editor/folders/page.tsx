'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { FolderTreeBrowser, FolderNode, FolderPathItem } from '@/components/super-editor/FolderTreeBrowser';

function findNode(nodes: FolderNode[], id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function FoldersPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');

  const [tree, setTree] = useState<FolderNode[]>([]);
  const [path, setPath] = useState<FolderPathItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    const qs = folderId ? `?folderId=${folderId}` : '';
    const res = await fetch(`/api/admin/super-editor/folders${qs}`);
    if (res.ok) {
      const data = await res.json();
      setTree(data.tree ?? []);
      setPath(data.path ?? []);
    }
    setLoading(false);
  }, [folderId]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const current = folderId ? findNode(tree, folderId) : null;
  const childFolders = folderId ? (current?.children ?? []) : tree;
  const leafOrders    = folderId ? (current?.leafOrders ?? []) : [];

  function handleNavigate(id: string | null) {
    router.push(id ? `/admin/super-editor/folders?folderId=${id}` : '/admin/super-editor/folders');
  }

  // 팝업 진입 경로가 항상 "잡지 폴더" 버튼 클릭(router.push)이므로 뒤로가기로 자연스럽게 닫히지만,
  // 즐겨찾기 등으로 이 화면에 바로 진입한 경우 뒤로 갈 히스토리가 없을 수 있어 폴백을 둔다.
  function handleClose() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/super-editor');
    }
  }

  async function handleCreateFolder(title: string) {
    await fetch('/api/admin/super-editor/folders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parentFolderId: folderId, title, domain: 'magazine' }),
    });
    await fetchTree();
  }

  async function handleCreateContent(title: string) {
    const res = await fetch('/api/admin/super-editor', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderType: 'magazine', title, folderId }),
    });
    if (res.ok) {
      const { order } = await res.json();
      router.push(`/admin/super-editor/${order.id}`);
    }
  }

  async function handleDeleteFolder(id: string) {
    const res = await fetch(`/api/admin/super-editor/folders?folderId=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchTree();
    } else {
      const { error } = await res.json().catch(() => ({ error: '삭제 실패' }));
      alert(error ?? '삭제 실패');
    }
  }

  function handleOpenOrder(orderId: string) {
    router.push(`/admin/super-editor/${orderId}`);
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-stone-800">잡지 폴더</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              폴더 안에 폴더를 만들어 잡지를 원하는 만큼 깊게 구성하세요.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 (스크롤은 이 안에서만) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-stone-300" />
            </div>
          ) : (
            <FolderTreeBrowser
              childFolders={childFolders}
              leafOrders={leafOrders}
              path={path}
              onNavigate={handleNavigate}
              onCreateFolder={handleCreateFolder}
              onCreateContent={handleCreateContent}
              onDeleteFolder={handleDeleteFolder}
              onOpenOrder={handleOpenOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function FoldersPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-stone-300" />
      </div>
    }>
      <FoldersPageContent />
    </Suspense>
  );
}
