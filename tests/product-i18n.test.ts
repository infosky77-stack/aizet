// 섹션 번역 순수 로직 테스트 — draft/reviewed 전이 · 원문 수정 강등 · 표시 폴백 · 게시 운반
import {
  TRANSLATION_LOCALES, translationStatus, setTranslation, markReviewed, demoteTranslations,
  resolveSectionText, pruneSectionI18n,
} from '../src/lib/super-editor/product/i18n';
import { newProductSection } from '../src/lib/super-editor/product/types';
import { toPublishedDetail } from '../src/lib/super-editor/product/published';
import { emptyProductDetail } from '../src/lib/super-editor/product/types';

const checks: [string, boolean][] = [];

// ── 상태 전이: 입력은 draft, reviewed는 markReviewed로만 ────────────────────
const base = newProductSection('headline', { text: '수제 딸기잼', subText: '과육 그대로' });
checks.push(['번역 언어 4종(ko 제외)', TRANSLATION_LOCALES.length === 4 && !TRANSLATION_LOCALES.includes('ko' as never)]);
checks.push(['번역 없으면 none', translationStatus(base, 'en') === 'none']);

const drafted = setTranslation(base, 'en', { text: 'Homemade Strawberry Jam' });
checks.push(['입력하면 draft', translationStatus(drafted, 'en') === 'draft']);
checks.push(['원본 섹션 불변(immutable)', translationStatus(base, 'en') === 'none']);

const reviewed = markReviewed(drafted, 'en');
checks.push(['검수 버튼으로만 reviewed', translationStatus(reviewed, 'en') === 'reviewed']);
checks.push(['빈 번역은 검수 불가', translationStatus(markReviewed(base, 'en'), 'en') === 'none']);

const editedAfterReview = setTranslation(reviewed, 'en', { text: 'Artisan Strawberry Jam' });
checks.push(['검수 후 내용 수정 → draft 복귀', translationStatus(editedAfterReview, 'en') === 'draft']);

// ── 원문 수정 → 전 언어 draft 강등 ──────────────────────────────────────────
const multi = markReviewed(setTranslation(reviewed, 'ja', { text: '手作りいちごジャム' }), 'ja');
const demoted = demoteTranslations({ ...multi, text: '수제 딸기잼 500g' });
checks.push(['원문 수정 시 en·ja 모두 draft 강등',
  translationStatus(demoted, 'en') === 'draft' && translationStatus(demoted, 'ja') === 'draft']);
checks.push(['강등돼도 번역 내용은 보존', demoted.i18n?.en?.text === 'Homemade Strawberry Jam']);

// ── 표시 해석: 필드 단위 폴백 ───────────────────────────────────────────────
checks.push(['ko는 항상 원문', resolveSectionText(reviewed, 'ko').text === '수제 딸기잼']);
checks.push(['번역 있으면 번역', resolveSectionText(reviewed, 'en').text === 'Homemade Strawberry Jam']);
checks.push(['번역 빈 필드는 원문 폴백(subText 미번역)', resolveSectionText(reviewed, 'en').subText === '과육 그대로']);
checks.push(['번역 없는 언어는 원문 그대로', resolveSectionText(reviewed, 'vi').text === '수제 딸기잼']);

const feat = newProductSection('features', {
  items: [{ title: '국내산', body: '밀양산' }, { title: '무향료', body: '본연의 향' }],
});
const featTr = setTranslation(feat, 'en', { items: [{ title: 'Domestic', body: '' }] });
const resolvedItems = resolveSectionText(featTr, 'en').items;
checks.push(['features 항목 인덱스 대응 + 빈 값 원문 폴백',
  resolvedItems[0].title === 'Domestic' && resolvedItems[0].body === '밀양산']);
checks.push(['번역 항목이 모자라면 해당 원문 항목', resolvedItems[1].title === '무향료']);

// ── 게시 운반: 내용 있는 번역만 published JSON에 실림 ───────────────────────
const snap = emptyProductDetail('상품');
snap.sections = [
  setTranslation(
    newProductSection('text', { text: '한국어 설명' }), 'en', { text: 'English description' },
  ),
  setTranslation(newProductSection('headline', { text: '제목' }), 'ja', { text: '' }), // 빈 번역
];
const { detail } = toPublishedDetail(snap, {});
checks.push(['게시본이 번역을 운반', detail.sections[0].i18n?.en?.text === 'English description']);
checks.push(['빈 번역은 게시본에서 제거', detail.sections[1].i18n === undefined]);
checks.push(['pruneSectionI18n: 전부 비면 undefined', pruneSectionI18n({ en: { text: ' ', subText: '', items: [], status: 'draft' } }) === undefined]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
