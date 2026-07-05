// 뜻 이미지 프롬프트 템플릿(순수) 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { buildImagePrompt } from './imagePromptTemplate';
import { newAssemblyUnit } from './types';

const checks: [string, boolean][] = [];

const taxi = buildImagePrompt(newAssemblyUnit({ resultKo: '택시' }));
checks.push(['resultKo가 프롬프트에 삽입됨', taxi.includes('"택시"')]);
checks.push(['"글자 없음" 규칙 문구 포함(한글 깨짐 방지)', taxi.includes('문자·글자·로고 전혀 없음')]);
checks.push(['실사·흰 배경 지시 포함', taxi.includes('실사 사진 스타일') && taxi.includes('흰색 단색 배경')]);

// 공백 트림 후 삽입
checks.push(['앞뒤 공백은 트림해 삽입', buildImagePrompt(newAssemblyUnit({ resultKo: '  가방 ' })).includes('"가방"')]);

// 빈/공백 입력 → 빈 문자열
checks.push(['빈 resultKo → 빈 문자열', buildImagePrompt(newAssemblyUnit({ resultKo: '' })) === ''
  && buildImagePrompt(newAssemblyUnit({ resultKo: '   ' })) === '']);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
