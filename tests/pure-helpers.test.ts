// 순수 헬퍼 모음 테스트 — folder-domains, video/types, pdf/shared.wrapText
import { getFolderPopupConfig, FOLDER_POPUP_CONFIGS } from '../src/lib/super-editor/folder-domains';
import { newScene, isVideoProjectSnapshot, emptyVideoProject } from '../src/lib/super-editor/video/types';
import { readFileSync } from 'fs';

const checks: [string, boolean][] = [];

// folder-domains
checks.push(['domain=video → 영상 config(orderType video)', getFolderPopupConfig('video').orderType === 'video']);
checks.push(['domain 누락 → magazine 폴백', getFolderPopupConfig(null).domain === 'magazine']);
checks.push(['모르는 domain → magazine 폴백', getFolderPopupConfig('hacked').domain === 'magazine']);
checks.push(['domain=product → 제품상세 config(orderType product)', getFolderPopupConfig('product').orderType === 'product']);
checks.push(['domain=education → 교육 config(orderType education)', getFolderPopupConfig('education').orderType === 'education']);
checks.push(['등록 도메인 4종(magazine/video/product/education)', Object.keys(FOLDER_POPUP_CONFIGS).length === 4]);

// video/types
const clip = newScene('clip');
const img  = newScene('image');
checks.push(['clip 기본 길이 null(원본 길이)', clip.durationSec === null]);
checks.push(['image 기본 길이 3초', img.durationSec === 3]);
checks.push(['scene id 유일성', newScene('text').id !== newScene('text').id]);
checks.push(['빈 프로젝트는 version 2 가드 통과', isVideoProjectSnapshot(emptyVideoProject('t'))]);
checks.push(['구형 스냅샷은 가드 거부', !isVideoProjectSnapshot({ canvas: { blocks: [] }, duration_sec: 30 })]);

// pdf/shared.wrapText — 실제 폰트로 줄바꿈 폭 검증
(async () => {
  const { PDFDocument } = await import('pdf-lib');
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  const { wrapText } = await import('../src/lib/super-editor/pdf/shared');
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync('/root/aizet/public/fonts/NotoSansKR.ttf'), { subset: false });
  const lines = wrapText('가나다 라마바 사아자 차카타 파하', font, 12, 60);
  checks.push(['wrapText: 좁은 폭에서 여러 줄로 분리', lines.length > 1]);
  checks.push(['wrapText: 모든 줄이 최대 폭 이하', lines.every((l) => font.widthOfTextAtSize(l, 12) <= 60 || !l.includes(' '))]);
  checks.push(['wrapText: 내용 보존(공백 제외)', lines.join('').replace(/ /g, '') === '가나다라마바사아자차카타파하']);

  let failed = 0;
  for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
  process.exit(failed === 0 ? 0 : 1);
})();
