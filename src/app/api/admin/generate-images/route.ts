import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function generateOneImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) return null;

  return Buffer.from(imagePart.inlineData.data, 'base64');
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!user.slug) return NextResponse.json({ error: '먼저 가게 정보를 저장해 주세요.' }, { status: 400 });

  const template = getTemplateForIndustry(user.industry);
  const slug = user.slug;
  const shopName = user.shop_name || '가게';

  const saveDir = path.join(process.cwd(), 'public', 'site-generated', slug);
  if (!existsSync(saveDir)) {
    await mkdir(saveDir, { recursive: true });
  }

  const results: { key: string; label: string; path: string; error?: string }[] = [];

  for (const img of template.images) {
    const prompt = img.prompt.replace('{name}', shopName);
    try {
      const buffer = await generateOneImage(prompt);
      if (buffer) {
        const fileName = `${img.key}.png`;
        await writeFile(path.join(saveDir, fileName), buffer);
        results.push({
          key: img.key,
          label: img.label,
          path: `/site-generated/${slug}/${fileName}`,
        });
      } else {
        results.push({ key: img.key, label: img.label, path: '', error: '이미지 없음' });
      }
    } catch (e) {
      results.push({ key: img.key, label: img.label, path: '', error: String(e) });
    }
  }

  const succeeded = results.filter(r => r.path && !r.error);
  return NextResponse.json({
    ok: true,
    slug,
    total: template.images.length,
    succeeded: succeeded.length,
    results,
  });
}
