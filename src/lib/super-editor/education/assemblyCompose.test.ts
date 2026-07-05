// 조립 입력 분해 도우미(순수) 테스트 — kind별 parts 자동 생성 + 유닛 빌더
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { partsFromResult, buildAssemblyUnit } from './assemblyCompose';

const checks: [string, boolean][] = [];
const glyphs = (parts: { glyph: string }[]) => parts.map((p) => p.glyph);

// ── syllable(3편): 결과 글자 → 자모 부품 ───────────────────────────────────
const ga = partsFromResult('syllable', '가');
checks.push(['syllable "가" → [ㄱ, ㅏ]', ga.length === 2
  && JSON.stringify(glyphs(ga)) === JSON.stringify(['ㄱ', 'ㅏ'])]);
checks.push(['syllable: 발음 초안 = glyph', ga[0].pronunciation === 'ㄱ' && ga[1].pronunciation === 'ㅏ']);

const bang = partsFromResult('syllable', '방');
checks.push(['syllable "방" → [ㅂ, ㅏ, ㅇ](받침 포함)', bang.length === 3
  && JSON.stringify(glyphs(bang)) === JSON.stringify(['ㅂ', 'ㅏ', 'ㅇ'])]);

checks.push(['syllable "ㅏ"(음절 아님) → []', partsFromResult('syllable', 'ㅏ').length === 0]);
checks.push(['syllable "a"(라틴) → []', partsFromResult('syllable', 'a').length === 0]);

// ── word(4편): 음절 단위 ────────────────────────────────────────────────────
const bag = partsFromResult('word', '가방');
checks.push(['word "가방" → [가, 방]', bag.length === 2
  && JSON.stringify(glyphs(bag)) === JSON.stringify(['가', '방'])]);

// ── sentence(5편): 공백 기준 어절 ───────────────────────────────────────────
const sent = partsFromResult('sentence', '가방을 메요');
checks.push(['sentence "가방을 메요" → [가방을, 메요]', sent.length === 2
  && JSON.stringify(glyphs(sent)) === JSON.stringify(['가방을', '메요'])]);
checks.push(['sentence: 연속 공백도 어절 하나로', JSON.stringify(glyphs(partsFromResult('sentence', '가방을   메요')))
  === JSON.stringify(['가방을', '메요'])]);

// ── 빈/공백 입력 → [] (전 kind) ─────────────────────────────────────────────
checks.push(['빈 문자열 → [](전 kind)', partsFromResult('syllable', '').length === 0
  && partsFromResult('word', '').length === 0 && partsFromResult('sentence', '').length === 0]);
checks.push(['공백만 → [](전 kind)', partsFromResult('syllable', '   ').length === 0
  && partsFromResult('word', '  ').length === 0 && partsFromResult('sentence', ' \t ').length === 0]);

// ── buildAssemblyUnit — 팩토리 결합 ─────────────────────────────────────────
const unit = buildAssemblyUnit('syllable', '가');
checks.push(['buildAssemblyUnit: kind·resultKo·parts 채움', unit.kind === 'syllable'
  && unit.resultKo === '가' && JSON.stringify(glyphs(unit.parts)) === JSON.stringify(['ㄱ', 'ㅏ'])]);
checks.push(['buildAssemblyUnit: meaning 4언어 빈 문자열', unit.meaning.en === '' && unit.meaning.zh === ''
  && unit.meaning.ja === '' && unit.meaning.vi === '']);
checks.push(['buildAssemblyUnit: imageRef·voiceRef null, id 존재', unit.imageRef === null
  && unit.voiceRef === null && typeof unit.id === 'string' && unit.id.length > 0]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
