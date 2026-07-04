// 교육 콘텐츠 게시 계약 — 학습 화면(공개)이 소비하는 형태의 단일 소스 (순수 로직).
//
// 공개/비공개 경계(product/published.ts와 동일 원칙): 게시본에는 원장 개념(ledgerRef)이
// 존재하지 않는다. 삽화·영상·카드는 게시 시점에 공개 디렉토리로 사본을 만들고 그 URL만
// 담는다 — 학습 화면은 이 JSON만 알면 되고, 회원의 비공개 원장은 절대 노출되지 않는다.

import type { EducationSnapshot, EducationUnit, StudyLang } from './types';

export interface PublishedEducationUnit {
  char: string;
  romanization: string;
  exampleKo: string;
  example: Record<StudyLang, string>;
  /** 공개 사본 URL — 게시 라우트가 원장에서 복사한 것. null이면 글자만 */
  illustrationUrl: string | null;
}

export interface PublishedEducationEpisode {
  version: 1;
  episodeNo: number;
  title: string;
  /** 공개 mp4 URL — 게시 시 영상이 없으면 null(학습 화면은 이북만 표시) */
  videoUrl: string | null;
  cards: { char: string; url: string }[];
  units: PublishedEducationUnit[];
  publishedAt: string;
}

export function isPublishedEducationEpisode(raw: unknown): raw is PublishedEducationEpisode {
  return typeof raw === 'object' && raw !== null
    && (raw as { version?: unknown }).version === 1
    && typeof (raw as { episodeNo?: unknown }).episodeNo === 'number'
    && Array.isArray((raw as { units?: unknown }).units);
}

/**
 * 스냅샷 → 게시본. 자산 URL(영상/카드/삽화 사본)은 저장을 아는 쪽(게시 라우트)이 만들어
 * 주입한다 — 이 함수는 "무엇이 공개되는가"만 결정한다. 글자가 빈 유닛은 게시본에서 제외
 * (카드/이북/영상 파생과 같은 규칙이라 세 산출물과 유닛 순서가 일치한다).
 */
export function toPublishedEpisode(
  snapshot: EducationSnapshot,
  assets: {
    videoUrl: string | null;
    cardUrls: string[];                       // 포함 유닛 순서와 동일
    illustrationUrls: Record<string, string>; // unit.id → 공개 사본 URL
  },
  publishedAt: string,
): PublishedEducationEpisode {
  const included = snapshot.units.filter((u) => u.char.trim());
  return {
    version: 1,
    episodeNo: snapshot.episodeNo,
    title: snapshot.title,
    videoUrl: assets.videoUrl,
    cards: included.map((u, i) => ({ char: u.char.trim(), url: assets.cardUrls[i] ?? '' }))
      .filter((c) => c.url),
    units: included.map((u) => ({
      char: u.char.trim(),
      romanization: u.romanization.trim(),
      exampleKo: u.exampleKo.trim(),
      example: u.example,
      illustrationUrl: assets.illustrationUrls[u.id] ?? null,
    })),
    publishedAt,
  };
}

/**
 * 게시본 → 이북 입력. EbookFlipbook/buildEbookPages는 EducationSnapshot을 소비하므로
 * 게시본을 스냅샷 모양으로 되돌린다 — 삽화는 파생 참조키('pub-illust-N')와 URL 맵으로
 * 연결할 뿐, 원장 id가 아니다(공개 경계 유지). 편집기와 학습 화면이 같은 렌더러를 쓰는
 * 것이 목적(화면 불일치 원천 차단).
 */
export function publishedToEbookInput(pub: PublishedEducationEpisode): {
  snapshot: EducationSnapshot;
  illustrationUrls: Record<string, string>;
} {
  const illustrationUrls: Record<string, string> = {};
  const units: EducationUnit[] = pub.units.map((u, i) => {
    const ref = u.illustrationUrl ? `pub-illust-${i}` : null;
    if (ref && u.illustrationUrl) illustrationUrls[ref] = u.illustrationUrl;
    return {
      id: `pub-unit-${i}`,
      char: u.char,
      romanization: u.romanization,
      exampleKo: u.exampleKo,
      example: u.example,
      illustrationRef: ref,
      voiceRef: null,
    };
  });
  return {
    snapshot: { version: 1, title: pub.title, episodeNo: pub.episodeNo, units },
    illustrationUrls,
  };
}
