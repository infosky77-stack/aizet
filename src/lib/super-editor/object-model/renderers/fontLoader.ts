// AIZET Object Model — 서버 전용 한글 폰트 로더(단일 책임).
//
// ⚠ 서버 전용: fs로 디스크에서 폰트 바이트를 읽는다. 브라우저에서 import 금지(fetch 기반의
// 클라이언트 폰트 로더는 pdf/shared.ts에 별도로 있음). Press PDF 렌더러가 pdf-lib에
// embedFont할 원본 바이트를 공급한다.

import fs from 'node:fs';
import path from 'node:path';

// 조사에서 확인한 실제 자산 경로(Regular 단일). subset:false로 임베드하므로 원본 그대로 읽는다.
const FONT_REL_PATH = path.join('public', 'fonts', 'NotoSansKR.ttf');

/** public/fonts/NotoSansKR.ttf 를 읽어 Uint8Array로 반환. 없으면 경로를 포함해 throw. */
export function loadKoreanFontBytes(): Uint8Array {
  const abs = path.join(process.cwd(), FONT_REL_PATH);
  if (!fs.existsSync(abs)) {
    throw new Error(`한글 폰트 파일을 찾을 수 없습니다: ${abs}`);
  }
  return new Uint8Array(fs.readFileSync(abs));
}
