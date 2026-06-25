import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, getDriveFolderId, updateDriveFolderId } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder } from '@/lib/drive-folder';
import { uploadSiteImageToDrive } from '@/lib/drive-upload';

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

/** 이미지 생성 완료 후 Drive에 비공개 백업. 실패해도 예외 전파 안 함. */
async function backupToDrive(
  session: Awaited<ReturnType<typeof getSessionFromRequest>>,
  userId: string,
  saveDir: string,
  succeededKeys: string[],
): Promise<string | null> {
  if (!session) return null;
  if (succeededKeys.length === 0) return null;

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session);
  } catch (e) {
    console.warn('[Drive] 토큰 갱신 실패 — 백업 생략:', e instanceof Error ? e.message : e);
    return null;
  }

  // AIZET 폴더 ID: DB 캐시 우선, 없으면 Drive에서 조회/생성
  let folderId = getDriveFolderId(userId);
  if (!folderId) {
    try {
      folderId = await ensureAizetFolder(accessToken);
      updateDriveFolderId(userId, folderId);
    } catch (e) {
      console.warn('[Drive] 폴더 생성 실패 — 백업 생략:', e instanceof Error ? e.message : e);
      return null;
    }
  }

  // 성공한 이미지들 순차 업로드 (개별 실패 시 skip)
  let folderWebViewLink: string | null = null;
  for (const key of succeededKeys) {
    const filename = `${key}.jpg`;
    const filePath = path.join(saveDir, filename);
    try {
      const buffer = await readFile(filePath);
      const result = await uploadSiteImageToDrive(accessToken, folderId, filename, buffer);
      // webViewLink는 파일 링크이므로 폴더 링크로 변환
      if (!folderWebViewLink) {
        folderWebViewLink = `https://drive.google.com/drive/folders/${folderId}`;
      }
      console.log(`[Drive] 업로드 완료: ${filename} → ${result.id}`);
    } catch (e) {
      console.warn(`[Drive] ${filename} 업로드 실패 (skip):`, e instanceof Error ? e.message : e);
    }
  }

  return folderWebViewLink;
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
        const succeededKeys: string[] = [];

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
            succeededKeys.push(img.key);

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

        // 5. Drive 백업 (실패해도 complete 이벤트는 반드시 전송)
        const driveWebViewLink = await backupToDrive(session, user.id, saveDir, succeededKeys);

        // 6. 전체 완료
        controller.enqueue(sse({
          type: 'complete',
          succeeded,
          total: template.images.length,
          driveWebViewLink,
        }));
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
