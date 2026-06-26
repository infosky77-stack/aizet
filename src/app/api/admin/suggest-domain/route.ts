import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { gemini } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RDAP_TIMEOUT_MS = 3000;

async function checkDomainAvailability(domain: string): Promise<boolean | null> {
  let rdapUrl: string;
  if (domain.endsWith('.co.kr') || domain.endsWith('.kr')) {
    rdapUrl = `https://rdap.krnic.or.kr/rdap/domain/${domain}`;
  } else if (domain.endsWith('.com')) {
    rdapUrl = `https://rdap.verisign.com/com/v1/domain/${domain}`;
  } else {
    rdapUrl = `https://rdap.org/domain/${domain}`;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);
    const res = await fetch(rdapUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 404) return true;  // 미등록 = 사용 가능
    if (res.status === 200) return false; // 등록됨 = 사용 중
    return null;
  } catch {
    return null; // 타임아웃 또는 네트워크 오류
  }
}

const INDUSTRY_LABEL: Record<string, string> = {
  restaurant: '음식점', cafe: '카페', beauty: '미용실',
  fitness: '헬스/피트니스', retail: '소매점', consulting: '컨설팅',
};

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { shopName?: string; industry?: string };
  const shopName = body.shopName?.trim() || '가게';
  const industry = body.industry?.trim() || '';
  const industryName = INDUSTRY_LABEL[industry] || industry || '업체';

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `가게명 '${shopName}', 업종 '${industryName}'에 맞는 .co.kr 도메인 이름 후보 3개를 추천해줘.\n` +
      `조건:\n` +
      `- 영문 소문자와 하이픈(-)만 사용, 3~20자\n` +
      `- 첫 번째: 한글 발음을 영문으로 음역 (예: mr-china, bluming-hair)\n` +
      `- 두 번째: 의미를 영어로 번역 (예: golden-house, fresh-taste)\n` +
      `- 세 번째: 창의적 조합 (예: taste-kr, seoul-bite)\n` +
      `- JSON 배열로만 반환, 다른 텍스트 없이: ["name1", "name2", "name3"]`
    );

    let names: string[] = [];
    try {
      const text = result.response.text().trim();
      const match = text.match(/\[[\s\S]*?\]/);
      names = match ? JSON.parse(match[0]) : JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    names = names
      .filter((n): n is string => typeof n === 'string')
      .map(n => n.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, ''))
      .filter(n => n.length >= 3)
      .slice(0, 3);

    const domains = await Promise.all(
      names.map(async (name) => {
        const full = `${name}.co.kr`;
        const available = await checkDomainAvailability(full);
        return { name, full, available };
      })
    );

    return NextResponse.json({ domains });
  } catch (e) {
    console.error('[suggest-domain]', e);
    return NextResponse.json({ error: '도메인 추천 생성 실패' }, { status: 500 });
  }
}
