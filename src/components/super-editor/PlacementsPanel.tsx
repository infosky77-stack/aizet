'use client';

// 잡지 콘텐츠 하나(orderId)에 딸린 광고·원고 목록 — 독립 패널.
// magazine_placements API(가벼운 메타데이터만)만 호출한다. 광고 이미지/원고 원본 같은
// 무거운 파일은 이 패널이 다루지 않음 — 그건 "파일" 탭(ContentFileViewer)에서 로컬 원장으로.

import { useEffect, useState } from 'react';
import { Megaphone, NotebookPen, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Placement, PlacementKind, PlacementStatus } from '@/lib/super-editor/placements/types';

interface Props {
  orderId: string;
  /** 결제완료 등으로 잠글 필요가 있을 때 — 추가/수정/삭제 버튼을 숨긴다 */
  locked?: boolean;
}

interface FormState {
  kind:         PlacementKind;
  partyName:    string;
  sizeSpec:     string;
  placementPos: string;
}

function emptyForm(): FormState {
  return { kind: 'ad', partyName: '', sizeSpec: '', placementPos: '' };
}

const KIND_META: Record<PlacementKind, { label: string; nameLabel: string; icon: typeof Megaphone; color: string }> = {
  ad:         { label: '광고', nameLabel: '광고주', icon: Megaphone,   color: 'text-amber-500' },
  manuscript: { label: '원고', nameLabel: '필자',   icon: NotebookPen, color: 'text-violet-500' },
};

const STATUS_STEPS: { key: PlacementStatus; label: string }[] = [
  { key: 'intake',    label: '입고' },
  { key: 'placed',    label: '배치' },
  { key: 'confirmed', label: '확정' },
];

