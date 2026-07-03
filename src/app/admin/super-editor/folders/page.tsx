'use client';

// 잡지 폴더 탐색기 팝업 — 화면 상태의 출처는 전부 URL이다.
//   ?folderId=…               현재 폴더
//   ?contentId=…              열어놓은 콘텐츠(주문)
//   ?view=files               (잡지 콘텐츠에서) 파일 관리 오버레이 열림
// openContent 같은 메모리 상태를 두지 않으므로 새로고침·딥링크·뒤로가기가 전부
// URL 기준으로 일관되게 동작한다. 오버레이 룩은 그대로 유지.

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { FolderTreeBrowser, FolderNode, FolderPathItem } from '@/components/super-editor/FolderTreeBrowser';
import { FolderTreeSidebar } from '@/components/super-editor/FolderTreeSidebar';
import { ContentFileViewer } from '@/components/super-editor/ContentFileViewer';
import { MagazineContentTabs } from '@/components/super-editor/MagazineContentTabs';

interface OpenContent {
  id:        string;
  title:     string;
  isPaid:    boolean;
  orderType: string;
}

function findNode(nodes: FolderNode[], id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

// 트리 전체(모든 폴더의 leafOrders)에서 콘텐츠(주문)를 찾는다 — contentId 딥링크 해석용.
function findOrderInTree(nodes: FolderNode[], orderId: string): OpenContent | null {
  for (const node of nodes) {
    const order = node.leafOrders.find((o) => o.id === orderId);
    if (order) {
      return { id: order.id, title: order.title, isPaid: order.is_paid === 1, orderType: order.order_type };
    }
    const found = findOrderInTree(node.children, orderId);
    if (found) return found;
  }
  return null;
}

function buildUrl(folderId: string | null, contentId?: string | null, view?: string | null): string {
  const params = new URLSearchParams();
  if (folderId) params.set('folderId', folderId);
  if (contentId) params.set('contentId', contentId);
  if (view) params.set('view', view);
  const qs = params.toString();
  return qs ? `/admin/super-editor/folders?${qs}` : '/admin/super-editor/folders';
}

function FoldersPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const folderId  = searchParams.get('folderId');
  const contentId = searchParams.get('contentId');
  const view      = searchParams.get('view');

  const [tree, setTree] = useState<FolderNode[]>([]);
  const [path, setPath] = useState<FolderPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  // 트리에 없는 콘텐츠(딥링크·최상위에서 만든 콘텐츠)의 단건 조회 폴백 결과
  const [fallbackContent, setFallbackContent] = useState<OpenContent | null>(null);

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
  const leafOrders   = folderId ? (current?.leafOrders ?? []) : [];

  // contentId → 콘텐츠 정보 해석: 1차는 이미 받아온 트리에서, 없으면 단건 조회 폴백.
  const treeContent  = contentId ? findOrderInTree(tree, contentId) : null;
  const openContent  = treeContent
    ?? (fallbackContent && fallbackContent.id === contentId ? fallbackContent : null);
  const resolvingContent = !!contentId && !openContent;

  useEffect(() => {
    if (!contentId || treeContent || loading) return;
    let cancelled = false;
    fetch(`/api/admin/super-editor?orderId=${contentId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.order) {
          setFallbackContent({
            id: data.order.id, title: data.order.title,
            isPaid: data.order.is_paid === 1, orderType: data.order.order_type,
          });
        } else {
          // 존재하지 않거나 남의 주문 — URL에서 contentId만 걷어내고 폴더 화면으로
          router.replace(buildUrl(folderId));
        }
      });
    return () => { cancelled = true; };
  }, [contentId, treeContent, loading, folderId, router]);

  function handleNavigate(id: string | null) {
    router.push(buildUrl(id));
  }

  // 팝업 진입 경로가 항상 "잡지 폴더" 버튼 클릭(router.push)이므로 뒤로가기로 자연스럽게 닫히지만,
  // 즐겨찾기 등으로 이 화면에 바로 진입한 경우 뒤로 갈 히스토리가 없을 수 있어 폴백을 둔다.
  // 콘텐츠가 열려 있어도 항상 팝업을 완전히 닫는다("폴더로" 버튼이 중간 단계 복귀를 전담).
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

  // 콘텐츠 생성도 열기와 동일하게 URL로 이동 — 새 콘텐츠 화면 역시 새로고침/뒤로가기가 성립한다.
  async function handleCreateContent(title: string) {
    const res = await fetch('/api/admin/super-editor', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderType: 'magazine', title, folderId }),
    });
    if (res.ok) {
      const { order } = await res.json();
      await fetchTree();
      router.push(buildUrl(folderId, order.id));
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
    router.push(buildUrl(folderId, orderId));
  }

  function handleBackToFolder() {
    router.push(buildUrl(folderId));
  }

  function handleOpenFullEditor() {
    if (contentId) router.push(`/admin/super-editor/${contentId}`);
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

        {/* 본문 — 폴더 탐색 중일 때만 왼쪽에 사이드바(폴더 트리), 오른쪽에 목록. 콘텐츠를 열면 기존처럼 전체 폭. */}
        <div className="flex-1 flex overflow-hidden">
          {!contentId && (
            <FolderTreeSidebar tree={tree} currentFolderId={folderId} onNavigate={handleNavigate} />
          )}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {openContent ? (
              openContent.orderType === 'magazine' ? (
                <MagazineContentTabs
                  orderId={openContent.id}
                  title={openContent.title}
                  isPaid={openContent.isPaid}
                  filesOpen={view === 'files'}
                  onFilesOpenChange={(open) =>
                    router.push(buildUrl(folderId, openContent.id, open ? 'files' : null))}
                  onBack={handleBackToFolder}
                  onOpenFullEditor={handleOpenFullEditor}
                />
              ) : (
                <ContentFileViewer
                  orderId={openContent.id}
                  title={openContent.title}
                  isPaid={openContent.isPaid}
                  onBack={handleBackToFolder}
                  onOpenFullEditor={handleOpenFullEditor}
                />
              )
            ) : loading || resolvingContent ? (
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
