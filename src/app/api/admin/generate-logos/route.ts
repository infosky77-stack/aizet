import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/users';
import { getLogoTemplate } from '@/lib/ai/logoTemplates';

export const dynamic    = 'force-dynamic';
export const runtime    = 'nodejs';
export const maxDuration = 300;

const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES        = 2;

const enc = new TextEncoder();
function sse(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function pollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux&nologo=true&seed=${seed}`;
}

async function fetchLogo(prompt: string, seed: number, reqSignal?: AbortSignal): Promise<Buffer> {
  let lastError: Error = new Error('unknown');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (reqSignal?.aborted) throw Object.assign(new Error('Client disconnected'), { name: 'AbortError' });

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    const onAbort = () => ctrl.abort();
    reqSignal?.addEventListener('abort', onAbort, { once: true });

    try {
      const res = await fetch(pollinationsUrl(prompt, seed), { signal: ctrl.signal });
      clearTimeout(timer);
      reqSignal?.removeEventListener('abort', onAbort);

      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, 20_000));
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      clearTimeout(timer);
      reqSignal?.removeEventListener('abort', onAbort);
      lastError = e instanceof Error ? e : new Error(String(e));
      if (lastError.name === 'AbortError') {
        if (reqSignal?.aborted) throw lastError;
        lastError = new Error(`타임아웃 (${REQUEST_TIMEOUT_MS / 1000}s 초과)`);
      }
      if (attempt < MAX_RETRIES) {
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

  const template = getLogoTemplate(user.industry);
  const saveDir  = path.join(process.cwd(), 'data', 'logos', session.sub);

  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try { controller.enqueue(enc.encode(': keepalive\n\n')); } catch { /* closed */ }
      }, 15_000);

      try {
        if (!existsSync(saveDir)) await mkdir(saveDir, { recursive: true });

        controller.enqueue(sse({
          type:   'start',
          styles: template.styles.map(s => ({ key: s.key, label: s.label })),
          total:  template.styles.length,
        }));

        let aborted = false;

        for (let i = 0; i < template.styles.length; i++) {
          if (req.signal.aborted) { aborted = true; break; }

          const style  = template.styles[i];
          const seed   = Math.floor(Math.random() * 1_000_000) + i;

          controller.enqueue(sse({
            type: 'progress', key: style.key, label: style.label,
            status: 'generating', index: i, total: template.styles.length,
          }));

          try {
            const buffer   = await fetchLogo(style.prompt, seed, req.signal);
            const fileName = `${style.key}.jpg`;
            await writeFile(path.join(saveDir, fileName), buffer);

            controller.enqueue(sse({
              type: 'progress', key: style.key, label: style.label,
              status: 'done', index: i, total: template.styles.length,
              url: `/api/admin/logos/${session.sub}/${fileName}`,
            }));
          } catch (e) {
            if ((e as { name?: string })?.name === 'AbortError') { aborted = true; break; }
            controller.enqueue(sse({
              type: 'progress', key: style.key, label: style.label,
              status: 'error', index: i, total: template.styles.length,
              error: e instanceof Error ? e.message : String(e),
            }));
          }
        }

        try {
          controller.enqueue(sse({
            type: 'complete', aborted,
            total: template.styles.length,
          }));
        } catch { /* client gone */ }
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':    'text/event-stream',
      'Cache-Control':   'no-cache',
      'Connection':      'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