export function PlacementsPanel({ orderId, locked = false }: Props) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [formOpen, setFormOpen]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm());
  const [busy, setBusy]             = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/super-editor/placements?orderId=${orderId}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setPlacements(data.placements ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  function openCreateForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(p: Placement) {
    setForm({
      kind: p.kind, partyName: p.party_name, sizeSpec: p.size_spec,
      placementPos: p.placement_pos ?? '',
    });
    setEditingId(p.id);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit() {
    if (!form.partyName.trim()) return;
    setBusy(true);
    try {
      if (editingId) {
        const patch = {
          partyName:    form.partyName.trim(),
          sizeSpec:     form.sizeSpec.trim(),
          placementPos: form.placementPos.trim() || null,
        };
        await fetch(`/api/admin/super-editor/placements?id=${editingId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(patch),
        });
        setPlacements((prev) => prev.map((p) => (p.id === editingId
          ? { ...p, party_name: patch.partyName, size_spec: patch.sizeSpec, placement_pos: patch.placementPos }
          : p)));
      } else {
        const res = await fetch('/api/admin/super-editor/placements', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            orderId, kind: form.kind,
            partyName:    form.partyName.trim(),
            sizeSpec:     form.sizeSpec.trim(),
            placementPos: form.placementPos.trim() || null,
          }),
        });
        if (res.ok) {
          const { placement } = await res.json();
          setPlacements((prev) => [...prev, placement]);
        }
      }
      closeForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(p: Placement, status: PlacementStatus) {
    if (p.status === status) return;
    setPlacements((prev) => prev.map((item) => (item.id === p.id ? { ...item, status } : item)));
    await fetch(`/api/admin/super-editor/placements?id=${p.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
  }

  async function handleDelete(p: Placement) {
    const label = p.party_name || KIND_META[p.kind].label;
    if (!confirm(`"${label}" 항목을 삭제하시겠습니까?`)) return;
    setDeletingId(p.id);
    try {
      await fetch(`/api/admin/super-editor/placements?id=${p.id}`, { method: 'DELETE' });
      setPlacements((prev) => prev.filter((item) => item.id !== p.id));
    } finally {
      setDeletingId(null);
    }
  }

  const ads         = placements.filter((p) => p.kind === 'ad');
  const manuscripts = placements.filter((p) => p.kind === 'manuscript');
  const sorted      = [...ads, ...manuscripts];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 요약 + 추가 버튼 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-stone-500 font-medium">
          <span className="flex items-center gap-1"><Megaphone size={14} className="text-amber-500" /> 광고 {ads.length}건</span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1"><NotebookPen size={14} className="text-violet-500" /> 원고 {manuscripts.length}건</span>
        </div>
        {!locked && (
          <button
            onClick={openCreateForm}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm"
          >
            <Plus size={16} /> 광고·원고 추가
          </button>
        )}
      </div>

      {/* 추가/수정 폼 */}
      {formOpen && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-violet-200 bg-violet-50/50">
          {!editingId && (
            <div className="flex gap-2">
              {(Object.keys(KIND_META) as PlacementKind[]).map((k) => {
                const meta = KIND_META[k];
                const Icon = meta.icon;
                return (
                  <button
                    key={k}
                    onClick={() => setForm((f) => ({ ...f, kind: k }))}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-colors bg-white',
                      form.kind === k ? 'border-violet-500 text-violet-700' : 'border-transparent text-stone-400 hover:text-stone-600',
                    )}
                  >
                    <Icon size={18} /> {meta.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              autoFocus
              value={form.partyName}
              onChange={(e) => setForm((f) => ({ ...f, partyName: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={`${KIND_META[form.kind].nameLabel} 이름`}
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <input
              value={form.sizeSpec}
              onChange={(e) => setForm((f) => ({ ...f, sizeSpec: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="크기 (예: 1/2페이지)"
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <input
              value={form.placementPos}
              onChange={(e) => setForm((f) => ({ ...f, placementPos: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="게재 위치 (예: 12p, 표지 안쪽)"
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.partyName.trim() || busy}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 text-white transition-colors"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
          <div className="flex gap-2">
            <Megaphone size={28} className="opacity-30" />
            <NotebookPen size={28} className="opacity-30" />
          </div>
          <p className="text-sm">아직 등록된 광고·원고가 없습니다.</p>
          {!locked && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              <Plus size={16} /> 광고·원고 추가
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold text-stone-400 border-b border-stone-100">
            <span className="w-[18px] shrink-0" />
            <span className="flex-1 min-w-0">광고주 / 필자</span>
            <span className="w-24 shrink-0">크기</span>
            <span className="w-32 shrink-0">게재 위치</span>
            <span className="w-[190px] shrink-0">게재 상태</span>
            <span className="w-24 shrink-0">입고일</span>
            <span className="w-16 shrink-0" />
          </div>
          <div className="flex flex-col gap-1.5 pt-1.5">
            {sorted.map((p) => {
              const meta = KIND_META[p.kind];
              const Icon = meta.icon;
              return (
                <div
                  key={p.id}
                  className="group flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-3 py-2.5 hover:border-violet-200 transition-colors"
                >
                  <Icon size={18} className={clsx('shrink-0', meta.color)} />
                  {locked ? (
                    <span className="flex-1 min-w-0 text-sm font-medium text-stone-700 truncate">{p.party_name || '이름 없음'}</span>
                  ) : (
                    <button
                      onClick={() => openEditForm(p)}
                      className="flex-1 min-w-0 text-left text-sm font-medium text-stone-700 truncate hover:text-violet-700"
                    >
                      {p.party_name || '이름 없음'}
                    </button>
                  )}
                  <span className="w-24 shrink-0 text-xs text-stone-500 truncate">{p.size_spec || '—'}</span>
                  <span className="w-32 shrink-0 text-xs text-stone-500 truncate">{p.placement_pos || '—'}</span>
                  <div className="w-[190px] shrink-0">
                    <StatusPills value={p.status} onChange={(s) => handleStatusChange(p, s)} disabled={locked} />
                  </div>
                  <span className="w-24 shrink-0 text-xs text-stone-400">
                    {p.intake_date ? new Date(p.intake_date).toLocaleDateString('ko-KR') : '—'}
                  </span>
                  <span className="w-16 shrink-0 flex items-center justify-end gap-1">
                    {!locked && (
                      <>
                        <button
                          onClick={() => openEditForm(p)}
                          className="p-1 text-stone-300 hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPills({
  value, onChange, disabled,
}: {
  value: PlacementStatus;
  onChange: (s: PlacementStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((s) => (
        <button
          key={s.key}
          disabled={disabled}
          onClick={() => onChange(s.key)}
          className={clsx(
            'px-2 py-1 rounded-full text-[11px] font-semibold transition-colors',
            value === s.key ? 'bg-violet-600 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200',
            disabled && 'opacity-60 cursor-default',
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
