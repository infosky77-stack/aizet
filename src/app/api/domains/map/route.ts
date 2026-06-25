import { NextResponse } from 'next/server';
import { getDomainMap } from '@/lib/db/domains';

export const dynamic = 'force-dynamic';

// 미들웨어가 30초 간격으로 폴링하는 내부 전용 엔드포인트
// 반환값: { "myrestaurant.com": "demo", "myshop.com": "hancandy", ... }
export async function GET() {
  const map = getDomainMap();
  return NextResponse.json(Object.fromEntries(map));
}
