// AIZET Object Model — 웹 HTML 렌더러 미리보기 라우트(얇은 배선).
//
// GET /admin/super-editor/om-preview?siteId=...[&documentId=...][&seed=1]
//  - 렌더 로직은 renderers/html.ts(순수 함수)에 있고, 이 라우트는 세션·사이트 컨텍스트 확정 →
//    문서 로드 → renderHtml → wrapHtmlPage로 감싸 반환만 한다(기존 admin/super-editor 라우트의
//    세션·getSiteContext·bootstrapSite/close 관례 그대로).
//  - ⚠ ?seed=1은 미리보기 편의용 "멱등" 데모 시드일 뿐 정식 저장 API가 아니다. 실제 콘텐츠 저장
//    경로가 아니며, 같은 데모 문서가 있으면 재생성하지 않는다.

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSiteContext } from '@/lib/registry/siteContext';
import { bootstrapSite } from '@/lib/siteDb/siteDb';
import { listDocuments } from '@/lib/super-editor/object-model/store';
import { loadDocumentTree } from '@/lib/super-editor/object-model/model';
import { seedCatalogDemo } from '@/lib/super-editor/object-model/seed';
import { renderHtml } from '@/lib/super-editor/object-model/renderers/html';
import { renderPdf } from '@/lib/super-editor/object-model/renderers/pdf';
import { wrapHtmlPage } from '@/lib/super-editor/object-model/renderers/pageShell';
import { escapeHtml } from '@/lib/super-editor/object-model/renderers/escape';

// fs로 폰트를 읽는 renderPdf가 동작하려면 Node 런타임이어야 한다(Edge 금지).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/** 다운로드 파일명용 안전 문자열 — 경로/제어/특수문자를 '_'로, 비면 'document'. (UTF-8 원제목은 filename*로 별도 전달) */
function safeFileName(title: string): string {
  const cleaned = (title || '').replace(/[\\/:*?"<>| -]/g, '_').trim();
  return cleaned || 'document';
}

/** 안내 문구를 최소 페이지 셸로 감싼 응답 */
function notice(message: string, status: number): Response {
  const frag = `<h1 class="om-h1">미리보기</h1><p class="om-p">${escapeHtml(message)}</p>`;
  return html(wrapHtmlPage(frag, { lang: 'ko', title: '미리보기' }), status);
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = getSessionFromRequest(req);
  if (!session) return notice('로그인이 필요합니다.', 401);

  const siteId = req.nextUrl.searchParams.get('siteId');
  if (!siteId) return notice('siteId 쿼리 파라미터가 필요합니다. (예: ?siteId=site-xxxx)', 400);

  const ctx = getSiteContext(siteId, session.sub);
  if (!ctx) return notice('이 사이트에 대한 권한이 없습니다.', 403);

  const seed   = req.nextUrl.searchParams.get('seed');
  const format = req.nextUrl.searchParams.get('format') || 'html'; // 기본 html, 'pdf'면 PDF 분기
  let documentId = req.nextUrl.searchParams.get('documentId');

  const handle = bootstrapSite(ctx.dbPath);
  try {
    // seed=1 → 멱등 데모 시드, 그 문서를 렌더 대상으로
    if (seed === '1') {
      documentId = seedCatalogDemo(handle).documentId;
    }

    // 렌더 대상이 정해졌으면 그 문서를 렌더
    if (documentId) {
      const tree = loadDocumentTree(handle, documentId);

      // PDF 분기 — 문서 못 찾으면 HTML 안내 대신 간단한 404 텍스트
      if (format === 'pdf') {
        if (!tree) return new Response('문서를 찾을 수 없습니다.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
        const bytes = await renderPdf(tree);
        const safeTitle = safeFileName(tree.document.title);           // 한글 보존(filename*)
        const asciiFallback = safeTitle.replace(/[^\x20-\x7E]/g, '') || 'document'; // ASCII 폴백(filename=)
        return new Response(Buffer.from(bytes), {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
            'content-disposition':
              `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encodeURIComponent(safeTitle)}.pdf`,
          },
        });
      }

      if (!tree) return notice('문서를 찾을 수 없습니다.', 404);
      const fragment = renderHtml(tree);
      return html(wrapHtmlPage(fragment, { lang: tree.document.lang, title: tree.document.title }));
    }

    // 대상 없음 → 문서 목록 + 데모 만들기 안내
    const enc  = encodeURIComponent(siteId);
    const docs = listDocuments(handle);
    const rows = docs.length
      ? docs.map((d) => {
          const docQ = `?siteId=${enc}&documentId=${encodeURIComponent(d.id)}`;
          return `<li class="om-li"><a href="${docQ}">`
            + `${escapeHtml(d.title || '(제목 없음)')}</a> `
            + `<span class="om-caption">${escapeHtml(d.kind)}</span> `
            + `<a href="${docQ}&format=pdf">PDF</a></li>`;
        }).join('')
      : `<li class="om-li"><em>아직 문서가 없습니다.</em></li>`;

    const frag =
      `<h1 class="om-h1">Object Model 미리보기</h1>`
      + `<p class="om-p">사이트: <span class="om-caption">${escapeHtml(siteId)}</span></p>`
      + `<h2 class="om-h2">문서 목록</h2><ul class="om-list">${rows}</ul>`
      + `<p class="om-p"><a href="?siteId=${enc}&seed=1">＋ 데모 도록 만들기(멱등)</a></p>`;
    return html(wrapHtmlPage(frag, { lang: 'ko', title: 'Object Model 미리보기' }));
  } finally {
    handle.close();
  }
}
