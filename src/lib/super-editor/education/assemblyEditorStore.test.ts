// 조립 편집 상태 관리(순수) 테스트 — 불변 리듀서 동작 + 원본 불변성
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import {
  setResult, setKind, updatePart, movePart, removePart, addPart,
  setMeaning, setImageRef, setVoiceRef,
} from './assemblyEditorStore';
import { buildAssemblyUnit } from './assemblyCompose';
import { newAssemblyUnit } from './types';

const checks: [string, boolean][] = [];
const glyphs = (parts: { glyph: string }[]) => parts.map((p) => p.glyph);

// ── setResult: parts 자동 재생성 + 원본 불변 ────────────────────────────────
const ga = buildAssemblyUnit('syllable', '가'); // parts [ㄱ, ㅏ]
const gaSnapshot = JSON.stringify(ga);
const na = setResult(ga, '나'); // syllable 규칙: '나' → [ㄴ, ㅏ]로 parts 재생성
checks.push(['setResult "나" → parts [ㄴ, ㅏ] 재생성', JSON.stringify(glyphs(na.parts)) === JSON.stringify(['ㄴ', 'ㅏ'])]);
checks.push(['setResult: resultKo 반영', na.resultKo === '나']);
checks.push(['setResult: 원본 unit 불변(parts [ㄱ,ㅏ] 그대로)', JSON.stringify(ga) === gaSnapshot
  && JSON.stringify(glyphs(ga.parts)) === JSON.stringify(['ㄱ', 'ㅏ'])]);

// word 컨텍스트에서 setResult가 음절 분해로 재생성되는지
const word = buildAssemblyUnit('word', '가'); // parts [가]
const word2 = setResult(word, '가방');
checks.push(['setResult(word) "가방" → [가, 방] 재생성', JSON.stringify(glyphs(word2.parts)) === JSON.stringify(['가', '방'])]);

// ── setKind: 규칙 바뀌며 parts 재생성 ───────────────────────────────────────
const asWord = buildAssemblyUnit('word', '가방'); // [가, 방]
const asSyllable = setKind(asWord, 'syllable');   // '가방' 첫 글자 '가' → [ㄱ, ㅏ]
checks.push(['setKind word→syllable: parts 규칙 변경', asSyllable.kind === 'syllable'
  && JSON.stringify(glyphs(asSyllable.parts)) === JSON.stringify(['ㄱ', 'ㅏ'])]);
checks.push(['setKind: resultKo 유지', asSyllable.resultKo === '가방']);
checks.push(['setKind: 원본 불변', JSON.stringify(asWord.parts) === JSON.stringify(buildAssemblyUnit('word', '가방').parts)]);

// ── updatePart: 특정 부품만 수정, 나머지 영향 없음 ──────────────────────────
const base = buildAssemblyUnit('syllable', '가'); // [ㄱ"ㄱ", ㅏ"ㅏ"]
const edited = updatePart(base, 0, { pronunciation: '그' });
checks.push(['updatePart: index 0 발음 수정 반영', edited.parts[0].pronunciation === '그' && edited.parts[0].glyph === 'ㄱ']);
checks.push(['updatePart: 다른 부품 영향 없음', edited.parts[1].pronunciation === base.parts[1].pronunciation]);
checks.push(['updatePart: 원본 불변', base.parts[0].pronunciation === 'ㄱ']);
checks.push(['updatePart: 범위 밖 index면 그대로', updatePart(base, 5, { glyph: 'x' }) === base
  && updatePart(base, -1, { glyph: 'x' }) === base]);

// ── movePart: 순서 이동 ─────────────────────────────────────────────────────
const moved = movePart(base, 0, 1);
checks.push(['movePart(0→1): 순서 뒤바뀜', JSON.stringify(glyphs(moved.parts)) === JSON.stringify(['ㅏ', 'ㄱ'])]);
checks.push(['movePart: 원본 불변', JSON.stringify(glyphs(base.parts)) === JSON.stringify(['ㄱ', 'ㅏ'])]);
checks.push(['movePart: 범위 밖·동일 index면 그대로', movePart(base, 0, 5) === base
  && movePart(base, -1, 0) === base && movePart(base, 1, 1) === base]);

// ── removePart / addPart ────────────────────────────────────────────────────
const removed = removePart(base, 0);
checks.push(['removePart(0): 첫 부품 제거', JSON.stringify(glyphs(removed.parts)) === JSON.stringify(['ㅏ'])]);
checks.push(['removePart: 범위 밖이면 그대로', removePart(base, 9) === base && removePart(base, -1) === base]);
const added = addPart(base, { glyph: 'ㅇ', pronunciation: '응' });
checks.push(['addPart: 끝에 추가', JSON.stringify(glyphs(added.parts)) === JSON.stringify(['ㄱ', 'ㅏ', 'ㅇ'])]);
checks.push(['addPart: 원본 불변(2개 유지)', base.parts.length === 2]);

// ── setMeaning: 해당 언어만 변경 ────────────────────────────────────────────
const withMeaning = setMeaning(base, 'en', 'bag');
checks.push(['setMeaning en만 변경, 나머지 유지', withMeaning.meaning.en === 'bag'
  && withMeaning.meaning.zh === '' && withMeaning.meaning.ja === '' && withMeaning.meaning.vi === '']);
checks.push(['setMeaning: 원본 meaning 불변', base.meaning.en === '']);

// ── setImageRef / setVoiceRef ───────────────────────────────────────────────
checks.push(['setImageRef 설정/해제', setImageRef(base, 'ref123').imageRef === 'ref123'
  && setImageRef(base, null).imageRef === null]);
checks.push(['setVoiceRef 설정/해제', setVoiceRef(base, 'v1').voiceRef === 'v1'
  && setVoiceRef(base, null).voiceRef === null]);
checks.push(['setImageRef: 원본 불변', base.imageRef === null]);

// ── 불변성 종합(원본 참조 미변형) ───────────────────────────────────────────
const orig = newAssemblyUnit({ kind: 'syllable', resultKo: '가', parts: [{ glyph: 'ㄱ', pronunciation: 'ㄱ' }, { glyph: 'ㅏ', pronunciation: 'ㅏ' }] });
const snap = JSON.stringify(orig);
setResult(orig, '나');
setKind(orig, 'word');
updatePart(orig, 0, { glyph: 'z' });
movePart(orig, 0, 1);
removePart(orig, 0);
addPart(orig, { glyph: 'x', pronunciation: 'x' });
setMeaning(orig, 'ja', 'かばん');
setImageRef(orig, 'r');
checks.push(['불변성 종합: 전 함수 호출 후에도 원본 완전 동일', JSON.stringify(orig) === snap]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
