'use client';

// AIZET Object Model — 편집기 오른쪽 "미리보기 전용" React 렌더.
//
// 목적: 기존 iframe(srcDoc=renderHtml 결과 문자열) 방식은 tree가 바뀔 때마다 문서 전체가
// 리로드되어 모든 <img>가 재요청됐다. 이를 React 실시간 렌더로 바꿔, tree 변경 시 React가
// diff로 바뀐 부분만 갱신하게 한다 → 변경 없는 이미지는 재요청되지 않는다(재다운 방지).
//
// 중요: 실제 출력용 렌더러(renderHtml/renderPdf/pageShell)는 이 파일과 무관하게 그대로 둔다.
// 이 컴포넌트는 화면 표시 전용이며, renderHtml(html.ts)의 태그·클래스 매핑을 그대로 따라
// 시각적으로 동일하게 보이게 한다. DB 저장값(image.src = 서버 URL)은 그대로 사용한다.
// 텍스트 이스케이프는 React가 자동으로 처리하므로 escapeHtml이 필요 없다(XSS 안전).

import type {
  DocumentTree, BlockNode,
  HeadingData, ParagraphData, ImageData, ListItemData,
} from '@/lib/super-editor/object-model/types';

// pageShell.ts의 om-* 스타일과 동일 — 미리보기 시각을 기존 iframe 렌더와 일치시킨다.
// (실제 출력 셸 pageShell.ts는 건드리지 않고, 같은 규칙을 여기서 화면용으로 재현.)
const OM_PREVIEW_CSS = `
.om-doc{max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;line-height:1.7;color:#2a2a2a}
.om-h1{font-size:1.8rem;margin:1.2em 0 .4em}
.om-h2{font-size:1.35rem;margin:1.4em 0 .3em}
.om-h3{font-size:1.1rem;margin:1.2em 0 .3em}
.om-p{margin:.6em 0}
.om-figure{margin:1.4em 0;text-align:center}
.om-img{max-width:100%;height:auto;border-radius:8px}
.om-caption{font-size:.85rem;color:#888;margin-top:.5em}
.om-list{margin:.6em 0 .6em 1.2em}
.om-li{margin:.25em 0}
`;

/** 최상위 블록 하나를 renderHtml(html.ts)과 동일한 태그·클래스로 매핑. 모르는 kind는 null. */
function PreviewBlock({ node }: { node: BlockNode }) {
  switch (node.kind) {
    case 'heading': {
      const d = node.data as HeadingData;
      // level 1→h1(om-h1), 2→h2(om-h2), 그 외→h3(om-h3) — html.ts headingTag와 동일 수렴
      if (d.level === 1) return <h1 className="om-h1">{d.text ?? ''}</h1>;
      if (d.level === 2) return <h2 className="om-h2">{d.text ?? ''}</h2>;
      return <h3 className="om-h3">{d.text ?? ''}</h3>;
    }
    case 'paragraph': {
      const d = node.data as ParagraphData;
      return <p className="om-p">{d.text ?? ''}</p>;
    }
    case 'image': {
      const d = node.data as ImageData;
      return (
        <figure className="om-figure">
          {/* src는 DB 저장값(서버 URL) 그대로. loading/decoding도 renderHtml과 동일 */}
          <img className="om-img" src={d.src ?? ''} alt={d.alt ?? ''} loading="lazy" decoding="async" />
          {d.caption ? <figcaption className="om-caption">{d.caption}</figcaption> : null}
        </figure>
      );
    }
    case 'list': {
      // 자식 중 list_item만 순서대로(트리 조립이 position 정렬 보장). 그 외 자식은 무시.
      const items = node.children.filter((c) => c.kind === 'list_item');
      const lis = items.map((c) => (
        <li key={c.id} className="om-li">{(c.data as ListItemData).text ?? ''}</li>
      ));
      const ordered = (node.data as { ordered?: boolean }).ordered;
      return ordered
        ? <ol className="om-list">{lis}</ol>
        : <ul className="om-list">{lis}</ul>;
    }
    // list_item은 list 안에서만 렌더(최상위 stray는 무시), 모르는 kind도 건너뜀
    default:
      return null;
  }
}

/**
 * 미리보기 문서 — tree.blocks(최상위, position 순)를 순회해 React로 렌더.
 * key=b.id 로 같은 블록의 엘리먼트를 유지 → tree 변경 시 바뀐 블록만 갱신되어 이미지 재로드를 막는다.
 */
export function DocumentPreview({ tree }: { tree: DocumentTree }) {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      <style>{OM_PREVIEW_CSS}</style>
      <article className="om-doc">
        {tree.blocks.map((b) => (
          <PreviewBlock key={b.id} node={b} />
        ))}
      </article>
    </div>
  );
}
