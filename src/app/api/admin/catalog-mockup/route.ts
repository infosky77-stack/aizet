import { NextRequest, NextResponse } from 'next/server';
import { gemini } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

function pollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=896&model=flux&nologo=true&seed=${seed}`;
}

export async function POST(req: NextRequest) {
  try {
    const { title, year, medium, size, artistName } = await req.json();
    if (!title) {
      return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 });
    }

    const artworkDesc: string[] = [`"${title}"`];
    if (medium)     artworkDesc.push(medium);
    if (size)       artworkDesc.push(size);
    if (year)       artworkDesc.push(year);
    if (artistName) artworkDesc.push(`by ${artistName}`);

    const geminiPrompt = `Write a concise English image prompt (under 80 words, plain text only, no quotes) for a photorealistic mockup of a luxury fine-art catalog / photo book. The book features the artwork ${artworkDesc.join(', ')}. Scene: elegant open hardcover art book resting on a marble surface, printed artwork visible on glossy pages, soft gallery lighting, subtle shadows, realistic premium paper texture, high-end fine art publication feel. Photorealistic product mockup style.`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(geminiPrompt);
    const imagePrompt = result.response.text().trim().replace(/^["'\n]+|["'\n]+$/g, '');

    const seed = Math.floor(Math.random() * 999_999) + 1;
    const imageUrl = pollinationsUrl(imagePrompt, seed);

    return NextResponse.json({ imageUrl, prompt: imagePrompt });
  } catch (err) {
    console.error('[catalog-mockup]', err);
    return NextResponse.json({ error: '목업 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
