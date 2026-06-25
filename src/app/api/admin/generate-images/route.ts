import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

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

  const template = getTemplateForIndustry(user.industry);
  const slug = user.slug;
  const shopName = user.shop_name || '가게';
  const saveDir = path.join(process.cwd(), 'data', 'site-images', slug);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!existsSync(saveDir)) await mkdir(saveDir, { recursive: true });

        // 1. 전체 목록 전송
        controller.enqueue(sse({
          type: 'start',
          images: template.images.map(img => ({ key: img.key, label: img.label })),
          total: template.images.length,
        }));

        let succeeded = 0;

        for (let i = 0; i < template.images.length; i++) {
          const img = template.images[i];
          const prompt = img.prompt.replace('{name}', shopName);
          const seed = Math.floor(Math.random() * 1_000_000) + i;

          // 2. 생성 시작 알림
          controller.enqueue(sse({
            type: 'progress', key: img.key, label: img.label,
            status: 'generating', index: i, total: template.images.length,
          }));

          try {
            const buffer = await generateOneImage(prompt, seed);
            const fileName = `${img.key}.jpg`;
            await writeFile(path.join(saveDir, fileName), buffer);
            succeeded++;

            // 3. 완료 알림
            controller.enqueue(sse({
              type: 'progress', key: img.key, label: img.label,
              status: 'done', index: i, total: template.images.length,
              path: `/api/images/${slug}/${fileName}`,
            }));
          } catch (e) {
            // 4. 실패 알림 — 나머지 계속 진행
            controller.enqueue(sse({
              type: 'progress', key: img.key, label: img.label,
              status: 'error', index: i, total: template.images.length,
              error: e instanceof Error ? e.message : String(e),
            }));
          }
        }

        // 5. 전체 완료
        controller.enqueue(sse({ type: 'complete', succeeded, total: template.images.length }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
