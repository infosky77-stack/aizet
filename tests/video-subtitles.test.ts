// 자막 직렬화기 테스트 — 시각 포맷 · SRT/VTT 형식 · 불량 큐 보고 · 장면 기반 초안 · 폰트 스택
import {
  formatSubtitleTime, buildSubtitleFile, draftCuesFromScenes,
} from '../src/lib/super-editor/video/buildSubtitleFile';
import { emptyVideoProject, newScene, type SubtitleCue } from '../src/lib/super-editor/video/types';
import { LOCALE_FONT_STACKS } from '../src/lib/i18n/fontStacks';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';

const checks: [string, boolean][] = [];
const decode = (b: Uint8Array) => new TextDecoder().decode(b);

// ── 시각 포맷 — SRT는 쉼표, VTT는 마침표 ────────────────────────────────────
checks.push(['0초 → 00:00:00,000 (SRT)', formatSubtitleTime(0, 'srt') === '00:00:00,000']);
checks.push(['3661.5초 → 01:01:01.500 (VTT)', formatSubtitleTime(3661.5, 'vtt') === '01:01:01.500']);
checks.push(['음수는 0으로 클램프', formatSubtitleTime(-3, 'srt') === '00:00:00,000']);
checks.push(['부동소수 누적값 반올림(2.999…96 → 3초)', formatSubtitleTime(2.9999999999999996, 'srt') === '00:00:03,000']);

// ── SRT/VTT 직렬화 ──────────────────────────────────────────────────────────
const cues: SubtitleCue[] = [
  { startSec: 3, endSec: 6, text: '두 번째 자막' },
  { startSec: 0, endSec: 3, text: '첫 번째 자막' }, // 순서 뒤집힘 — 정렬 검증
];
const srt = decode(buildSubtitleFile(cues, 'srt').bytes);
checks.push(['SRT: 1부터 번호 매김', srt.startsWith('1\n00:00:00,000 --> 00:00:03,000\n첫 번째 자막')]);
checks.push(['SRT: 시작 시각 순 정렬', srt.indexOf('첫 번째') < srt.indexOf('두 번째')]);
checks.push(['SRT: 빈 줄로 큐 구분', srt.includes('첫 번째 자막\n\n2\n')]);

const vtt = decode(buildSubtitleFile(cues, 'vtt').bytes);
checks.push(['VTT: WEBVTT 헤더', vtt.startsWith('WEBVTT\n\n')]);
checks.push(['VTT: 마침표 밀리초 표기', vtt.includes('00:00:00.000 --> 00:00:03.000')]);
checks.push(['VTT: 큐 번호 없음', !vtt.includes('\n1\n00:')]);

// ── 불량 큐 — 조용히 누락시키지 않고 notices로 보고(output 계약) ────────────
const bad = buildSubtitleFile([
  { startSec: 0, endSec: 3, text: '정상' },
  { startSec: 3, endSec: 3, text: '시간 역전' },
  { startSec: 6, endSec: 9, text: '   ' },
], 'srt');
checks.push(['불량 2건 제외 + 보고', bad.notices.length === 2]);
checks.push(['정상 큐만 결과에 포함', decode(bad.bytes).includes('정상') && !decode(bad.bytes).includes('역전')]);
checks.push(['전부 불량이어도 크래시 없음', buildSubtitleFile([{ startSec: 0, endSec: 0, text: '' }], 'vtt').notices.length >= 1]);

// ── 장면 기반 초안 — text 장면이 해당 구간의 큐가 되고 clip/image는 시계만 전진 ──
const proj = emptyVideoProject('테스트 영상');
proj.scenes = [
  newScene('image', { durationSec: 2 }),
  newScene('text',  { text: '인트로 문구', durationSec: 4 }),
  newScene('clip',  { durationSec: null }),          // 원본 길이 모름 → 기본 3초 가정 + 보고
  newScene('text',  { text: '아웃트로', durationSec: 5 }),
  newScene('text',  { text: '   ', durationSec: 2 }), // 빈 문구 — 큐 없음
];
const draft = draftCuesFromScenes(proj);
checks.push(['text 장면 2개 → 큐 2개(빈 문구 제외)', draft.cues.length === 2]);
checks.push(['첫 큐: 2~6초(이미지 뒤)', draft.cues[0].startSec === 2 && draft.cues[0].endSec === 6]);
checks.push(['둘째 큐: 9~14초(클립 기본 3초 반영)', draft.cues[1].startSec === 9 && draft.cues[1].endSec === 14]);
checks.push(['클립 길이 가정을 보고', draft.notices.length === 1 && draft.notices[0].label.includes('클립')]);

// ── 언어별 폰트 스택 — 모든 언어 커버 + CJK는 전용 폰트 우선 ────────────────
checks.push(['모든 언어에 폰트 스택 존재', SUPPORTED_LOCALES.every((l) => LOCALE_FONT_STACKS[l].includes('var(--font-'))]);
checks.push(['ja는 Noto Sans JP 우선', LOCALE_FONT_STACKS.ja.startsWith('var(--font-noto-sans-jp)')]);
checks.push(['zh는 Noto Sans SC 우선', LOCALE_FONT_STACKS.zh.startsWith('var(--font-noto-sans-sc)')]);
checks.push(['ja/zh 스택에 한글 폴백(KR) 포함', LOCALE_FONT_STACKS.ja.includes('noto-sans-kr') && LOCALE_FONT_STACKS.zh.includes('noto-sans-kr')]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
