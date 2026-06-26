'use client';

import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Plus, Search, Pencil, Trash2, X, Building2, Phone, Mail, Hash, User, StickyNote, ChevronRight,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

interface TaxClient {
  id: string;
  name: string;
  biz_number: string;
  contact: string;
  phone: string;
  email: string;
  memo: string;
  created_at: number;
}

const EMPTY_FORM = { name: '', biz_number: '', contact: '', phone: '', email: '', memo: '' };
type FormData = typeof EMPTY_FORM;

function formatBizNumber(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

function ClientSlidePanel({
  editing,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  editing: TaxClient | null;
  form: FormData;
  saving: boolean;
  error: string;
  onChange: (f: FormData) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">{editing ? '거래처 수정' : '거래처 추가'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Field icon={Building2} label="거래처명" required>
            <input
              type="text"
              value={form.name}
              onChange={e => onChange({ ...form, name: e.target.value })}
              placeholder="㈜ABC컴퍼니"
              className="input-field"
            />
          </Field>

          <Field icon={Hash} label="사업자번호">
            <input
              type="text"
              value={form.biz_number}
              onChange={e => onChange({ ...form, biz_number: formatBizNumber(e.target.value) })}
              placeholder="000-00-00000"
              className="input-field"
              maxLength={12}
            />
          </Field>

          <Field icon={User} label="담당자명">
            <input
              type="text"
              value={form.contact}
              onChange={e => onChange({ ...form, contact: e.target.value })}
              placeholder="홍길동"
              className="input-field"
            />
          </Field>

          <Field icon={Phone} label="연락처">
            <input
              type="tel"
              value={form.phone}
              onChange={e => onChange({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
              className="input-field"
            />
          </Field>

          <Field icon={Mail} label="이메일">
            <input
              type="email"
              value={form.email}
              onChange={e => onChange({ ...form, email: e.target.value })}
              placeholder="contact@example.com"
              className="input-field"
            />
          </Field>

          <Field icon={StickyNote} label="메모">
            <textarea
              value={form.memo}
              onChange={e => onChange({ ...form, memo: e.target.value })}
              placeholder="특이사항이나 참고 내용"
              rows={3}
              className="input-field resize-none"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </aside>
    </>
  );
}

function Field({ icon: Icon, label, required, children }: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
        <Icon size={12} />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function TaxClientsPage() {
  const [clients, setClients] = useState<TaxClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<TaxClient | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TaxClient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/tax/clients');
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setPanelOpen(true);
  }

  function openEdit(client: TaxClient) {
    setEditing(client);
    setForm({
      name:       client.name,
      biz_number: client.biz_number,
      contact:    client.contact,
      phone:      client.phone,
      email:      client.email,
      memo:       client.memo,
    });
    setFormError('');
    setPanelOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setFormError('거래처명은 필수입니다.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const url = editing ? `/api/tax/clients/${editing.id}` : '/api/tax/clients';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? '저장 실패');
        return;
      }
      await fetchClients();
      setPanelOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/tax/clients/${deleteTarget.id}`, { method: 'DELETE' });
      await fetchClients();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.biz_number.includes(q) ||
      c.contact.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">거래처 관리</h1>
          <p className="text-sm text-stone-400 mt-0.5">총 {clients.length}곳</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          거래처 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 거래처" value={`${clients.length}곳`} icon={Building2} color="blue" />
        <StatCard label="이번 달 등록" value={`${clients.filter(c => {
          const d = new Date(c.created_at);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length}곳`} sub="신규" icon={Plus} color="green" />
        <StatCard label="연락처 등록" value={`${clients.filter(c => c.phone).length}곳`} sub="전화번호 있음" icon={Phone} color="amber" />
        <StatCard label="이메일 등록" value={`${clients.filter(c => c.email).length}곳`} sub="이메일 있음" icon={Mail} color="rose" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="거래처명, 사업자번호, 담당자, 연락처 검색"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-stone-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-stone-400">
            <Building2 size={28} className="opacity-30" />
            <p className="text-sm">{search ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다. 추가해보세요.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[2fr_1.4fr_1fr_1.2fr_1.6fr_80px] gap-4 px-5 py-3 text-xs font-semibold text-stone-400 border-b border-stone-100 bg-stone-50">
              <span>거래처명</span>
              <span>사업자번호</span>
              <span>담당자</span>
              <span>연락처</span>
              <span>이메일</span>
              <span className="text-center">관리</span>
            </div>

            <div className="divide-y divide-stone-50">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.4fr_1fr_1.2fr_1.6fr_80px] gap-2 md:gap-4 px-5 py-4 hover:bg-stone-50/60 transition-colors"
                >
                  {/* 거래처명 */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{client.name}</p>
                      {client.memo && (
                        <p className="text-xs text-stone-400 truncate">{client.memo}</p>
                      )}
                    </div>
                  </div>

                  {/* 사업자번호 */}
                  <div className="flex items-center md:block">
                    <span className="md:hidden text-xs text-stone-400 w-16 shrink-0">사업자</span>
                    <span className="text-sm text-stone-600 font-mono">
                      {client.biz_number || <span className="text-stone-300">—</span>}
                    </span>
                  </div>

                  {/* 담당자 */}
                  <div className="flex items-center md:block">
                    <span className="md:hidden text-xs text-stone-400 w-16 shrink-0">담당자</span>
                    <span className="text-sm text-stone-600">
                      {client.contact || <span className="text-stone-300">—</span>}
                    </span>
                  </div>

                  {/* 연락처 */}
                  <div className="flex items-center md:block">
                    <span className="md:hidden text-xs text-stone-400 w-16 shrink-0">연락처</span>
                    {client.phone ? (
                      <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">
                        {client.phone}
                      </a>
                    ) : (
                      <span className="text-stone-300 text-sm">—</span>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div className="flex items-center md:block min-w-0">
                    <span className="md:hidden text-xs text-stone-400 w-16 shrink-0">이메일</span>
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline truncate block">
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-stone-300 text-sm">—</span>
                    )}
                  </div>

                  {/* 관리 버튼 */}
                  <div className="flex items-center justify-start md:justify-center gap-1.5 pt-1 md:pt-0">
                    <button
                      onClick={() => openEdit(client)}
                      className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                      title="수정"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(client)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400 text-right">
              {search ? `검색 결과 ${filtered.length}곳 / 전체 ${clients.length}곳` : `전체 ${clients.length}곳`}
            </div>
          </>
        )}
      </div>

      {/* 추가/수정 슬라이드 패널 */}
      {panelOpen && (
        <ClientSlidePanel
          editing={editing}
          form={form}
          saving={saving}
          error={formError}
          onChange={setForm}
          onSubmit={handleSubmit}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800">거래처 삭제</h3>
                  <p className="text-sm text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700">{deleteTarget.name}</span>을(를) 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-red-600 mt-2">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
