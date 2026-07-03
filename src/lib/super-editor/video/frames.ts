// 프레임 드로잉 유틸 — Canvas 2D에 장면 한 프레임을 그리는 순수 그리기 함수들.
// 인코딩(WebCodecs)·타이밍은 buildVideoMp4.ts 책임이고, 여기는 "어떻게 보이는가"만 안다.

const BG_COLOR   = '#141216'; // render-video.py 'modern' 스타일 배경과 같은 계열
const TEXT_COLOR = '#f5f5f4';

export function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);
}

/** 이미지/비디오 프레임을 검은 배경 위에 contain-fit으로 중앙 배치 */
export function drawMediaContain(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number, srcH: number,
  W: number, H: number,
): void {
  drawBackground(ctx, W, H);
  if (srcW <= 0 || srcH <= 0) return;
  const scale = Math.min(W / srcW, H / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  ctx.drawImage(source, (W - w) / 2, (H - h) / 2, w, h);
}

/** 텍스트 카드 — 중앙 정렬 + 단어 단위 줄바꿈(넘치면 글자 단위) */
export function drawTextCard(ctx: CanvasRenderingContext2D, text: string, W: number, H: number): void {
  drawBackground(ctx, W, H);
  const fontSize = Math.round(H / 14);
  ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = W * 0.8;
  const lines = wrapLines(ctx, text, maxWidth);
  const lineH = fontSize * 1.5;
  const startY = H / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineH));
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  // 단어 하나가 너무 길면(한글 장문 등) 글자 단위로 한 번 더 쪼갠다
  return lines.flatMap((line) => {
    if (ctx.measureText(line).width <= maxWidth) return [line];
    const chars: string[] = [];
    let cur = '';
    for (const ch of line) {
      if (cur && ctx.measureText(cur + ch).width > maxWidth) { chars.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) chars.push(cur);
    return chars;
  });
}

/**
 * 페이드 전환(v1) — 장면 시작 구간을 검정에서 밝아지게. 두 장면의 크로스페이드가 아니라
 * fade-through-black 근사다(클립 두 개를 동시에 디코드하지 않아도 되도록 의도적으로 단순화).
 * alpha: 0(완전 검정) → 1(원래 화면).
 */
export function applyFadeIn(ctx: CanvasRenderingContext2D, alpha: number, W: number, H: number): void {
  if (alpha >= 1) return;
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, 1 - alpha))})`;
  ctx.fillRect(0, 0, W, H);
}
