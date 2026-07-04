// 세션 임시 발급 — 서버 전용 모듈(sessions 테이블 직접 접근).
//
// 로컬 에이전트(대표 PC)판에서는 이 모듈 전체가 실로그인 구현으로 교체된다.
// publish-education.mjs의 getAuthCookie() 인터페이스({ cookie, dispose })만 유지하면
// agent-core.mjs는 수정 없이 그대로 재사용된다.
//
// 3중 안전장치(프로덕션 오염 0):
//   1) 호출부 try/finally에서 dispose() — 어떤 실패 경로에서도 삭제가 실행된다
//   2) TTL 기본 10분 — dispose마저 못 돌아도(프로세스 kill 등) 만료 세션은
//      auth.ts(getSessionFromRequest)가 읽는 즉시 DB에서 지우므로 영구 잔류 경로가 없다
//   3) 발급한 id 하나만 표적 삭제(DELETE WHERE id = ?) — 같은 계정의 실로그인 세션 미접촉
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export const COOKIE_NAME = 'aizet_session';

/**
 * sessions에 임시 세션 1행을 삽입하고 표적 삭제 함수를 돌려준다.
 * DB 스키마는 앱(src/lib/db.ts)이 소유 — 이 모듈은 테이블을 만들지 않으므로
 * 호출 전에 앱 인스턴스가 한 번은 DB를 초기화한 상태여야 한다(publish-education.mjs의 warmup).
 */
export function issueSession({ dbPath, sub, email, name, ttlMs = 10 * 60_000 }) {
  const db = new Database(dbPath);
  const id = randomUUID();
  const now = Date.now();
  try {
    db.prepare(`
      INSERT INTO sessions (id, sub, email, name, picture, accessToken, refreshToken, expiresAt, plan, industry, createdAt)
      VALUES (?, ?, ?, ?, '', 'aizet-agent', NULL, ?, 'free', '', ?)
    `).run(id, sub, email, name, now + ttlMs, now);
  } catch (e) {
    db.close();
    throw e;
  }

  let disposed = false;
  return {
    sessionId: id,
    /** 발급한 세션 1행만 삭제하고 DB 핸들을 닫는다. 몇 번 불려도 안전. */
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        const { changes } = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
        console.log(`[session] 임시 세션 삭제 (${changes}행) id=${id.slice(0, 8)}…`);
      } finally {
        db.close();
      }
    },
  };
}
