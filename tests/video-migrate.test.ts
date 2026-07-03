import { migrateVideoSnapshot, toLegacyFields } from '../src/lib/super-editor/video/migrate';

const legacy = {
  title: '옛 영상', duration_sec: 12, bgm: 'none',
  canvas: { blocks: [
    { id: 'a', type: 'image', content: '/api/super-editor-files/u1/img1.jpg' },
    { id: 'b', type: 'text',  content: '안녕하세요' },
    { id: 'c', type: 'text',  content: '   ' },
  ] },
};
const migrated = migrateVideoSnapshot(legacy, '폴백제목');
const checks: [string, boolean][] = [
  ['구형 블록 3개(빈 텍스트 제외) → 장면 2개', migrated.scenes.length === 2],
  ['duration_sec 12초/2장면 → 장면당 6초 환산', migrated.scenes[0].durationSec === 6],
  ['이미지 URL이 srcUrl로 보존', migrated.scenes[0].srcUrl === '/api/super-editor-files/u1/img1.jpg'],
  ['version 2 스냅샷은 그대로 통과(참조 동일)', migrateVideoSnapshot(migrated, 'x') === migrated],
];
const project = { ...migrated, scenes: [
  ...migrated.scenes,
  { id: 's3', kind: 'clip' as const, ledgerRef: 'e1', srcUrl: null, text: '', durationSec: null, transition: 'cut' as const },
  { id: 's4', kind: 'image' as const, ledgerRef: 'e2', srcUrl: null, text: '', durationSec: 4, transition: 'fade' as const },
]};
const legacyOut = toLegacyFields(project, (s) => s.ledgerRef === 'e2' ? '/u1/img2.jpg' : s.srcUrl);
checks.push(['legacy 파생 시 클립 제외(블록 3개)', legacyOut.canvas.blocks.length === 3]);
checks.push(['legacy duration 합계 16초(6+6+4)', legacyOut.duration_sec === 16]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
process.exit(failed === 0 ? 0 : 1);
