import { NextRequest, NextResponse } from 'next/server';

// ── AIZET 자체 호스트 (라우팅 분기에서 제외) ────────────────────────────────────
const AIZET_HOSTS = new Set([
  'aizet.co.kr',
  'www.aizet.co.kr',
  'localhost',
  '127.0.0.1',
]);

// ── 보호 경로 (로그인 필요) ─────────────────────────────────────────────────────
const PROTECTED = ['/admin', '/myspace'];

// ── 커스텀 도메인 맵 캐시 (Edge 워커 내 모듈 수준) ──────────────────────────────
// Edge 런타임은 fs 미사용 → /api/domains/map 에서 30초마다 갱신
let domainCache: Record<string, string> = {};
let cacheAt = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function resolveSlug(hostname: string, origin: string): Promise<string | null> {
  if (Date.now() - cacheAt > CACHE_TTL) {
    try {
      const res = await fetch(`${origin}/api/domains/map`, { cache: 'no-store' });
      if (res.ok) {
        domainCache = (await res.json()) as Record<string, string>;
        cacheAt = Date.now();
      }
    } catch {
      // 갱신 실패 시 기존 캐시 유지
    }
  }
  return domainCache[hostname] ?? null;
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const hostname = host.split(':')[0].toLowerCase();

  // ── 커스텀 도메인 라우팅 ────────────────────────────────────────────────────
  if (hostname && !AIZET_HOSTS.has(hostname)) {
    // API·정적 경로는 그대로 통과 (Next.js 내부 경로는 matcher가 이미 제외)
    const { pathname } = req.nextUrl;
    if (pathname.startsWith('/api/')) return NextResponse.next();

    const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const slug = await resolveSlug(hostname, origin);

    if (!slug) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:2rem">
          <h2>도메인이 연결되지 않았습니다</h2>
          <p>${hostname} 은(는) 아직 AIZET 사이트에 연결되지 않았습니다.</p>
        </body></html>`,
        { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } },
      );
    }

    // 루트(/) → /{slug}, 하위 경로 → /{slug}{pathname}
    const newPathname = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`;
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = newPathname;
    return NextResponse.rewrite(rewritten);
  }

  // ── AIZET 도메인: 보호 경로 인증 체크 ─────────────────────────────────────
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = !!req.cookies.get('aizet_session')?.value;
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // 정적 에셋·이미지·아이콘·SW는 미들웨어 제외
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|sw.js|manifest.webmanifest).*)'],
};
