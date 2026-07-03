// 장면(scene)이 가리키는 미디어 원본 바이트(Blob) 확보 — 브라우저 전용.
//
// 해석 우선순위는 도록 PDF와 동일한 모듈(pdf/resolveImageBytes)을 그대로 재사용한다:
// OPFS(local, 네트워크 없음) → 서버 URL → srcUrl. ledgerRef는 세션 id/서버 파일 id
// 어느 쪽일 수 있으므로 두 자리에 같이 넣는다(잡지 조판의 resolveLedgerImage와 같은 기법).

import { resolveArtworkImageBlob } from '../pdf/resolveImageBytes';
import type { FileEntry } from '../ledger/types';
import type { VideoScene } from './types';

/** 장면의 미디어 Blob. 해석 실패 시 null(호출부가 장면 제외 + 경고 처리). */
export async function resolveSceneBlob(
  scene: VideoScene,
  entries: Record<string, FileEntry>,
): Promise<Blob | null> {
  if (!scene.ledgerRef && !scene.srcUrl) return null;
  try {
    return await resolveArtworkImageBlob(
      {
        imageUrl:      scene.srcUrl ?? '',
        sourceEntryId: scene.ledgerRef ?? undefined,
        sourceFileId:  scene.ledgerRef ?? undefined,
      },
      entries,
    );
  } catch {
    return null;
  }
}
