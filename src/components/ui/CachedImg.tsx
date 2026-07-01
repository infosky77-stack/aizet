'use client';

import { useEffect, useState } from 'react';
import { getCachedImageSrc } from '@/lib/imageCache';

interface Props {
  id:         string; // 안정적 캐시 키 (서버 파일 id 또는 UUID 포함 URL) — 원본 파일명 금지
  src:        string; // 서버 이미지 URL, 또는 로컬 미리보기용 blob: URL
  alt?:       string;
  className?: string;
  draggable?: boolean;
}

// IndexedDB 캐시를 거치는 <img> 대체 컴포넌트.
// - src가 blob:  이면 로컬에서 방금 고른 파일의 낙관적 미리보기 — 캐시 계층 없이 즉시 표시.
//   이 blob URL의 정리(revoke)는 이 컴포넌트가 아니라 데이터 소유자(super-editor 업로드 로직)가
//   상태 전환 시점에 책임진다 — 같은 blob이 여러 화면에 동시에 떠 있을 수 있어서.
// - src가 서버 URL이면 최초 1회만 서버에서 받고, 이후에는 로컬 blob URL(IndexedDB 캐시)을 재사용
// - src가 바뀌어도(예: blob → 서버 URL 교체) 새 이미지가 준비되기 전까진 이전 이미지를 계속 보여줘 깜빡임 없음
export function CachedImg({ id, src, alt = '', className, draggable }: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (src.startsWith('blob:')) {
      setResolvedSrc(src);
      return;
    }

    getCachedImageSrc(id, src).then(url => {
      if (!cancelled) setResolvedSrc(url);
    });

    return () => { cancelled = true; };
  }, [id, src]);

  if (!resolvedSrc) {
    // 최초 로딩 중 — 레이아웃 유지용 빈 영역 (부모 배경색이 그대로 보임)
    return <div className={className} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolvedSrc} alt={alt} className={className} draggable={draggable} />
  );
}
