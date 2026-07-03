'use client';

// 잡지 콘텐츠 하나(orderId)에 딸린 광고·원고 목록 — 독립 패널.
// magazine_placements API(가벼운 메타데이터만)만 호출한다. 광고 이미지/원고 원본 같은
// 무거운 파일은 이 패널이 다루지 않음 — 그건 "파일" 탭(ContentFileViewer)에서 로컬 원장으로.
// 단, 항목↔파일 연결(ledger_ref)과 조판 PDF 생성을 위해 원장을 읽기 전용으로 구독한다.

import { useEffect, useState } from 'react';
import { Megaphone, NotebookPen, Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { Placement, PlacementKind, PlacementSlot, PlacementStatus } from '@/lib/super-editor/placements/types';
import { MagazinePdfButton } from '@/components/super-editor/MagazinePdfButton';
import { useFileLedgerStore, useOrderedFileEntries } from '@/lib/super-editor/ledger/store';

interface Props {
  orderId: string;
  /** 조판 PDF 미리보기 헤더/파일명에 쓰는 콘텐츠 제목 */
  title?: string;
  /** 결제완료 등으로 잠글 필요가 있을 때 — 추가/수정/삭제 버튼을 숨긴다 */
  locked?: boolean;
}

interface FormState {
  kind:      PlacementKind;
  partyName: string;
  sizeSpec:  string;
  /** 페이지 번호 입력값 — 빈 문자열이면 미정(null) */
  pageNo:    string;
  /** '' = 미정(null) */
  slot:      PlacementSlot | '';
  /** 연결된 원장 이미지 FileEntry.id — '' = 미연결(null) */
  ledgerRef: string;
}

function emptyForm(): FormState {
  return { kind: 'ad', partyName: '', sizeSpec: '', pageNo: '', slot: '', ledgerRef: '' };
}

const SLOT_LABELS: Record<PlacementSlot, string> = { full: '전면', half: '1/2', quarter: '1/4' };

// 목록의 "게재 위치" 표시 — 구조화된 page_no/slot을 사람이 읽는 형태로 (예: "12p · 1/2")
function formatPagePos(p: Placement): string {
  const parts = [
    p.page_no != null ? `${p.page_no}p` : null,
    p.slot ? SLOT_LABELS[p.slot] : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
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

export function PlacementsPanel({ orderId, title = '', locked = false }: Props) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [formOpen, setFormOpen]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm());
  const [busy, setBusy]             = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // "이미지 연결" 셀렉트 후보 — 이 주문의 원장 이미지 엔트리들
  const imageEntries = useOrderedFileEntries(orderId).filter((e) => e.kind === 'image');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/super-editor/placements?orderId=${orderId}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setPlacements(data.placements ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  // 원장 하이드레이션 — 파일 화면을 안 거쳐도 이미지 연결 셀렉트/조판 PDF가 원장을 읽을 수 있게.
  // orderId 키잉 구조라 다른 화면과 동시에 불러도 안전하고, 둘 다 멱등이다.
  useEffect(() => {
    const ledger = useFileLedgerStore.getState();
    void ledger.hydrateFromLocalIndex(orderId);
    void ledger.refreshFromServer(orderId);
  }, [orderId]);

  function openCreateForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(p: Placement) {
    setForm({
      kind: p.kind, partyName: p.party_name, sizeSpec: p.size_spec,
      pageNo: p.page_no != null ? String(p.page_no) : '',
      slot:   p.slot ?? '',
      ledgerRef: p.ledger_ref ?? '',
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
      const pageNo    = form.pageNo.trim() ? Number(form.pageNo.trim()) : null;
      const slot      = form.slot || null;
      const ledgerRef = form.ledgerRef || null;
      if (editingId) {
        const patch = {
          partyName: form.partyName.trim(),
          sizeSpec:  form.sizeSpec.trim(),
          pageNo, slot, ledgerRef,
        };
        await fetch(`/api/admin/super-editor/placements?id=${editingId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(patch),
        });
        setPlacements((prev) => prev.map((p) => (p.id === editingId
          ? { ...p, party_name: patch.partyName, size_spec: patch.sizeSpec, page_no: pageNo, slot, ledger_ref: ledgerRef }
          : p)));
      } else {
        const res = await fetch('/api/admin/super-editor/placements', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            orderId, kind: form.kind,
            partyName: form.partyName.trim(),
            sizeSpec:  form.sizeSpec.trim(),
            pageNo, slot, ledgerRef,
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
        <div className="ml-auto flex items-center gap-2">
          {/* 조판 PDF는 잠금(결제완료) 상태에서도 볼 수 있어야 한다 — 확정본 확인/재다운로드 용도 */}
          <MagazinePdfButton orderId={orderId} title={title} placements={placements} />
          {!locked && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm"
            >
              <Plus size={16} /> 광고·원고 추가
            </button>
          )}
        </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
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
            {/* 게재 위치 — 자유 텍스트 대신 구조화 입력(페이지 번호 + 페이지 안 배치).
                이 두 값이 나중에 PDF 조판 자동화의 입력이 된다. */}
            <input
              type="number"
              min={1}
              value={form.pageNo}
              onChange={(e) => setForm((f) => ({ ...f, pageNo: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="게재 페이지 (예: 12)"
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <select
              value={form.slot}
              onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value as PlacementSlot | '' }))}
              className={clsx(
                'border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300',
                form.slot === '' && 'text-stone-400',
              )}
            >
              <option value="">배치 미정</option>
              {(Object.keys(SLOT_LABELS) as PlacementSlot[]).map((s) => (
                <option key={s} value={s}>{SLOT_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* 이미지 연결(ledger_ref) — 조판 PDF에서 이 항목 자리에 들어갈 원장 이미지.
              미연결이면 조판 시 자리표시 박스로 나간다. 파일 업로드 자체는 "파일 관리"에서. */}
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-stone-400 shrink-0" />
            <select
              value={form.ledgerRef}
              onChange={(e) => setForm((f) => ({ ...f, ledgerRef: e.target.value }))}
              className={clsx(
                'flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300',
                form.ledgerRef === '' && 'text-stone-400',
              )}
            >
              <option value="">이미지 미연결 (조판 시 자리표시)</option>
              {imageEntries.map((e) => (
                <option key={e.id} value={e.id}>{e.origName}</option>
              ))}
              {/* 연결돼 있던 이미지가 목록에 없어도(다른 기기 로컬 전용 등) 연결을 잃지 않게 유지 */}
              {form.ledgerRef && !imageEntries.some((e) => e.id === form.ledgerRef) && (
                <option value={form.ledgerRef}>(연결된 이미지 — 이 기기에 없음)</option>
              )}
            </select>
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
                  <span className="w-32 shrink-0 text-xs text-stone-500 truncate flex items-center gap-1">
                    {formatPagePos(p)}
                    {p.ledger_ref && (
                      <ImageIcon size={11} className="text-emerald-500 shrink-0" aria-label="이미지 연결됨" />
                    )}
                  </span>
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
