'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-stone-800">잡지 폴더</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          폴더 안에 폴더를 만들어 잡지를 원하는 만큼 깊게 구성하세요.
        </p>
      </div>

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
  );
}

export default function FoldersPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-stone-300" />
      </div>
    }>
      <FoldersPageContent />
    </Suspense>
  );
}
