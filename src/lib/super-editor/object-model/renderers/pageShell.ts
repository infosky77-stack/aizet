// AIZET Object Model — 페이지 셸(공용 유틸).
//
// 렌더러(renderHtml 등)는 바깥 페이지 껍데기를 만들지 않고 프래그먼트만 반환한다. 이 함수는
// 그 프래그먼트를 최소 HTML 문서(+ om-* 최소 스타일)로 감싼다 — 미리보기 라우트·테스트가
// 공통으로 쓰는 얇은 셸이다. title은 escapeHtml로 이스케이프한다(마크업 깨짐·주입 방지).

import { escapeHtml } from './escape';

export function wrapHtmlPage(fragment: string, opts: { lang?: string; title?: string }): string {
  const lang  = opts.lang || 'ko';
  const title = escapeHtml(opts.title || '미리보기');
  return `<!DOCTYPE html><html lang="${lang}"><head>`
    + `<meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width, initial-scale=1">`
    + `<title>${title}</title>`
    + `<style>`
    + `.om-doc{max-width:720px;margin:40px auto;padding:0 20px;`
    + `font-family:system-ui,-apple-system,sans-serif;line-height:1.7;color:#2a2a2a}`
    + `.om-h1{font-size:1.8rem;margin:1.2em 0 .4em}`
    + `.om-h2{font-size:1.35rem;margin:1.4em 0 .3em}`
    + `.om-h3{font-size:1.1rem;margin:1.2em 0 .3em}`
    + `.om-p{margin:.6em 0}`
    + `.om-figure{margin:1.4em 0;text-align:center}`
    + `.om-img{max-width:100%;height:auto;border-radius:8px}`
    + `.om-caption{font-size:.85rem;color:#888;margin-top:.5em}`
    + `.om-list{margin:.6em 0 .6em 1.2em}`
    + `.om-li{margin:.25em 0}`
    + `</style></head><body><article class="om-doc">${fragment}</article></body></html>`;
}
