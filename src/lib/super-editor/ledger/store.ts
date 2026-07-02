// 슈퍼에디터 파일 원장 — zustand 스토어.
//
// 이 파일은 "무엇을, 언제, 어느 어댑터에 저장할지"를 조율(orchestrate)하고 그 결과를 entries에
// 반영하는 역할만 한다. 실제 I/O(파일 쓰기·네트워크 호출)는 전부 locations/*Adapter.ts 안에 있다.
// 어댑터 하나가 실패해도(reject 없이 { ok:false } 로 돌아오므로) 다른 어댑터·다른 파일 처리에는
// 영향이 없다 — 이게 "한 모듈/한 파일 실패가 전체를 안 무너뜨린다"는 안전성 원칙의 실제 구현.

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { scheduleRevokeBlobUrl } from '@/lib/imageCache';
import type { FileEntry, FileEntryKind, FileLocationRef, LedgerNotice, SEFileDTO } from './types';
import { findLocation, getEntryStatus, getOrderedEntries } from './selectors';
import { localAdapter } from './locations/localAdapter';
import { serverLightAdapter, renameOnServer, reorderOnServer, fetchServerFiles } from './locations/serverLightAdapter';

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `local-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}
function genNoticeId(): string {
  return `notice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

let optimisticSortCounter = 0;
// 낙관적(로컬) 엔트리는 항상 서버 sort_order(-created_at 스케일)보다 더 작은 값을 받아 맨 위로 뜬다.
function nextOptimisticSortOrder(): number {
  optimisticSortCounter += 1;
  return -(Date.now() * 1000 + optimisticSortCounter);
}

function kindFromMime(mime: string): FileEntryKind {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'image';
}

function upsertLocation(locations: FileLocationRef[], next: FileLocationRef): FileLocationRef[] {
  const idx = locations.findIndex((l) => l.kind === next.kind);
  if (idx === -1) return [...locations, next];
  const copy = [...locations];
  copy[idx] = next;
  return copy;
}

function fromServerDTO(f: SEFileDTO): FileEntry {
  return {
    id:         f.id,
    contentHash: f.content_hash,
    kind:       f.file_type,
    origName:   f.orig_name,
    mimeType:   f.mime_type,
    sizeBytes:  f.size_bytes,
    userId:     f.user_id,
    filename:   f.filename,
    orderId:    f.order_id ?? undefined,
    locations:  [{ kind: 'serverLight', status: 'present', ref: f.id, updatedAt: Date.now() }],
    sortOrder:  f.sort_order ?? -f.created_at,
    createdAt:  f.created_at,
  };
}

// 서버 레코드 f 에 대응하는 기존 엔트리를 찾는다(있다면 그 dict key 를 재사용 — id 안정성 유지).
//  1) 이미 그 id로 원장에 있으면(서버발 엔트리 재조회) 그대로.
//  2) 어떤 엔트리든 이미 이 서버 파일을 serverLight 위치로 갖고 있으면(직접 업로드한 그 엔트리) 그걸로.
// 클라이언트에서 contentHash 를 아직 계산하지 않으므로(향후 확장 지점) hash 매칭은 하지 않음 —
// 섣불리 hash만으로 병합하면 "이름 다르지만 내용 같은 서로 다른 두 파일"을 잘못 합칠 위험이 있어서.
function findMatchingEntryId(entries: Record<string, FileEntry>, f: SEFileDTO): string | undefined {
  if (entries[f.id]) return f.id;
  for (const key of Object.keys(entries)) {
    if (findLocation(entries[key], 'serverLight')?.ref === f.id) return key;
  }
  return undefined;
}

interface FileLedgerState {
  entries: Record<string, FileEntry>;
  notices: LedgerNotice[];
  /** 지금 원장이 "열어놓은 폴더" — 이 주문의 파일만 담김. null이면 무주문(스코프 없음) */
  currentOrderId: string | null;

  /** 다른 주문으로 전환 — 기존 entries/notices를 전부 비우고 새 스코프로 리셋(주문 간 누수 방지) */
  setCurrentOrder: (orderId: string) => void;
  hydrate: (files: SEFileDTO[]) => void;
  refreshFromServer: () => Promise<void>;
  adoptServerFile: (file: SEFileDTO) => FileEntry;
  ingestFile: (file: File) => FileEntry;
  retry: (id: string) => void;
  removeEntry: (id: string) => void;
  renameEntry: (id: string, name: string) => Promise<void>;
  reorderEntries: (ids: string[]) => Promise<void>;
  dismissNotice: (id: string) => void;
}

