'use client';

// AIZET Object Model — 도록용 2분할 편집 화면(1차: 블록 텍스트 수정 + 저장 + 실시간 미리보기).
//
// 왼쪽: 최상위 블록을 kind별 입력으로 편집(로컬 state). "변경사항 저장"으로 수정된 블록만 순차 PATCH.
// 오른쪽: 저장된 tree를 DocumentPreview(React 실시간 렌더)로 표시 — tree 변경 시 바뀐 블록만
// 갱신되어 변경 없는 이미지는 재요청되지 않는다(기존 iframe 전체 리로드 방식의 재다운 문제 해소).
// 서버 진실 원천 원칙: 저장 응답으로 받은 tree로 state를 교체한다. store/renderers 로직은 재사용만.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Save, Loader2, AlertCircle, Pencil, Eye, ImagePlus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { DocumentPreview } from './DocumentPreview';
import type {
  DocumentTree, BlockNode, BlockData,
  HeadingData, ParagraphData, ImageData, ListItemData,
} from '@/lib/super-editor/object-model/types';

interface Props {
  siteId:     string;
  documentId: string;
}

// 이미지 업로드 동시 실행 최대치(청크 방식) — 서버·네트워크 부담과 속도의 절충.
const UPLOAD_CONCURRENCY = 4;

/** tree의 편집 대상 블록(최상위 + list 자식 list_item)의 data를 blockId→data 맵으로 수집. */
function collectEdits(tree: DocumentTree): Record<string, BlockData> {
  const map: Record<string, BlockData> = {};
  for (const b of tree.blocks) {
    if (b.kind === 'heading' || b.kind === 'paragraph' || b.kind === 'image' || b.kind === 'list') {
      map[b.id] = { ...b.data };
    }
    if (b.kind === 'list') {
      for (const c of b.children) {
        if (c.kind === 'list_item') map[c.id] = { ...c.data };
      }
    }
  }
  return map;
}

