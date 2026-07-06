// AIZET Object Model — 첫 렌더러: 웹 HTML.
//
// DocumentTree를 시맨틱 HTML 프래그먼트로 변환하는 순수 함수. 블록의 "의미"만 태그로 매핑하고,
// 레이아웃/스타일 값은 블록에서 읽지 않는다(블록엔 꾸밈이 없다). 대신 om-* 클래스 훅만 부여해
// 나중에 테마 CSS가 붙을 수 있게 한다. 모든 텍스트/속성값은 escapeHtml로 이스케이프한다.
//
// 미래 확장성: 모르는 kind는 예외를 던지지 않고 건너뛰되 주석만 남긴다. document.title 같은
// 메타데이터는 렌더하지 않는다(제목은 heading 블록으로 표현). 바깥 페이지 셸(<html> 등)은
// 이 렌더러가 만들지 않는다 — 호출부 책임.

import type { BlockNode, DocumentTree, HeadingData, ImageData, ListData, ListItemData, ParagraphData } from '../types';
import type { Renderer } from './types';
import { escapeHtml } from './escape';

/** heading level → 태그·클래스 (1|2|3 외 값은 방어적으로 h3로 수렴) */
function headingTag(level: number): { tag: 'h1' | 'h2' | 'h3'; cls: string } {
  if (level === 1) return { tag: 'h1', cls: 'om-h1' };
  if (level === 2) return { tag: 'h2', cls: 'om-h2' };
  return { tag: 'h3', cls: 'om-h3' };
}

function renderBlock(node: BlockNode): string {
  switch (node.kind) {
    case 'heading': {
      const d = node.data as HeadingData;
      const { tag, cls } = headingTag(d.level);
      return `<${tag} class="${cls}">${escapeHtml(d.text ?? '')}</${tag}>`;
    }
    case 'paragraph': {
      const d = node.data as ParagraphData;
      return `<p class="om-p">${escapeHtml(d.text ?? '')}</p>`;
    }
    case 'image': {
      const d = node.data as ImageData;
      const caption = d.caption
        ? `<figcaption class="om-caption">${escapeHtml(d.caption)}</figcaption>`
        : '';
      return `<figure class="om-figure">`
        + `<img class="om-img" src="${escapeHtml(d.src ?? '')}" alt="${escapeHtml(d.alt ?? '')}">`
        + `${caption}</figure>`;
    }
    case 'list': {
      const d = node.data as ListData;
      const tag = d.ordered ? 'ol' : 'ul';
      // 자식 중 list_item인 것만 순서대로(트리 조립이 이미 position 정렬을 보장). 그 외 자식은 무시.
      const items = node.children
        .filter((c) => c.kind === 'list_item')
        .map((c) => `<li class="om-li">${escapeHtml((c.data as ListItemData).text ?? '')}</li>`)
        .join('');
      return `<${tag} class="om-list">${items}</${tag}>`;
    }
    // list_item은 list 안에서만 렌더된다. 최상위(stray) list_item은 여기서 무시.
    case 'list_item':
      return '';
    default:
      // 모르는 kind는 죽지 않고 주석만 — 확장 지점.
      return `<!-- unknown block: ${escapeHtml(node.kind)} -->`;
  }
}

export const renderHtml: Renderer = (tree: DocumentTree): string => {
  return tree.blocks.map(renderBlock).join('');
};
