'use client';

// AIZET Object Model — 도록용 2분할 편집 화면(1차: 블록 텍스트 수정 + 저장 + 실시간 미리보기).
//
// 왼쪽: 최상위 블록을 kind별 입력으로 편집(로컬 state). "변경사항 저장"으로 수정된 블록만 순차 PATCH.
// 오른쪽: 저장된 tree를 순수 renderHtml로 그려 iframe srcDoc에 표시(서버 왕복 없이 클라이언트 렌더).
// 서버 진실 원천 원칙: 저장 응답으로 받은 tree로 state를 교체한다. store/renderers 로직은 재사용만.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Save, Loader2, AlertCircle, Pencil, Eye, ImagePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { renderHtml } from '@/lib/super-editor/object-model/renderers/html';
import { wrapHtmlPage } from '@/lib/super-editor/object-model/renderers/pageShell';
import type {
  DocumentTree, BlockNode, BlockData,
  HeadingData, ParagraphData, ImageData, ListItemData,
} from '@/lib/super-editor/object-model/types';

interface Props {
  siteId:     string;
  documentId: string;
}

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
        setTree(t); setEdits(collectEdits(t)); setDirty(new Set());
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

  // ── 이미지 추가: 파일들 순차 업로드(기존 files 라우트 재사용) → filename 수집 →
  //    om-document POST로 image 블록 일괄 추가 → 응답 tree로 교체(서버 진실 원천) ─────
  const addImages = useCallback(async (fileList: FileList) => {
    if (fileList.length === 0) return;
    setUploadingImg(true); setError(null);
    try {
      // 1) 각 파일을 기존 업로드 라우트로 순차 업로드(FormData, ?siteId=). 저장된 filename 수집.
      const filenames: string[] = [];
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/admin/super-editor/files?siteId=${encodeURIComponent(siteId)}`, { method: 'POST', body: fd });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `업로드 실패 (${res.status})`); }
        const { file: rec } = await res.json() as { file: { filename: string } };
        if (rec?.filename) filenames.push(rec.filename);
      }
      if (filenames.length === 0) throw new Error('업로드된 이미지가 없습니다.');

      // 2) filename 배열로 image 블록 일괄 추가(서버가 src 조립). 갱신된 tree 반환.
      const res = await fetch('/api/admin/super-editor/om-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, documentId, images: filenames.map((filename) => ({ filename })) }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `이미지 추가 실패 (${res.status})`); }
      const { tree: t } = await res.json() as { tree: DocumentTree };
      setTree(t); setEdits(collectEdits(t)); setDirty(new Set());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingImg(false);
    }
  }, [siteId, documentId]);

  // ── 오른쪽 미리보기 HTML(순수 renderHtml + wrapHtmlPage, 클라이언트 렌더) ──
  const previewHtml = useMemo(() => {
    if (!tree) return '';
    return wrapHtmlPage(renderHtml(tree), { lang: tree.document.lang, title: tree.document.title });
  }, [tree]);

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
              {uploadingImg ? '추가 중' : '이미지 추가'}
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

        {error && (
          <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100 shrink-0">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {tree.blocks.map((b) => (
            <BlockEditor key={b.id} node={b} edits={edits} onField={patchField} />
          ))}
        </div>
      </div>

      {/* 오른쪽: 미리보기 */}
      <div className={clsx(
        'flex-1 bg-stone-50 overflow-hidden',
        mobileView === 'preview' ? 'block' : 'hidden lg:block',
      )}>
        <iframe title="미리보기" srcDoc={previewHtml} className="w-full h-full border-0" />
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
  node, edits, onField,
}: { node: BlockNode; edits: Record<string, BlockData>; onField: (id: string, patch: Partial<BlockData>) => void }) {
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
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-stone-50 border border-stone-100">
          <span className={labelCls()}>이미지</span>
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