export function DocumentEditor({ siteId, documentId }: Props) {
  const [tree, setTree]       = useState<DocumentTree | null>(null);
  const [edits, setEdits]     = useState<Record<string, BlockData>>({});
  const [dirty, setDirty]     = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgProgress, setImgProgress] = useState<{ done: number; total: number } | null>(null);
  // 이미지 다중선택 삭제: 선택된 image 블록 id 집합 + 일괄 삭제 진행 여부(dirty 추적용 Set과 별개)
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 초기 로드 ────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const url = `/api/admin/super-editor/om-document?siteId=${encodeURIComponent(siteId)}&documentId=${encodeURIComponent(documentId)}`;
        const res = await fetch(url);
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `로드 실패 (${res.status})`); }
        const { tree: t } = await res.json() as { tree: DocumentTree };
        if (!alive) return;
        setTree(t); setEdits(collectEdits(t)); setDirty(new Set()); setSelectedImageIds(new Set());
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [siteId, documentId]);

  // ── 입력 변경 → 로컬 state만 갱신 + dirty 표시 ────────────────────────────
  const patchField = useCallback((blockId: string, patch: Partial<BlockData>) => {
    setEdits((prev) => ({ ...prev, [blockId]: { ...prev[blockId], ...patch } as BlockData }));
    setDirty((prev) => new Set(prev).add(blockId));
  }, []);

  // ── 저장: 수정된 블록만 순차 PATCH, 마지막 응답 tree로 교체 ───────────────
  const save = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true); setError(null);
    try {
      let latest: DocumentTree | null = tree;
      for (const blockId of dirty) {
        const res = await fetch('/api/admin/super-editor/om-document', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, documentId, blockId, data: edits[blockId] }),
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `저장 실패 (${res.status})`); }
        latest = (await res.json() as { tree: DocumentTree }).tree;
      }
      if (latest) { setTree(latest); setEdits(collectEdits(latest)); setDirty(new Set()); }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [dirty, edits, tree, siteId, documentId]);

  // ── 이미지 추가: 파일들 적정 병렬 업로드(청크 4개씩, 선택 순서 유지, 부분 성공 허용) →
  //    filename 수집 → om-document POST로 image 블록 일괄 추가 → 응답 tree로 교체 ─────
  const addImages = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploadingImg(true); setError(null);
    setImgProgress({ done: 0, total: files.length });
    try {
      // 1) 청크(동시 UPLOAD_CONCURRENCY개)로 업로드. 결과를 "인덱스 위치"에 담아 선택 순서를 보존
      //    (병렬 완료 순서가 뒤섞여도 최종 배열은 사용자가 고른 순서 그대로).
      const uploaded: (string | null)[] = new Array(files.length).fill(null);
      let done = 0;
      for (let start = 0; start < files.length; start += UPLOAD_CONCURRENCY) {
        const chunk = files.slice(start, start + UPLOAD_CONCURRENCY);
        await Promise.all(chunk.map(async (file, j) => {
          const idx = start + j;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`/api/admin/super-editor/files?siteId=${encodeURIComponent(siteId)}`, { method: 'POST', body: fd });
            if (!res.ok) throw new Error(String(res.status));
            const { file: rec } = await res.json() as { file: { filename: string } };
            if (rec?.filename) uploaded[idx] = rec.filename; // idx 위치 = 선택 순서
          } catch {
            // 개별 파일 실패는 건너뛴다(null 유지) — 전체 중단하지 않음(부분 성공 허용)
          } finally {
            done += 1;
            setImgProgress({ done, total: files.length });
          }
        }));
      }

      const filenames = uploaded.filter((f): f is string => !!f); // 성공분만, 선택 순서 유지
      const failed = files.length - filenames.length;
      if (filenames.length === 0) throw new Error('이미지 업로드에 모두 실패했습니다.');

      // 2) filename 배열로 image 블록 일괄 추가(서버가 src 조립). 갱신된 tree 반환.
      const res = await fetch('/api/admin/super-editor/om-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, documentId, images: filenames.map((filename) => ({ filename })) }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `이미지 추가 실패 (${res.status})`); }
      const { tree: t } = await res.json() as { tree: DocumentTree };
      setTree(t); setEdits(collectEdits(t)); setDirty(new Set());
      // 일부 실패했지만 나머지는 추가됨 → 실패 개수만 안내(전체 성공이면 에러 없음)
      if (failed > 0) setError(`${failed}개 업로드 실패(나머지 ${filenames.length}개는 추가됨)`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingImg(false);
      setImgProgress(null);
    }
  }, [siteId, documentId]);

  // ── 이미지 다중선택 삭제 ───────────────────────────────────────────────────
  // 문서의 image 블록 id 목록(전체 선택 대상). 선택 상태·전체선택 판정의 기준.
  const imageIds = useMemo(
    () => (tree ? tree.blocks.filter((b) => b.kind === 'image').map((b) => b.id) : []),
    [tree],
  );
  const allSelected = imageIds.length > 0 && imageIds.every((id) => selectedImageIds.has(id));

  // 개별 체크박스 토글
  const toggleSelect = useCallback((blockId: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
      return next;
    });
  }, []);

  // 전체 선택/해제 — 전부 선택돼 있으면 비우고, 아니면 모든 image 블록을 한 번에 선택
  const toggleSelectAll = useCallback(() => {
    setSelectedImageIds((prev) =>
      imageIds.length > 0 && imageIds.every((id) => prev.has(id)) ? new Set() : new Set(imageIds),
    );
  }, [imageIds]);

  // 선택 삭제: 선택된 blockIds를 한 번에 DELETE(문서에서 블록만 제거, 실물 파일 무접촉) → 응답 tree로 교체
  const deleteSelected = useCallback(async () => {
    const ids = [...selectedImageIds];
    if (ids.length === 0) return;
    if (!window.confirm(
      `선택한 ${ids.length}개 이미지를 이 문서에서 뺍니다.\n\n(원본 파일은 그대로 남으며, 언제든 다시 넣을 수 있습니다.)\n계속할까요?`,
    )) return;
    setDeleting(true); setError(null);
    try {
      const res = await fetch('/api/admin/super-editor/om-document', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, documentId, blockIds: ids }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `삭제 실패 (${res.status})`); }
      const { tree: t } = await res.json() as { tree: DocumentTree };
      setTree(t); setEdits(collectEdits(t)); setDirty(new Set()); setSelectedImageIds(new Set());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }, [selectedImageIds, siteId, documentId]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={28} className="animate-spin text-stone-300" /></div>;
  }
  if (error && !tree) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
        <AlertCircle size={28} /><p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!tree) return null;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* 모바일 탭 전환 */}
      <div className="lg:hidden flex shrink-0 border-b border-stone-200 bg-white">
        {(['edit', 'preview'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={clsx(
              'flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5',
              mobileView === v ? 'border-violet-600 text-violet-700' : 'border-transparent text-stone-400',
            )}
          >
            {v === 'edit' ? <Pencil size={13} /> : <Eye size={13} />}
            {v === 'edit' ? '편집' : '미리보기'}
          </button>
        ))}
      </div>

      {/* 왼쪽: 편집 패널 */}
      <div className={clsx(
        'w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-stone-200 bg-white flex flex-col overflow-hidden',
        mobileView === 'edit' ? 'flex' : 'hidden lg:flex',
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0">
          <h2 className="text-sm font-bold text-stone-700 truncate">{tree.document.title || '(제목 없음)'}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {/* 이미지 추가: 숨김 input 트리거 → 여러 장 업로드 → image 블록 자동 추가 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) addImages(e.target.files); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg || saving}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                uploadingImg || saving
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploadingImg
                ? (imgProgress ? `업로드 ${imgProgress.done}/${imgProgress.total}` : '추가 중')
                : '이미지 추가'}
            </button>
            <button
              onClick={save}
              disabled={saving || dirty.size === 0}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                dirty.size === 0 || saving
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700',
              )}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? '저장 중' : dirty.size > 0 ? `변경사항 저장 (${dirty.size})` : '저장됨'}
            </button>
          </div>
        </div>

        {/* 이미지 다중선택 삭제 툴바 — image 블록이 있을 때만 노출 */}
        {imageIds.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-stone-100 shrink-0">
            <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer select-none">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-violet-600" />
              전체 선택 ({imageIds.length})
            </label>
            <button
              onClick={deleteSelected}
              disabled={selectedImageIds.size === 0 || deleting}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                selectedImageIds.size === 0 || deleting
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50',
              )}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {deleting ? '삭제 중' : `선택 삭제 (${selectedImageIds.size})`}
              {!deleting && <span className="font-normal text-stone-400">· 문서에서 빼기</span>}
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100 shrink-0">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {tree.blocks.map((b) => (
            <BlockEditor
              key={b.id}
              node={b}
              edits={edits}
              onField={patchField}
              selected={selectedImageIds.has(b.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      </div>

      {/* 오른쪽: 미리보기 */}
      <div className={clsx(
        'flex-1 bg-stone-50 overflow-hidden',
        mobileView === 'preview' ? 'block' : 'hidden lg:block',
      )}>
        <DocumentPreview tree={tree} />
      </div>
    </div>
  );
}

// ── 블록별 입력 ─────────────────────────────────────────────────────────────
function fieldCls() {
  return 'w-full px-2.5 py-1.5 text-sm rounded-lg border border-stone-200 focus:border-violet-400 focus:outline-none';
}
function labelCls() {
  return 'text-[11px] font-semibold text-stone-400 uppercase tracking-wide';
}

function BlockEditor({
  node, edits, onField, selected, onToggleSelect,
}: {
  node: BlockNode;
  edits: Record<string, BlockData>;
  onField: (id: string, patch: Partial<BlockData>) => void;
  selected: boolean;                       // image 블록에서만 의미(다중선택 삭제)
  onToggleSelect: (id: string) => void;
}) {
  const data = edits[node.id];

  switch (node.kind) {
    case 'heading': {
      const d = data as HeadingData;
      return (
        <div className="flex flex-col gap-1">
          <span className={labelCls()}>제목 H{d?.level ?? 1}</span>
          <input className={fieldCls()} value={d?.text ?? ''} onChange={(e) => onField(node.id, { text: e.target.value })} />
        </div>
      );
    }
    case 'paragraph': {
      const d = data as ParagraphData;
      return (
        <div className="flex flex-col gap-1">
          <span className={labelCls()}>문단</span>
          <textarea className={clsx(fieldCls(), 'min-h-[72px] resize-y')} value={d?.text ?? ''} onChange={(e) => onField(node.id, { text: e.target.value })} />
        </div>
      );
    }
    case 'image': {
      const d = data as ImageData;
      return (
        <div className={clsx(
          'flex flex-col gap-1.5 p-2.5 rounded-lg border',
          selected ? 'bg-violet-50 border-violet-200' : 'bg-stone-50 border-stone-100',
        )}>
          <div className="flex items-center justify-between">
            <span className={labelCls()}>이미지</span>
            <label className="flex items-center gap-1 text-[11px] text-stone-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(node.id)}
                className="accent-violet-600"
              />
              선택
            </label>
          </div>
          <span className="text-[11px] text-stone-400 truncate">src: {d?.src || '(없음)'}</span>
          <input className={fieldCls()} placeholder="대체 텍스트(alt)" value={d?.alt ?? ''} onChange={(e) => onField(node.id, { alt: e.target.value })} />
          <input className={fieldCls()} placeholder="캡션" value={d?.caption ?? ''} onChange={(e) => onField(node.id, { caption: e.target.value })} />
        </div>
      );
    }
    case 'list': {
      const items = node.children.filter((c) => c.kind === 'list_item');
      return (
        <div className="flex flex-col gap-1.5">
          <span className={labelCls()}>목록</span>
          {items.map((c) => {
            const cd = edits[c.id] as ListItemData;
            return (
              <input
                key={c.id}
                className={fieldCls()}
                value={cd?.text ?? ''}
                onChange={(e) => onField(c.id, { text: e.target.value })}
              />
            );
          })}
        </div>
      );
    }
    default:
      return null; // list_item(최상위 stray)·모르는 kind는 편집 항목 없음
  }
}
