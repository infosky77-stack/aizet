// 게시 회차 로더(서버 전용) — episode.json(게시 계약)만 읽는다. 원장/DB의 비공개
// 데이터는 접근하지 않는다(공개/비공개 경계). 학습 화면과 이북 새창 라우트가 공유하는
// 단일 진입점 — 파일 규약이 바뀌면 여기 한 곳만 고친다.

import { readFile } from 'fs/promises';
import path from 'path';
import { isPublishedEducationEpisode, type PublishedEducationEpisode } from './published';

export async function loadPublishedEpisode(episode: string): Promise<PublishedEducationEpisode | null> {
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
