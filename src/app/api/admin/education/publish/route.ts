// 교육 콘텐츠 게시 — 브라우저가 만든 산출물(mp4·카드 PNG)을 공개 디렉토리에 보관하고
// 삽화는 원장에서 사본을 뜬다. 상세페이지 publish와 같은 원칙: 서버는 "생성"하지 않고
// 완성 파일을 저장만 한다(렌더는 전부 회원 브라우저).
//
// 공개/비공개 경계가 이 라우트의 존재 이유: 파일 원장(소유자 인증 서빙)의 파일은
// 학습자에게 직접 노출하지 않고, 게시 시점에 data/learn-public/<episodeNo>/로 사본을
// 만들어 공개 라우트(/api/learn-public)로만 서빙한다. episode.json(게시 계약)에는
// 원장 개념이 존재하지 않는다. 재게시하면 회차 디렉토리를 통째로 갈아끼운다.

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, copyFile, readdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getFile } from '@/lib/db/super-editor-files';
import { isEducationSnapshot } from '@/lib/super-editor/education/types';
import { toPublishedEpisode } from '@/lib/super-editor/education/published';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PUBLIC_BASE = path.join(process.cwd(), 'data', 'learn-public');
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // WebCodecs mp4 — 여유 상한
const MAX_CARD_SIZE  = 5 * 1024 * 1024;
const IMG_EXT: Record<string, boolean> = { jpg: true, jpeg: true, png: true, webp: true, gif: true };

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();

  let snapshot: unknown;
  try { snapshot = JSON.parse(String(formData.get('snapshot') ?? '')); }
  catch { return NextResponse.json({ error: 'snapshot JSON이 필요합니다' }, { status: 400 }); }
  if (!isEducationSnapshot(snapshot)) {
    return NextResponse.json({ error: '유효한 education 스냅샷이 아닙니다' }, { status: 400 });
  }
  if (!Number.isInteger(snapshot.episodeNo) || snapshot.episodeNo < 1 || snapshot.episodeNo > 9999) {
    return NextResponse.json({ error: 'episodeNo가 유효하지 않습니다(1~9999)' }, { status: 400 });
  }

  const video = formData.get('video') as File | null;
  if (video && video.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: '영상이 너무 큽니다(최대 100MB)' }, { status: 413 });
  }
  const cards = formData.getAll('cards') as File[];
  if (cards.some((c) => c.size > MAX_CARD_SIZE)) {
    return NextResponse.json({ error: '카드 이미지가 너무 큽니다(장당 최대 5MB)' }, { status: 413 });
  }

  const episodeDir = path.join(PUBLIC_BASE, String(snapshot.episodeNo));
  await mkdir(episodeDir, { recursive: true });
  // 재게시 = 회차 사본 전체 교체 — 이전 게시의 잔여 파일이 남지 않게 비운다
  for (const f of await readdir(episodeDir)) await unlink(path.join(episodeDir, f));

  const now = Date.now();
  const publicUrl = (name: string) => `/api/learn-public/${snapshot.episodeNo}/${name}?v=${now}`;
  const warnings: string[] = [];

  // 1) 영상 mp4 (브라우저 WebCodecs 산출물 그대로 보관)
  let videoUrl: string | null = null;
  if (video) {
    await writeFile(path.join(episodeDir, 'video.mp4'), Buffer.from(await video.arrayBuffer()));
    videoUrl = publicUrl('video.mp4');
  } else {
    warnings.push('영상 없이 게시되었습니다 — 학습 화면에는 이북만 표시됩니다');
  }

  // 2) 카드 PNG들 (포함 유닛 순서)
  const cardUrls: string[] = [];
  for (const [i, card] of cards.entries()) {
    const name = `card-${i + 1}.png`;
    await writeFile(path.join(episodeDir, name), Buffer.from(await card.arrayBuffer()));
    cardUrls.push(publicUrl(name));
  }

  // 3) 삽화 사본 — 회원 원장 파일을 공개 디렉토리로 복사(소유자 검증 필수)
  const illustrationUrls: Record<string, string> = {};
  for (const [i, unit] of snapshot.units.entries()) {
    if (!unit.illustrationRef) continue;
    const record = getFile(unit.illustrationRef);
    if (!record || record.user_id !== session.sub) {
      warnings.push(`${unit.char || i + 1} 유닛 삽화가 원장에 없어 글자만 게시됩니다`);
      continue;
    }
    const ext = (record.filename.split('.').pop() ?? '').toLowerCase();
    if (!IMG_EXT[ext]) {
      warnings.push(`${unit.char || i + 1} 유닛 삽화 형식(${ext})은 게시할 수 없습니다`);
      continue;
    }
    const src = path.join(process.cwd(), 'data', 'super-editor-files', session.sub, record.filename);
    if (!existsSync(src)) {
      warnings.push(`${unit.char || i + 1} 유닛 삽화 원본 파일을 찾지 못해 글자만 게시됩니다`);
      continue;
    }
    const name = `illust-${i + 1}.${ext}`;
    await copyFile(src, path.join(episodeDir, name));
    illustrationUrls[unit.id] = publicUrl(name);
  }

  // 4) 게시 계약 JSON — 무엇이 공개되는가는 순수 로직(published.ts)이 결정
  const episode = toPublishedEpisode(snapshot, { videoUrl, cardUrls, illustrationUrls }, new Date(now).toISOString());
  await writeFile(path.join(episodeDir, 'episode.json'), JSON.stringify(episode));

  return NextResponse.json({ ok: true, learnPath: `/learn/korean/${snapshot.episodeNo}`, warnings });
}
