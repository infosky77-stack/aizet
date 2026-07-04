// AIZET 에이전트 프로토타입 1호 — "3분 한국어" 학습화면 게시 CLI.
//
//   리허설(격리 3555 + 테스트 계정):  npm run agent:publish-edu -- --mode rehearsal
//   프로드(3000 + 대표 계정):        npm run agent:publish-edu -- --mode prod --yes
//
// 쓰기 범위(오염 0 원칙): 세션 1행(종료 시 표적 삭제) + education 폴더/콘텐츠 행 +
// data/learn-public/<회차>/ — 전부 게시의 의도된 산출물. 그 외 테이블·파일 미접촉.
// 프로드 모드는 실행 전 DB 백업본을 tmp/에 만든다.
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { issueSession, COOKIE_NAME } from './session.server.mjs';
import { runPublishTask } from './agent-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── 인자 파싱 ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const mode = opt('mode', null);
const episode = Number(opt('episode', '1'));

const MODES = {
  // 격리 인스턴스: tmp/agent-rehearsal을 cwd로 next start —p 3555 (DB·learn-public 모두 격리)
  rehearsal: {
    baseUrl: 'http://localhost:3555',
    dataRoot: path.join(ROOT, 'tmp', 'agent-rehearsal', 'data'),
    account: { sub: 'agent-edu-rehearsal', email: 'edu-agent@aizet.test', name: '교육 에이전트 리허설' },
  },
  // 프로드: PM2 aizet(3000) + 대표 계정 — --yes 없이는 절대 진행하지 않는다
  prod: {
    baseUrl: 'http://localhost:3000',
    dataRoot: path.join(ROOT, 'data'),
    account: { sub: '112873040654574135275', email: 'infosky77@gmail.com', name: 'AIZET' },
  },
};

if (!MODES[mode]) {
  console.error('사용법: publish-education.mjs --mode rehearsal|prod [--episode 1] [--yes(prod 필수)]');
  process.exit(2);
}
const cfg = MODES[mode];
if (mode === 'prod' && !flag('yes')) {
  console.error('프로드 모드는 --yes 플래그가 필요합니다(대표 계정 세션 발급 + 실데이터 게시).');
  process.exit(2);
}

// ── 프로드 안전망: 실행 전 DB 백업 ──────────────────────────────────────────
// DB가 WAL 모드라 단순 파일 복사는 -wal에 쌓인 최신 변경이 빠진 옛 스냅샷이 된다.
// VACUUM INTO는 WAL 내용까지 포함한 일관 스냅샷을 만들며 운영 중 실행해도 안전하다.
const dbPath = path.join(cfg.dataRoot, 'aizet.db');
if (mode === 'prod') {
  const backup = path.join(ROOT, 'tmp', `aizet-db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  mkdirSync(path.dirname(backup), { recursive: true });
  const src = new Database(dbPath, { readonly: true });
  try { src.exec(`VACUUM INTO '${backup.replace(/'/g, "''")}'`); }
  finally { src.close(); }
  console.log(`[safety] DB 백업(VACUUM INTO, WAL 포함): ${backup}`);
}

// ── warmup: 앱이 DB 스키마를 초기화하게 만든다(세션 삽입 전 필수) ────────────
// nodejs 라우트가 로드되며 src/lib/db.ts가 실행 → 테이블 자동 생성. 응답 코드는 무관.
const warmup = await fetch(`${cfg.baseUrl}/api/admin/super-editor`, { redirect: 'manual' }).catch(() => null);
if (!warmup) {
  console.error(`[fail] ${cfg.baseUrl} 응답 없음 — 인스턴스가 떠 있는지 확인하세요.`);
  process.exit(1);
}
if (!existsSync(dbPath)) {
  console.error(`[fail] warmup 후에도 DB가 없습니다: ${dbPath} — 인스턴스 cwd가 다른 곳을 보고 있습니다.`);
  process.exit(1);
}

// ── getAuthCookie(): 로컬 에이전트 확장 시 이 함수만 교체한다 ────────────────
// 서버판: DB 직접 발급(session.server.mjs). 대표 PC판: 에이전트 창 실로그인으로 얻은
// 쿠키를 돌려주도록 구현을 갈아끼우면 아래 본체는 그대로 동작한다.
async function getAuthCookie() {
  const s = issueSession({ dbPath, ...cfg.account });
  console.log(`[session] 임시 세션 발급(TTL 10분) sub=${cfg.account.sub} id=${s.sessionId.slice(0, 8)}…`);
  return { cookie: { name: COOKIE_NAME, value: s.sessionId }, dispose: () => s.dispose() };
}

// ── 본체 ────────────────────────────────────────────────────────────────────
const auth = await getAuthCookie();
process.on('SIGINT', () => { auth.dispose(); process.exit(130); });
process.on('SIGTERM', () => { auth.dispose(); process.exit(143); });

let report = null;
try {
  report = await runPublishTask({
    baseUrl: cfg.baseUrl,
    cookie: auth.cookie,
    episode,
    failShotPath: path.join(ROOT, 'tmp', `agent-publish-fail-${mode}.png`),
  });
} finally {
  auth.dispose(); // 3중 안전장치 1: 어떤 실패에도 표적 삭제 (2: TTL, 3: id 단건)
}

// ── 결과 보고: 게시 산출물 파일 목록 + 경고 ─────────────────────────────────
const epDir = path.join(cfg.dataRoot, 'learn-public', String(episode));
const files = existsSync(epDir)
  ? readdirSync(epDir).map((f) => `${f} (${Math.round(statSync(path.join(epDir, f)).size / 1024)}KB)`)
  : [];

console.log('\n===== 게시 결과 =====');
console.log(`mode=${mode} episode=${episode} → ${report.learnPath}`);
console.log(`publish HTTP ${report.publishStatus}, 공개 검증:`, report.publicCheck);
console.log(`산출물(${epDir}):`);
for (const f of files) console.log(`  - ${f}`);
if (report.warnings.length) {
  console.log('warnings:');
  for (const w of report.warnings) console.log(`  ! ${w}`);
}
const ok = report.publicCheck.status === 200 && files.some((f) => f.startsWith('episode.json'));
console.log(ok ? '\nPASS — 게시·공개 검증 완료' : '\nFAIL — 산출물/검증 확인 필요');
process.exit(ok ? 0 : 1);
