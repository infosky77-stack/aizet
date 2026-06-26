'use client';

import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Plus, ChevronLeft, ChevronRight, X, Building2,
  Clock, Loader2, CheckCircle2, AlertTriangle, Trash2, Pencil,
  CalendarDays, FileText, ShieldAlert,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

/* ── 타입 ───────────────────────────────────────────────── */
type FilingType   = 'vat' | 'income' | 'corp' | 'withholding';
type FilingStatus = 'pending' | 'in_progress' | 'done';

interface TaxFiling {
  id:          string;
  client_id:   string;
  client_name: string;
  type:        FilingType;
  year:        number;
  month:       number;
  due_date:    string;
  status:      FilingStatus;
  filed_at:    number | null;
  memo:        string;
}

interface TaxClient {
  id:   string;
  name: string;
}

/* ── 상수 ───────────────────────────────────────────────── */
const TYPE_META: Record<FilingType, { label: string; color: string; bg: string }> = {
  vat:         { label: '부가세',  color: 'text-violet-700', bg: 'bg-violet-100' },
  income:      { label: '소득세',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  corp:        { label: '법인세',  color: 'text-indigo-700', bg: 'bg-indigo-100' },
  withholding: { label: '원천세',  color: 'text-cyan-700',   bg: 'bg-cyan-100'   },
};

const STATUS_META: Record<FilingStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending:     { label: '대기',   icon: <Clock size={11} />,        color: 'text-amber-700',  bg: 'bg-amber-100'  },
  in_progress: { label: '진행 중', icon: <Loader2 size={11} />,      color: 'text-blue-700',   bg: 'bg-blue-100'   },
  done:        { label: '완료',   icon: <CheckCircle2 size={11} />, color: 'text-green-700',  bg: 'bg-green-100'  },
};

const STATUS_TABS: { value: FilingStatus | 'all'; label: string }[] = [
  { value: 'all',         label: '전체'   },
  { value: 'pending',     label: '대기'   },
  { value: 'in_progress', label: '진행 중' },
  { value: 'done',        label: '완료'   },
];

const TYPE_OPTIONS: { value: FilingType; label: string }[] = [
  { value: 'vat',         label: '부가가치세 (VAT)' },
  { value: 'income',      label: '소득세'           },
  { value: 'corp',        label: '법인세'           },
  { value: 'withholding', label: '원천세'           },
];

const EMPTY_FORM = {
  client_id: '',
  type:      'vat' as FilingType,
  year:      new Date().getFullYear(),
  month:     new Date().getMonth() + 1,
  due_date:  '',
  memo:      '',
};

