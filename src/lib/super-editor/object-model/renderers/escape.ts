// HTML 이스케이프 — 텍스트/속성값을 마크업에 안전하게 넣기 위한 공용 유틸.
//
// & 를 반드시 가장 먼저 치환한다(나중에 치환하면 앞서 만든 엔티티의 &까지 다시 바꿔
// 이중 이스케이프됨). 텍스트 노드와 속성값(" ' 포함) 양쪽에 안전하도록 5개 문자를 모두 처리.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