export const useFileLedgerStore = create<FileLedgerState>((set, get) => ({
  entries: {},
  notices: [],
  currentOrderId: null,

  setCurrentOrder: (orderId) => set(() => ({ currentOrderId: orderId, entries: {}, notices: [] })),

  hydrate: (files) => set((state) => {
    const entries = { ...state.entries };
    for (const f of files) {
      const matchId = findMatchingEntryId(entries, f);
      if (matchId) {
        const cur = entries[matchId];
        // 업로드/재시도 진행 중인 로컬 엔트리는 서버 재조회 결과로 덮어쓰지 않음(경쟁 상태 방지)
        if (getEntryStatus(cur) === 'uploading' && cur.retryFile) continue;
        const locations = upsertLocation(cur.locations, { kind: 'serverLight', status: 'present', ref: f.id, updatedAt: Date.now() });
        entries[matchId] = {
          ...cur, locations, origName: f.orig_name, userId: f.user_id, filename: f.filename,
          contentHash: f.content_hash, orderId: f.order_id ?? cur.orderId, sortOrder: f.sort_order ?? cur.sortOrder,
        };
      } else {
        entries[f.id] = fromServerDTO(f);
      }
    }
    return { entries };
  }),

  refreshFromServer: async () => {
    const files = await fetchServerFiles(get().currentOrderId ?? undefined);
    get().hydrate(files);
  },

  adoptServerFile: (f) => {
    const matchId = findMatchingEntryId(get().entries, f);
    const keyId = matchId ?? f.id;
    const merged: FileEntry = { ...fromServerDTO(f), id: keyId };
    set((state) => ({ entries: { ...state.entries, [keyId]: merged } }));
    return merged;
  },

  ingestFile: (file) => {
    const id = genId();
    const orderId = get().currentOrderId ?? undefined;
    const entry: FileEntry = {
      id,
      kind:       kindFromMime(file.type),
      origName:   file.name,
      mimeType:   file.type,
      sizeBytes:  file.size,
      orderId,
      locations:  [],
      previewUrl: URL.createObjectURL(file),
      sortOrder:  nextOptimisticSortOrder(),
      createdAt:  Date.now(),
      retryFile:  file,
    };
    set((state) => ({ entries: { ...state.entries, [id]: entry } }));

    // 위치별로 독립적으로 시도 — 하나가 실패/미지원이어도 나머지에 영향 없음
    if (localAdapter.isSupported()) void attemptLocalSave(id, file);
    void attemptServerSave(id, file, orderId);

    return entry;
  },

  retry: (id) => {
    const entry = get().entries[id];
    if (!entry?.retryFile) return;
    const file = entry.retryFile;
    if (!findLocation(entry, 'local') && localAdapter.isSupported()) void attemptLocalSave(id, file);
    // 이전 에러 표시를 지우고 재시도 진행 중으로
    set((state) => {
      const cur = state.entries[id];
      if (!cur) return state;
      const locations = cur.locations.filter((l) => l.kind !== 'serverLight');
      return { entries: { ...state.entries, [id]: { ...cur, locations } } };
    });
    void attemptServerSave(id, file, entry.orderId);
  },

  removeEntry: (id) => {
    const entry = get().entries[id];
    if (!entry) return;
    if (entry.previewUrl) scheduleRevokeBlobUrl(entry.previewUrl);
    set((state) => {
      const entries = { ...state.entries };
      delete entries[id];
      return { entries };
    });
    const server = findLocation(entry, 'serverLight');
    if (server?.status === 'present' && server.ref) void serverLightAdapter.remove(server.ref);
    const local = findLocation(entry, 'local');
    if (local?.status === 'present' && local.ref) void localAdapter.remove(local.ref);
  },

  renameEntry: async (id, name) => {
    const entry = get().entries[id];
    const trimmed = name.trim();
    if (!entry || !trimmed || trimmed === entry.origName) return;
    const prevName = entry.origName;
    set((state) => ({ entries: { ...state.entries, [id]: { ...state.entries[id], origName: trimmed } } }));

    const server = findLocation(entry, 'serverLight');
    if (!server?.ref) return; // 아직 서버 미확정 — 로컬 표시만 바뀌면 충분, 확정되면 origName 그대로 올라감

    const updated = await renameOnServer(server.ref, trimmed);
    set((state) => {
      const cur = state.entries[id];
      if (!cur) return state;
      if (!updated) return { entries: { ...state.entries, [id]: { ...cur, origName: prevName } } }; // 실패 롤백
      // 서버가 이름충돌로 자동 접미사를 붙였을 수 있음 — 서버가 확정한 최종 이름을 그대로 반영
      return { entries: { ...state.entries, [id]: { ...cur, origName: updated.orig_name } } };
    });
  },

  reorderEntries: async (ids) => {
    const prevEntries = get().entries;
    set((state) => {
      const entries = { ...state.entries };
      ids.forEach((id, idx) => {
        if (entries[id]) entries[id] = { ...entries[id], sortOrder: idx };
      });
      return { entries };
    });
    const serverIds = ids
      .map((id) => findLocation(prevEntries[id], 'serverLight')?.ref)
      .filter((v): v is string => !!v);
    if (serverIds.length === 0) return;
    const ok = await reorderOnServer(serverIds);
    if (!ok) set({ entries: prevEntries }); // 실패 롤백
  },

  dismissNotice: (id) => set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
}));

