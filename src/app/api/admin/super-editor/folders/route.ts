import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  createFolder, getFolder, buildFolderTree, getFolderPath,
  canDeleteFolder, deleteFolderRecursive, FolderDomain,
} from '@/lib/db/order-folders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_DOMAINS: FolderDomain[] = ['generic', 'magazine', 'card', 'catalog', 'video'];

// GET /api/admin/super-editor/folders            → 내 폴더 트리 전체
// GET /api/admin/super-editor/folders?domain=x   → 해당 도메인 폴더 트리만(팝업별 분리)
// GET /api/admin/super-editor/folders?folderId=x → 트리 + 해당 폴더까지의 breadcrumb
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const domainRaw = req.nextUrl.searchParams.get('domain');
  const domain = domainRaw && VALID_DOMAINS.includes(domainRaw as FolderDomain)
    ? (domainRaw as FolderDomain)
    : undefined;

  const tree = buildFolderTree(session.sub, domain);
  const folderId = req.nextUrl.searchParams.get('folderId');
  if (folderId) {
    const folder = getFolder(folderId);
    if (!folder || folder.user_id !== session.sub) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json({ tree, path: getFolderPath(session.sub, folderId) });
  }

  return Response.json({ tree, path: [] });
}

// POST /api/admin/super-editor/folders  → 새 폴더(최상위 또는 하위) 생성
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { parentFolderId, title, domain } = await req.json();

  if (parentFolderId) {
    const parent = getFolder(parentFolderId);
    if (!parent || parent.user_id !== session.sub) {
      return Response.json({ error: 'Parent folder not found' }, { status: 404 });
    }
  }

  const folder = createFolder(
    session.sub,
    parentFolderId ?? null,
    title ?? '제목 없음',
    (domain as FolderDomain) ?? 'generic',
  );
  return Response.json({ folder });
}

// DELETE /api/admin/super-editor/folders?folderId=xxx  → 미결제 하위 트리만 있는 폴더 삭제
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const folderId = req.nextUrl.searchParams.get('folderId');
  if (!folderId) return Response.json({ error: 'folderId required' }, { status: 400 });

  const folder = getFolder(folderId);
  if (!folder || folder.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (!canDeleteFolder(session.sub, folderId)) {
    return Response.json({ error: '결제 완료된 콘텐츠가 포함되어 있어 삭제할 수 없습니다' }, { status: 409 });
  }

  deleteFolderRecursive(session.sub, folderId);
  return Response.json({ ok: true });
}
