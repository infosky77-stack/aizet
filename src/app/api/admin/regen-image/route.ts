import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, getRegenCount, incrementRegenCount } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const REGEN_LIMIT = 3;
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

const enc = new TextEncoder();
function sse(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function pollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;
}

async function generateOneImage(prompt: string, seed: number): Promise<Buffer> {
  let lastError: Error = new Error('unknown');
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(pollinationsUrl(prompt, seed), { signal: controller.signal });
      clearTimeout(timer);
      if (res.status === 503 || res.status === 429) {
        console.log(`[Pollinations] ${res.status} — 20s 대기 후 재시도`);
        await new Promise(r => setTimeout(r, 20_000));
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      clearTimeout(timer);
      lastError = e instanceof Error ? e : new Error(String(e));
      if (lastError.name === 'AbortError') lastError = new Error(`타임아웃 (${REQUEST_TIMEOUT_MS / 1000}s 초과)`);
      if (attempt < MAX_RETRIES) {
        console.log(`[Pollinations] 오류: ${lastError.message} — 5s 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
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

  const currentCount = getRegenCount(user.id);
  if (currentCount >= REGEN_LIMIT) {
    return NextResponse.json({ error: '재생성 한도(3회)를 초과했습니다.' }, { status: 403 });
  }

  const body = await req.json() as { imageKey?: string };
  const imageKey = body.imageKey?.trim();
  if (!imageKey) return NextResponse.json({ error: 'imageKey가 필요합니다.' }, { status: 400 });

  const template = getTemplateForIndustry(user.industry);
  const imgTemplate = template.images.find(img => img.key === imageKey);
  if (!imgTemplate) return NextResponse.json({ error: '유효하지 않은 이미지 키입니다.' }, { status: 400 });

  const slug = user.slug;
  const shopName = user.shop_name || '가게';
  const saveDir = path.join(process.cwd(), 'data', 'site-images', slug);

  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try { controller.enqueue(enc.encode(': keepalive\n\n')); } catch { /* stream closed */ }
      }, 15_000);

      try {
        if (!existsSync(saveDir)) await mkdir(saveDir, { recursive: true });

        controller.enqueue(sse({ type: 'generating', key: imageKey, label: imgTemplate.label }));

        const prompt = imgTemplate.prompt.replace('{name}', shopName);
        const seed = Math.floor(Math.random() * 1_000_000);

        try {
          const buffer = await generateOneImage(prompt, seed);
          const fileName = `${imageKey}.jpg`;
          await writeFile(path.join(saveDir, fileName), buffer);

          const newCount = incrementRegenCount(user.id);
          const ts = Date.now();

          controller.enqueue(sse({
            type: 'done',
            key: imageKey,
            url: `/api/images/${slug}/${fileName}?v=${ts}`,
            newRegenCount: newCount,
          }));
        } catch (e) {
          controller.enqueue(sse({
            type: 'error',
            key: imageKey,
            error: e instanceof Error ? e.message : String(e),
          }));
        }
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
