// 도록 PDF의 원본 이미지 바이트를 "가장 빠른 경로"로 확보한다.
//
// 우선순위: OPFS(local, 네트워크 없음) → serverLight URL(fetch) → previewUrl(blob, 업로드 확정 전 과도기).
// resolveDisplayUrl(selectors.ts)과 반대 순서인 이유: 그쪽은 "화면에 보여줄 권위 있는 URL"이 목적이라
// serverLight를 우선하지만, 여기는 "같은 내용의 바이트를 가장 빠르게"가 목적이라 로컬을 우선한다.

import { findLocation } from '../ledger/selectors';
import { localAdapter } from '../ledger/locations/localAdapter';
import type { FileEntry } from '../ledger/types';

export interface ArtworkImageRef {
  imageUrl:       string;
  sourceEntryId?: string;
  sourceFileId?:  string;
}

// artwork가 가리키는 원장 엔트리를 찾는다 — sourceEntryId(이번 세션 id) 우선,
// 새로고침 등으로 못 찾으면 sourceFileId(서버 파일 id, 재하이드레이트 후에도 key로 남음)로 재시도.
function findLedgerEntry(
  entries: Record<string, FileEntry>,
  artwork: ArtworkImageRef,
): FileEntry | undefined {
  if (artwork.sourceEntryId && entries[artwork.sourceEntryId]) return entries[artwork.sourceEntryId];
  if (artwork.sourceFileId) {
    if (entries[artwork.sourceFileId]) return entries[artwork.sourceFileId];
    for (const entry of Object.values(entries)) {
      if (findLocation(entry, 'serverLight')?.ref === artwork.sourceFileId) return entry;
    }
  }
  return undefined;
}

/** artwork 하나의 이미지 원본 바이트(Blob)를 확보. 실패하면 throw. */
export async function resolveArtworkImageBlob(
  artwork: ArtworkImageRef,
  entries: Record<string, FileEntry>,
): Promise<Blob> {
  const entry = findLedgerEntry(entries, artwork);

  const local = entry ? findLocation(entry, 'local') : undefined;
  if (local?.status === 'present') {
    const url = await localAdapter.resolveUrl(local.ref);
    if (url) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.blob();
      } catch {
        // OPFS blob 해석 실패 — 아래 네트워크 경로로 폴백
      }
    }
  }

  if (!artwork.imageUrl) throw new Error('이미지 URL이 없습니다');
  const res = await fetch(artwork.imageUrl);
  if (!res.ok) throw new Error(`이미지를 불러오지 못했습니다: ${artwork.imageUrl}`);
  return await res.blob();
}
