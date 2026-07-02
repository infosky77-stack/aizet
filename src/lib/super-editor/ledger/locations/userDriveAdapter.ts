// userDrive 위치 어댑터 — 이번 단계 스텁.
//
// 실제 구현 시 기존에 이미 있는 사용자 OAuth 기반 Drive 연동(src/lib/drive-auth.ts,
// src/lib/drive-folder.ts, src/lib/drive-upload.ts — 각 사업장주 본인 구글 계정에, 공개 권한 없이
// 비공개 업로드하는 방식으로 이미 다른 기능에서 검증된 코드)을 그대로 감싸면 된다.
// 지금은 아무 동작도 하지 않음 — isSupported() 가 false 라서 store.ts 는 이 어댑터를 아예 호출하지
// 않는다(구글 계정 없는 사용자가 압도적 다수인 상황에서, 없는 기능이 UI에 에러로 노출되면 안 되므로).

import type { LocationAdapter } from '../types';

export const userDriveAdapter: LocationAdapter = {
  kind: 'userDrive',

  isSupported: () => false,

  async save() {
    return { ok: false, error: 'userDrive adapter not implemented yet' };
  },

  async resolveUrl() {
    return null;
  },

  async remove() {
    // no-op
  },
};
