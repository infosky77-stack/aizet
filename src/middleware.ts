import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/admin', '/myspace'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Cookie 존재 여부만 확인 (세션 검증은 API에서 수행)
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
  matcher: ['/admin/:path*', '/myspace/:path*'],
};
