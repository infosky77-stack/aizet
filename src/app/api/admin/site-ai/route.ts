import { NextRequest, NextResponse } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SiteAiRequest {
  industry:  string;          // 업종 (예: '한식당', '한의원', '헤어샵')
  shopName:  string;          // 가게명
  items?:    string[];        // 메뉴 / 상품 목록 (예: '김치찌개 8000원')
  phone?:    string;
  address?:  string;
  hours?:    string;          // 영업시간
  extra?:    string;          // 추가 특이사항
}

function buildPrompt(req: SiteAiRequest): string {
  const { industry, shopName, items = [], phone, address, hours, extra } = req;

  const infoLines: string[] = [
    `업종: ${industry}`,
    `가게명: ${shopName}`,
    phone   ? `전화: ${phone}`     : '',
    address ? `주소: ${address}`   : '',
    hours   ? `영업시간: ${hours}` : '',
    extra   ? `추가사항: ${extra}` : '',
  ].filter(Boolean);

  const itemLines = items.length > 0
    ? '\n메뉴/상품 목록:\n' + items.map((it, i) => `  ${i + 1}. ${it}`).join('\n')
    : '';

  return `당신은 소상공인 홈페이지 카피라이터입니다.
아래 가게 정보를 바탕으로 홈페이지에 넣을 한국어 문구를 작성하세요.

[가게 정보]
${infoLines.join('\n')}${itemLines}

[작성 원칙]
- 과장·허위 없이 자연스럽고 진실되게
- 업종 고유의 톤앤매너 (식당: 맛과 정성, 한의원: 전문성·신뢰, 헤어샵: 트렌드·편안함, 법률: 명료·신뢰 등)
- 방문을 자연스럽게 유도하는 따뜻한 한국어
- 모든 출력은 한국어

[출력 규칙] 아래 JSON 형식만 출력하세요. 서두·설명·마크다운 코드블록 없이 순수 JSON만.
{
  "catchphrase": "한 줄 슬로건 (20자 이내, 감성적이고 기억에 남게)",
  "intro": "가게 소개문 (2~3문장, 따뜻하고 신뢰감 있게, 방문 유도)",
  "itemDescriptions": [
    { "item": "원본 메뉴/상품명 그대로", "desc": "1~2문장 설명" }
  ]
}
메뉴/상품이 없으면 itemDescriptions는 빈 배열 []로 출력.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SiteAiRequest;

    if (!body.shopName?.trim() || !body.industry?.trim()) {
      return NextResponse.json(
        { error: '업종(industry)과 가게명(shopName)은 필수입니다.' },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(body);
    const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);

    // 코드 블록 fence 제거 후 파싱
    let raw = result.response.text().trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    const data = JSON.parse(raw) as {
      catchphrase:      string;
      intro:            string;
      itemDescriptions: { item: string; desc: string }[];
    };

    return NextResponse.json({
      catchphrase:      data.catchphrase      ?? '',
      intro:            data.intro            ?? '',
      itemDescriptions: data.itemDescriptions ?? [],
    });
  } catch (err) {
    console.error('[site-ai]', err);
    return NextResponse.json(
      { error: 'AI 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
