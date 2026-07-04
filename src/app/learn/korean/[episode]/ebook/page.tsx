// 이북 새창(공개) — 학습 화면의 "이북 새창으로 보기"가 여는 별도 창. 같은 게시 계약을
// 같은 로더(loadPublishedEpisode)로 읽어 이북만 전체 화면으로 보여준다(영상과 나란히
// 보기용). 공개/비공개 경계·언어 해석은 학습 화면과 동일.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/i18n/server';
import { loadPublishedEpisode } from '@/lib/super-editor/education/loadPublished';
import { LearnEbookView } from '@/components/education/LearnEbookView';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ episode: string }> },
): Promise<Metadata> {
  const episode = await loadPublishedEpisode((await params).episode);
  return { title: episode ? `${episode.title} — 이북` : '3분 한국어' };
}

export default async function LearnKoreanEbookPage(
  { params }: { params: Promise<{ episode: string }> },
) {
  const episode = await loadPublishedEpisode((await params).episode);
  if (!episode) notFound();

  const locale = await getRequestLocale();
  return <LearnEbookView episode={episode} locale={locale} />;
}
