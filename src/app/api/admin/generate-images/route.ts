import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Pollinations.ai — 인증 없는 무료 FLUX 이미지 생성
// GET https://image.pollinations.ai/prompt/{encoded}?width=…&height=…&model=flux&nologo=true&seed=…
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;
}

async function generateOneImage(prompt: string, seed: number): Promise<Buffer> {
  let lastError: Error = new Error('unknown');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(pollinationsUrl(prompt, seed), { signal: controller.signal });
      clearTimeout(timer);

      // 503 / 429 = 서버 부하 — 대기 후 재시도
      if (res.status === 503 || res.status === 429) {
        const waitMs = 20_000;
        console.log(`[Pollinations] ${res.status} — ${waitMs / 1000}초 대기 후 재시도 (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, waitMs));
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);

    } catch (e) {
      clearTimeout(timer);
      lastError = e instanceof Error ? e : new Error(String(e));
      if (lastError.name === 'AbortError') lastError = new Error(`타임아웃 (${REQUEST_TIMEOUT_MS / 1000}s 초과)`);

      if (attempt < MAX_RETRIES) {
        console.log(`[Pollinations] 오류: ${lastError.message} — 5초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, 5_000));
      }
    }
  }

  throw lastError;
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

  const saveDir = path.join(process.cwd(), 'data', 'site-images', slug);
  if (!existsSync(saveDir)) {
    await mkdir(saveDir, { recursive: true });
  }

  const results: { key: string; label: string; path: string; error?: string }[] = [];

  for (let i = 0; i < template.images.length; i++) {
    const img = template.images[i];
    const prompt = img.prompt.replace('{name}', shopName);
    // seed를 이미지마다 다르게 → 다양한 결과
    const seed = Math.floor(Math.random() * 1_000_000) + i;
    try {
      const buffer = await generateOneImage(prompt, seed);
      const fileName = `${img.key}.jpg`;
      await writeFile(path.join(saveDir, fileName), buffer);
      results.push({ key: img.key, label: img.label, path: `/api/images/${slug}/${fileName}` });
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