// ── 위치별 저장 시도 (스토어 액션이 아닌 모듈 함수 — 내부 조율 전용) ─────────────────────────────

async function attemptLocalSave(entryId: string, file: File): Promise<void> {
  const result = await localAdapter.save(entryId, file, { mimeType: file.type, origName: file.name });
  if (!result.ok || !result.ref) return; // 실패해도 조용히 생략 — serverLight 흐름에 영향 없음
  useFileLedgerStore.setState((state) => {
    const entry = state.entries[entryId];
    if (!entry) return state; // 그 사이 삭제됨
    const locations = upsertLocation(entry.locations, { kind: 'local', status: 'present', ref: result.ref!, updatedAt: Date.now() });
    return { entries: { ...state.entries, [entryId]: { ...entry, locations } } };
  });
}

async function attemptServerSave(entryId: string, file: File, orderId?: string): Promise<void> {
  const result = await serverLightAdapter.save(entryId, file, { mimeType: file.type, origName: file.name, orderId });

  useFileLedgerStore.setState((state) => {
    const entry = state.entries[entryId];
    if (!entry) return state; // 그 사이 삭제됨 — 응답은 무시

    if (!result.ok) {
      const locations = upsertLocation(entry.locations, {
        kind: 'serverLight', status: 'error', ref: '', updatedAt: Date.now(), error: result.error,
      });
      return { entries: { ...state.entries, [entryId]: { ...entry, locations } } };
    }

    if (result.outcome === 'duplicate' && result.dto) {
      if (entry.previewUrl) scheduleRevokeBlobUrl(entry.previewUrl);
      const entries = { ...state.entries };
      delete entries[entryId];
      const alreadyPresent = Object.values(entries).some((e) => findLocation(e, 'serverLight')?.ref === result.dto!.id);
      if (!alreadyPresent) entries[result.dto.id] = fromServerDTO(result.dto);
      const notice: LedgerNotice = {
        id: genNoticeId(), kind: 'duplicate',
        message: `"${result.dto.orig_name}" — 이름과 내용이 동일한 파일이 이미 있어 제외했습니다.`,
      };
      return { entries, notices: [...state.notices, notice] };
    }

    if (!result.dto) return state;
    if (entry.previewUrl) scheduleRevokeBlobUrl(entry.previewUrl);
    const locations = upsertLocation(entry.locations, { kind: 'serverLight', status: 'present', ref: result.dto.id, updatedAt: Date.now() });
    const updated: FileEntry = {
      ...entry, locations, userId: result.dto.user_id, filename: result.dto.filename,
      contentHash: result.dto.content_hash, orderId: result.dto.order_id ?? entry.orderId, retryFile: undefined,
    };
    const notices = result.outcome === 'renamed'
      ? [...state.notices, {
          id: genNoticeId(), kind: 'renamed' as const,
          message: `"${entry.origName}" — 같은 이름의 파일이 있어 "${result.dto.orig_name}"(으)로 저장했습니다.`,
        }]
      : state.notices;
    return { entries: { ...state.entries, [entryId]: updated }, notices };
  });
}

// ── 컴포넌트용 훅 ──────────────────────────────────────────────────────────

export function useOrderedFileEntries(): FileEntry[] {
  return useFileLedgerStore(useShallow((state) => getOrderedEntries(state.entries)));
}

export function useLedgerNotices(): LedgerNotice[] {
  return useFileLedgerStore((state) => state.notices);
}

export function useFileEntry(id: string | undefined): FileEntry | undefined {
  return useFileLedgerStore((state) => (id ? state.entries[id] : undefined));
}
