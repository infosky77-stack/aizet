import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { gemini } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { menuName?: string; shopName?: string; industry?: string };
  const menuName = body.menuName?.trim();
  if (!menuName) return NextResponse.json({ error: 'menuName이 필요합니다.' }, { status: 400 });

  const shopName = body.shopName?.trim() || '가게';
  const industry = body.industry?.trim() || '';

  const industryLabel: Record<string, string> = {
    restaurant: '음식점', cafe: '카페', beauty: '미용실',
    fitness: '헬스/피트니스', retail: '소매점', consulting: '컨설팅',
  };
  const industryName = industryLabel[industry] || industry || '업체';

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `가게명: ${shopName} (업종: ${industryName})\n메뉴명: ${menuName}\n\n위 메뉴에 대한 한 줄 설명을 한국어로 작성해주세요. 50자 이내, 맛있고 매력적으로, 설명만 출력.`
    );
    const description = result.response.text().trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({ description });
  } catch (e) {
    console.error('[generate-description]', e);
    return NextResponse.json({ error: 'AI 설명 생성 실패' }, { status: 500 });
  }
}
