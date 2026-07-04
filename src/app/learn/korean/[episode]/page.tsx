// 학습 화면(공개) — 게시된 회차의 episode.json(게시 계약)만 읽는다. 원장/DB의 비공개
// 데이터는 여기서 접근하지 않는다(공개/비공개 경계 — shop-public 사본과 동일 원칙).
// 열람 언어는 쿠키/헤더로 해석(getRequestLocale — 쇼핑몰 구매자 뷰와 동일 방식).

import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/i18n/server';
import { isPublishedEducationEpisode } from '@/lib/super-editor/education/published';
import { LearnEpisodeView } from '@/components/education/LearnEpisodeView';

export const dynamic = 'force-dynamic';

async function loadEpisode(episode: string) {
  if (!/^\d{1,4}$/.test(episode)) return null;
  try {
    const raw = JSON.parse(
      await readFile(path.join(process.cwd(), 'data', 'learn-public', episode, 'episode.json'), 'utf8'),
    );
    return isPublishedEducationEpisode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ episode: string }> },
): Promise<Metadata> {
  const episode = await loadEpisode((await params).episode);
  return { title: episode ? `${episode.title} — 3분 한국어` : '3분 한국어' };
}

export default async function LearnKoreanEpisodePage(
  { params }: { params: Promise<{ episode: string }> },
) {
  const episode = await loadEpisode((await params).episode);
  if (!episode) notFound();

  const locale = await getRequestLocale();
  return <LearnEpisodeView episode={episode} locale={locale} />;
}
