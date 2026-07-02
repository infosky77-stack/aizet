// serverLight 위치 어댑터 — 기존에 이미 동작하던 /api/admin/super-editor/files 엔드포인트를 그대로 감쌈.
//
// "serverLight" 라는 이름이지만 지금 단계에서는 서버가 업로드된 원본을 그대로 보관한다(경량화 안 함) —
// 도록 PDF 렌더링 파이프라인이 서버 파일을 직접 읽기 때문에, 지금 경량화하면 그쪽이 깨진다.
// local(OPFS) 사본이 "추가 사본"으로 얹히는 것뿐, 이 어댑터의 업로드 동작 자체는 바뀌지 않는다.
//
// 중복/이름충돌 판정은 서버가 실제로 받은 바이트를 재해시해서 권위있게 결정한다
// (src/lib/db/super-editor-files.ts findExactDuplicate/resolveAvailableName) — 클라이언트가
// 미리 계산한 해시는 여기서 신뢰하지 않는다(원장의 로컬 병합 편의용일 뿐, 인증 목적 아님).

import type { LocationAdapter, LocationSaveResult, SEFileDTO } from '../types';

const ENDPOINT = '/api/admin/super-editor/files';

export const serverLightAdapter: LocationAdapter = {
  kind: 'serverLight',

  isSupported: () => true,

  async save(_entryId, file, meta): Promise<LocationSaveResult> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (meta.orderId) fd.append('orderId', meta.orderId);
      const res = await fetch(ENDPOINT, { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: `업로드 실패 (${res.status}) ${text.slice(0, 80)}` };
      }
      const data = await res.json() as { file: SEFileDTO; outcome?: 'created' | 'duplicate' | 'renamed'; originalName?: string };
      return {
        ok: true,
        ref: data.file.id,
        outcome: data.outcome ?? 'created',
        dto: data.file,
        renamedFrom: data.originalName,
      };
    } catch (err) {
      return { ok: false, error: `업로드 중 오류: ${err instanceof Error ? err.message : '네트워크 오류'}` };
    }
  },

  // serverLight 의 표시 URL은 userId+filename 조합이 필요해서 selectors.ts 가 엔트리 필드로부터
  // 직접 조립한다(single-arg ref 만으로는 부족) — 이 메서드는 인터페이스 계약 충족용 스텁.
  async resolveUrl(): Promise<string | null> {
    return null;
  },

  async remove(ref): Promise<void> {
    try {
      await fetch(`${ENDPOINT}?fileId=${encodeURIComponent(ref)}`, { method: 'DELETE' });
    } catch {
      // 삭제 실패해도 원장에선 이미 지워짐 — 다음 hydrate 때 서버와 재동기화됨
    }
  },
};

// ── 이름변경/정렬 — serverLight 라이브러리에 고유한 관리 동작(다른 위치엔 없는 개념) ──────────────
export async function renameOnServer(serverId: string, name: string): Promise<SEFileDTO | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: serverId, name }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { file: SEFileDTO };
    return data.file;
  } catch {
    return null;
  }
}

export async function reorderOnServer(serverIds: string[]): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: serverIds }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// orderId 생략 시 계정 전체(독립 파일 관리자 페이지 등) — 주면 그 주문 파일만
export async function fetchServerFiles(orderId?: string): Promise<SEFileDTO[]> {
  try {
    const url = orderId ? `${ENDPOINT}?orderId=${encodeURIComponent(orderId)}` : ENDPOINT;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json() as { files: SEFileDTO[] };
    return data.files ?? [];
  } catch {
    return [];
  }
}
