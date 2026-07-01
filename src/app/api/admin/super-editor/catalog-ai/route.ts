import { NextRequest, NextResponse } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { title, year, medium, size, artistName } = await req.json();

    if (!title) {
      return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 });
    }

    const parts: string[] = [];
    if (title)      parts.push(`작품명: ${title}`);
    if (medium)     parts.push(`재료: ${medium}`);
    if (size)       parts.push(`크기: ${size}`);
    if (year)       parts.push(`제작연도: ${year}`);
    if (artistName) parts.push(`작가: ${artistName}`);

    const prompt = `${parts.join(', ')}
위 작품에 대한 갤러리 도록용 작품 설명을 한국어로 작성하세요.
- 100~150자, 격조 있는 문어체, 과도한 수식 없이
- 설명 텍스트만 출력, 따옴표·서두 없이`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const description = result.response.text().trim().replace(/^["']|["']$/g, '');

    return NextResponse.json({ description });
  } catch (err) {
    console.error('[catalog-ai]', err);
    return NextResponse.json({ error: 'AI 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