/* ── D-day 계산 ─────────────────────────────────────────── */
function dday(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function DdayBadge({ due_date, status }: { due_date: string; status: FilingStatus }) {
  if (status === 'done') return null;
  const d = dday(due_date);
  if (d < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">D+{Math.abs(d)} 초과</span>;
  if (d === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">D-DAY</span>;
  if (d <= 7)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">D-{d}</span>;
  if (d <= 30) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">D-{d}</span>;
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">D-{d}</span>;
}

/* ── 상태 변경 버튼 ─────────────────────────────────────── */
function StatusButtons({ filing, onChange }: {
  filing: TaxFiling;
  onChange: (filing: TaxFiling, status: FilingStatus) => void;
}) {
  if (filing.status === 'pending') {
    return (
      <button onClick={() => onChange(filing, 'in_progress')}
        className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
        진행 시작
      </button>
    );
  }
  if (filing.status === 'in_progress') {
    return (
      <div className="flex gap-1">
        <button onClick={() => onChange(filing, 'done')}
          className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
          완료
        </button>
        <button onClick={() => onChange(filing, 'pending')}
          className="text-[10px] font-bold px-2 py-1 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200 transition-colors">
          되돌리기
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => onChange(filing, 'in_progress')}
      className="text-[10px] font-bold px-2 py-1 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200 transition-colors">
      재개
    </button>
  );
}

/* ── 슬라이드 패널 ─────────────────────────────────────── */
function FilingPanel({
  editing, form, clients, saving, error,
  onChange, onSubmit, onClose,
}: {
  editing:  TaxFiling | null;
  form:     typeof EMPTY_FORM;
  clients:  TaxClient[];
  saving:   boolean;
  error:    string;
  onChange: (f: typeof EMPTY_FORM) => void;
  onSubmit: () => void;
  onClose:  () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-40 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">{editing ? '신고 수정' : '신고 추가'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <Building2 size={12} /> 거래처 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.client_id}
              onChange={e => onChange({ ...form, client_id: e.target.value })}
              className="input-field"
            >
              <option value="">— 거래처 선택 —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <FileText size={12} /> 신고 종류 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={e => onChange({ ...form, type: e.target.value as FilingType })}
              className="input-field"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">연도</label>
              <input
                type="number"
                value={form.year}
                min={2020}
                max={2030}
                onChange={e => onChange({ ...form, year: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">월</label>
              <select
                value={form.month}
                onChange={e => onChange({ ...form, month: Number(e.target.value) })}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}월</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <CalendarDays size={12} /> 신고 기한 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => onChange({ ...form, due_date: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">메모</label>
            <textarea
              value={form.memo}
              onChange={e => onChange({ ...form, memo: e.target.value })}
              rows={3}
              placeholder="참고 사항"
              className="input-field resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
            취소
          </button>
          <button onClick={onSubmit} disabled={saving || !form.client_id || !form.due_date}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-colors">
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function TaxFilingsPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab,   setTab]   = useState<FilingStatus | 'all'>('all');

  const [filings, setFilings]     = useState<TaxFiling[]>([]);
  const [clients, setClients]     = useState<TaxClient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing,  setEditing]    = useState<TaxFiling | null>(null);
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [saving,   setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TaxFiling | null>(null);
  const [deleting, setDeleting] = useState(false);
  // 미검수 문서 확인 모달
  const [unconfirmedModal, setUnconfirmedModal] = useState<{
    filingId: string; clientId: string; clientName: string; count: number;
  } | null>(null);

  const fetchFilings = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/tax/filings?year=${year}&month=${month}`);
    const data = await res.json();
    setFilings(data.filings ?? []);
    setLoading(false);
  }, [year, month]);

  const fetchClients = useCallback(async () => {
    const res  = await fetch('/api/tax/clients');
    const data = await res.json();
    setClients(data.clients ?? []);
  }, []);

  useEffect(() => { fetchFilings(); }, [fetchFilings]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, year, month });
    setFormError('');
    setPanelOpen(true);
  }

  function openEdit(f: TaxFiling) {
    setEditing(f);
    setForm({ client_id: f.client_id, type: f.type, year: f.year, month: f.month, due_date: f.due_date, memo: f.memo });
    setFormError('');
    setPanelOpen(true);
  }

  async function handleSubmit() {
    if (!form.client_id) { setFormError('거래처를 선택해주세요.'); return; }
    if (!form.due_date)  { setFormError('기한일을 입력해주세요.');  return; }
    setSaving(true);
    setFormError('');
    try {
      const url    = editing ? `/api/tax/filings/${editing.id}` : '/api/tax/filings';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error ?? '저장 실패'); return; }
      await fetchFilings();
      setPanelOpen(false);
    } finally { setSaving(false); }
  }

  async function doStatusChange(id: string, status: FilingStatus) {
    await fetch(`/api/tax/filings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchFilings();
  }

  async function handleStatusChange(filing: TaxFiling, status: FilingStatus) {
    if (status === 'done') {
      // 해당 거래처 미검수 문서 수 조회
      const res  = await fetch(`/api/tax/documents?count_client=${filing.client_id}`);
      const data = await res.json();
      const count: number = data.count ?? 0;
      if (count > 0) {
        setUnconfirmedModal({ filingId: filing.id, clientId: filing.client_id, clientName: filing.client_name, count });
        return;
      }
    }
    await doStatusChange(filing.id, status);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/tax/filings/${deleteTarget.id}`, { method: 'DELETE' });
      await fetchFilings();
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  const filtered = filings.filter(f => tab === 'all' || f.status === tab);

  /* 통계 */
  const urgent  = filings.filter(f => f.status !== 'done' && dday(f.due_date) <= 7).length;
  const pending = filings.filter(f => f.status === 'pending').length;
  const inProg  = filings.filter(f => f.status === 'in_progress').length;
  const done    = filings.filter(f => f.status === 'done').length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">신고 현황</h1>
          <p className="text-sm text-stone-400 mt-0.5">거래처별 세금 신고 진행 상태</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">
          <Plus size={15} /> 신고 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 신고"   value={`${filings.length}건`}                                 icon={FileText}      color="blue"  />
        <StatCard label="대기"        value={`${pending}건`}  sub="진행 전"                         icon={Clock}         color="amber" />
        <StatCard label="진행 중"     value={`${inProg}건`}                                          icon={Loader2}       color="blue"  />
        <StatCard label="완료"        value={`${done}건`}     sub={`미완료 ${filings.length - done}건`} icon={CheckCircle2} color="green" />
      </div>

      {/* 기한 임박 경고 */}
      {urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">7일 내 기한 임박 {urgent}건</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {filings
                .filter(f => f.status !== 'done' && dday(f.due_date) <= 7)
                .map(f => (
                  <span key={f.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                    {f.client_name} · {TYPE_META[f.type].label} · D-{Math.max(0, dday(f.due_date))}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 월 선택기 */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-stone-800 w-28 text-center">{year}년 {month}월</span>
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ChevronRight size={16} />
        </button>
        {(year !== now.getFullYear() || month !== now.getMonth() + 1) && (
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
            className="text-xs text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            이번 달로
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value === 'all' ? filings.length : filings.filter(f => f.status === value).length;
          return (
            <button key={value} onClick={() => setTab(value)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
                tab === value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              )}>
              {label}
              <span className={clsx(
                'text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold',
                tab === value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-stone-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-stone-400">
            <FileText size={28} className="opacity-30" />
            <p className="text-sm">
              {filings.length === 0 ? '이 달 신고 내역이 없습니다. 추가해보세요.' : '해당 상태의 신고가 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            {/* 데스크탑 헤더 */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_110px_80px] gap-3 px-5 py-3 text-xs font-semibold text-stone-400 border-b border-stone-100 bg-stone-50">
              <span>거래처</span><span>신고 종류</span><span>기한일</span><span>D-day</span><span>상태</span><span>처리</span><span className="text-center">관리</span>
            </div>

            <div className="divide-y divide-stone-50">
              {filtered.map(f => {
                const sm = STATUS_META[f.status];
                const tm = TYPE_META[f.type];
                return (
                  <div key={f.id}
                    className={clsx(
                      'grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_110px_80px] gap-2 md:gap-3 px-5 py-4 hover:bg-stone-50/60 transition-colors',
                      f.status !== 'done' && dday(f.due_date) <= 7 && 'border-l-4 border-red-400'
                    )}>
                    {/* 거래처 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Building2 size={13} className="text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{f.client_name}</p>
                        {f.memo && <p className="text-xs text-stone-400 truncate">{f.memo}</p>}
                      </div>
                    </div>
                    {/* 신고 종류 */}
                    <div className="flex items-center">
                      <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', tm.bg, tm.color)}>
                        {tm.label}
                      </span>
                    </div>
                    {/* 기한일 */}
                    <div className="flex items-center">
                      <span className="text-sm text-stone-600">{f.due_date}</span>
                    </div>
                    {/* D-day */}
                    <div className="flex items-center">
                      <DdayBadge due_date={f.due_date} status={f.status} />
                    </div>
                    {/* 상태 배지 */}
                    <div className="flex items-center">
                      <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', sm.bg, sm.color)}>
                        {sm.icon}{sm.label}
                      </span>
                    </div>
                    {/* 처리 버튼 */}
                    <div className="flex items-center">
                      <StatusButtons filing={f} onChange={handleStatusChange} />
                    </div>
                    {/* 수정/삭제 */}
                    <div className="flex items-center justify-start md:justify-center gap-1.5">
                      <button onClick={() => openEdit(f)}
                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        title="수정">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(f)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                        title="삭제">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400 text-right">
              {tab === 'all' ? `전체 ${filings.length}건` : `${filtered.length}건 / 전체 ${filings.length}건`}
            </div>
          </>
        )}
      </div>

      {/* 슬라이드 패널 */}
      {panelOpen && (
        <FilingPanel
          editing={editing} form={form} clients={clients}
          saving={saving} error={formError}
          onChange={setForm} onSubmit={handleSubmit}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* 미검수 문서 강제 완료 확인 */}
      {unconfirmedModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setUnconfirmedModal(null)} />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800">미검수 문서가 있습니다</h3>
                  <p className="text-sm text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700">{unconfirmedModal.clientName}</span>의
                    미검수 문서가 <span className="font-bold text-amber-700">{unconfirmedModal.count}건</span> 남아 있습니다.
                  </p>
                  <p className="text-xs text-stone-400 mt-2">검수 완료 후 신고를 완료 처리하는 것을 권장합니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setUnconfirmedModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
                  취소
                </button>
                <button
                  onClick={async () => {
                    await doStatusChange(unconfirmedModal.filingId, 'done');
                    setUnconfirmedModal(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors">
                  강제 완료
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 삭제 확인 */}
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
                  <h3 className="font-bold text-stone-800">신고 삭제</h3>
                  <p className="text-sm text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700">{deleteTarget.client_name}</span>의{' '}
                    {TYPE_META[deleteTarget.type].label} 신고를 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-red-600 mt-2">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
                  취소
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
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
