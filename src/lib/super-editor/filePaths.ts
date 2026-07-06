// 슈퍼에디터 실물 파일의 경로 규칙.
//
// siteId(사업장) 축의 새 네임스페이스(data/super-editor-files/sites/<siteId>/)와, 옛 userId
// 축(data/super-editor-files/<userId>/)을 함께 다룬다. siteDir/userDir은 순수 경로 계산만
// 한다(I/O 없음). resolveReadPath/resolveWritePath는 "new(siteId) 우선 / old(userId) 폴백"
// 컷오버를 위해 존재 확인·디렉토리 생성 I/O를 포함한다.
//
// 이 파일은 경로 규칙만 제공한다. 실제 저장/읽기/삭제/서빙 코드가 이 헬퍼를 호출하도록
// 바꾸는 컷오버는 다음 단계에서 하며, 그 전까지 라우트의 로컬 userDir 정의는 그대로 둔다.

import path from 'path';
import fs from 'fs';

// 실물 파일 루트(process.cwd() 기준 상대 세그먼트). userDir과 동일한 베이스를 공유한다.
const FILES_BASE = ['data', 'super-editor-files'] as const;

/**
 * siteId 값 검증 — 빈 값과 경로 조작 문자를 차단해 폴더 탈출('..', '/', '\\')을 원천 방지한다.
 * siteId는 'site-' + hex 형태이므로 영숫자·하이픈·언더스코어만 허용하는 화이트리스트로 충분하다.
 */
function assertSafeSiteId(siteId: string): void {
  if (!siteId || !/^[A-Za-z0-9_-]+$/.test(siteId)) {
    throw new Error(`invalid siteId for file path: ${JSON.stringify(siteId)}`);
  }
}

/**
 * 사업장(siteId) 전용 실물 파일 폴더의 절대경로를 계산한다(경로 계산만, mkdir 등 I/O 없음).
 * 반환: <cwd>/data/super-editor-files/sites/<siteId>
 * 잘못된 siteId(빈 값·경로 조작 문자)면 예외를 던진다.
 */
export function siteDir(siteId: string): string {
  assertSafeSiteId(siteId);
  return path.join(process.cwd(), ...FILES_BASE, 'sites', siteId);
}

/**
 * 경로 세그먼트(userId·filename) 검증 — 빈 값과 경로 조작을 차단한다.
 * userId/filename은 하위 폴더를 만들지 않으므로 separator('/', '\\')와 '..'만 있으면 탈출 위험 →
 * 이 셋을 차단한다(filename의 '.'·확장자는 허용해야 하므로 화이트리스트 대신 블랙리스트 방식).
 */
function assertSafeSegment(seg: string, label: string): void {
  if (!seg || seg.includes('/') || seg.includes('\\') || seg.includes('..')) {
    throw new Error(`invalid ${label} for file path: ${JSON.stringify(seg)}`);
  }
}

/**
 * 옛 userId 축 실물 파일 폴더의 절대경로를 계산한다(경로 계산만, I/O 없음).
 * 반환: <cwd>/data/super-editor-files/<userId>
 * 라우트에 로컬 정의된 userDir과 동일 규칙 — 컷오버 시 이 공용 함수로 수렴시킬 수 있다.
 */
export function userDir(userId: string): string {
  assertSafeSegment(userId, 'userId');
  return path.join(process.cwd(), ...FILES_BASE, userId);
}

/**
 * 읽기·서빙용 경로 리졸버 — new(siteId) 우선, 없으면 old(userId) 폴백.
 *  1) siteId가 있고 siteDir(siteId)/filename 이 실제로 존재하면 그 경로(new) 반환.
 *  2) 아니면 userDir(userId)/filename 이 존재하면 그 경로(old) 반환.
 *  3) 둘 다 없으면 null(호출부가 404 처리).
 * 파일을 만들거나 옮기지 않는다(존재 확인만). siteId가 없으면 곧바로 old만 확인(하위호환).
 */
export function resolveReadPath(userId: string, siteId: string | null | undefined, filename: string): string | null {
  assertSafeSegment(filename, 'filename');
  if (siteId) {
    const newPath = path.join(siteDir(siteId), filename);
    if (fs.existsSync(newPath)) return newPath;
  }
  const oldPath = path.join(userDir(userId), filename);
  if (fs.existsSync(oldPath)) return oldPath;
  return null;
}

/**
 * 저장용 경로 결정 — siteId가 있으면 new(siteDir), 없으면 old(userDir)에 기록한다(하위호환).
 * 대상 디렉토리가 없으면 생성(mkdir recursive)한 뒤 최종 파일 절대경로를 반환한다.
 * 파일 자체는 쓰지 않는다(경로 확정 + 폴더 준비까지) — 호출부가 writeFile을 담당.
 */
export function resolveWritePath(userId: string, siteId: string | null | undefined, filename: string): string {
  assertSafeSegment(filename, 'filename');
  const dir = siteId ? siteDir(siteId) : userDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}
