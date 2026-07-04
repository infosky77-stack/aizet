// 서버 컴포넌트/라우트 핸들러에서 접속 언어 읽기 — next/headers 의존을 이 파일에 격리.
// 클라이언트에서는 이 파일 대신 hooks/useLocale.ts를 쓴다(같은 resolveLocale 공유).
//
// 주의: 이 함수를 쓰는 페이지는 쿠키/헤더 의존으로 동적 렌더링이 된다 — 상점·교육
// 페이지는 이미 DB 조회로 동적이라 추가 비용이 없지만, 정적으로 남아야 하는 페이지
// (루트 layout 등)에는 쓰지 말 것.

import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from './detect';
import type { Locale } from './types';

export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  );
}
