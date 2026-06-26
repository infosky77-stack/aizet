'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Upload, FileText, Image, X, CheckCircle2, AlertCircle, Trash2,
  RotateCcw, Eye, Pencil, Download, Filter,
  Sparkles, Loader2, Building2, ShieldAlert, History,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

/* ── 타입 ───────────────────────────────────────────────── */
interface TaxDocument {
  id: string; client_id: string; client_name: string;
  filename: string; mime_type: string; file_size: number;
  local_path: string | null; drive_file_id: string | null; drive_url: string | null;
  doc_date: string | null; amount: number | null; vendor: string; category: string;
  ai_date: string | null; ai_amount: number | null; ai_vendor: string; ai_category: string;
  ai_raw: string; ai_confirmed: number;
  anomaly_flag: number; anomaly_note: string;
  deleted_at: number | null; deleted_by: string | null;
  created_at: number;
}
interface TaxClient { id: string; name: string; }
interface AIResult { date: string | null; amount: number | null; vendor: string; category: string; }
interface TaxDocumentEdit {
  id: string; document_id: string; user_id: string;
  field: string; old_value: string | null; new_value: string | null;
  edited_by: string; created_at: number;
}

/* ── 상수 ───────────────────────────────────────────────── */
const CATEGORIES = ['식비','교통비','숙박비','사무용품','통신비','광고비','임차료','공과금','세금','기타'];

const CATEGORY_COLOR: Record<string, string> = {
  식비:'bg-orange-100 text-orange-700', 교통비:'bg-blue-100 text-blue-700',
  숙박비:'bg-indigo-100 text-indigo-700', 사무용품:'bg-stone-100 text-stone-700',
  통신비:'bg-cyan-100 text-cyan-700', 광고비:'bg-pink-100 text-pink-700',
  임차료:'bg-violet-100 text-violet-700', 공과금:'bg-teal-100 text-teal-700',
  세금:'bg-red-100 text-red-700', 기타:'bg-gray-100 text-gray-600',
};

/* ── 유틸 ─────��─────────────────────────────────────────── */
function fmtBytes(b: number) {
  if (b >= 1024*1024) return `${(b/1024/1024).toFixed(1)} MB`;
  return `${(b/1024).toFixed(0)} KB`;
}
function fmtAmount(a: number | null) {
  if (a == null) return '—';
  return `${a.toLocaleString()}원`;
}
function isImage(mimeType: string) { return mimeType.startsWith('image/'); }

/* ── 수정이력 헬퍼 ──────────────────────────────────────── */
const FIELD_LABEL: Record<string, string> = {
  doc_date:     '날짜',
  amount:       '금액',
  vendor:       '공급자',
  category:     '카테고리',
  ai_confirmed: '검수 상태',
};

function fmtEditValue(field: string, val: string | null): string {
  if (val == null || val === '') return '—';
  if (field === 'amount')       return `${Number(val).toLocaleString()}원`;
  if (field === 'ai_confirmed') return val === '1' ? '완료' : '대기';
  return val;
}

function fmtEditTime(ts: number): string {
  return new Date(ts).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── AI 검수 패널 ───────────────────────────────────────── */
function AIReviewPanel({
  doc, edits, onConfirm, onClose,
}: { doc: TaxDocument; edits: TaxDocumentEdit[]; onConfirm: (doc: TaxDocument) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    doc_date: doc.doc_date ?? '',
    amount:   doc.amount != null ? String(doc.amount) : '',
    vendor:   doc.vendor,
    category: doc.category || '기타',
  });
  const [saving, setSaving] = useState(false);
  const fileUrl = doc.drive_url ?? `/api/tax/documents/${doc.id}/file`;

  async function handleConfirm() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tax/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_date:     form.doc_date  || null,
          amount:       form.amount    ? Number(form.amount) : null,
          vendor:       form.vendor,
          category:     form.category,
          ai_confirmed: 1,
        }),
      });
      const data = await res.json();
      onConfirm(data.document);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-500" />
              <h2 className="font-bold text-stone-800">AI 추출 결과 검수</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center">
              <X size={14} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
            {/* 문서 미리보기 */}
            <div className="rounded-xl overflow-hidden border border-stone-100 bg-stone-50 flex items-center justify-center" style={{ height: 160 }}>
              {isImage(doc.mime_type) ? (
                <img src={fileUrl} alt={doc.filename} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <FileText size={32} />
                  <span className="text-xs">{doc.filename}</span>
                </div>
              )}
            </div>

            {/* AI 추출 결과 안내 */}
            <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <Sparkles size={14} className="text-violet-500 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-700">
                Gemini AI가 자동 추출했습니다. 내용을 확인·수정 후 <strong>확인 완료</strong>를 눌러주세요.
              </p>
            </div>

            {/* 폼 */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500">날짜</label>
                  <input type="date" value={form.doc_date}
                    onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))}
                    className="input-field" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500">금액 (원)</label>
                  <input type="number" value={form.amount} min={0}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0" className="input-field" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">공급자/상호명</label>
                <input type="text" value={form.vendor}
                  onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                  placeholder="○○마트" className="input-field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">카테고리</label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 수정 이력 */}
            {edits.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                  <History size={12} /> 수정 이력
                </p>
                <div className="flex flex-col gap-1">
                  {edits.map(e => (
                    <div key={e.id} className="flex items-start gap-2 bg-stone-50 rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-stone-700">
                          {FIELD_LABEL[e.field] ?? e.field}
                        </span>
                        <span className="text-xs text-stone-400 ml-2">
                          {fmtEditValue(e.field, e.old_value)}
                          {' → '}
                          <span className="text-stone-600">{fmtEditValue(e.field, e.new_value)}</span>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-stone-400">{e.edited_by}</p>
                        <p className="text-[10px] text-stone-400">{fmtEditTime(e.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
              나중에
            </button>
            <button onClick={handleConfirm} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              확인 완료
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 업로드 패널 ────────────────────────────────────────── */
function UploadPanel({
  clients, onUploaded, onClose,
}: { clients: TaxClient[]; onUploaded: (doc: TaxDocument) => void; onClose: () => void }) {
  const [clientId,  setClientId]  = useState('');
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file || !clientId) { setError('파일과 거래처를 모두 선택해주세요.'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('client_id', clientId);
      const res  = await fetch('/api/tax/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '업로드 실패'); return; }
      onUploaded(data.document);
    } finally { setUploading(false); }
  }

  const isImg = file ? isImage(file.type) : false;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-40 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">문서 업로드</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* 파일 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <Upload size={12} /> 파일 <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => inputRef.current?.click()}
              className={clsx(
                'w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors',
                file ? 'border-violet-300 bg-violet-50' : 'border-stone-200 hover:border-stone-300 bg-stone-50'
              )}>
              {file ? (
                <>
                  {isImg
                    ? <Image size={24} className="text-violet-500" />
                    : <FileText size={24} className="text-violet-500" />}
                  <span className="text-xs font-semibold text-violet-700 text-center px-2 break-all">{file.name}</span>
                  <span className="text-xs text-stone-400">{fmtBytes(file.size)}</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-stone-400" />
                  <span className="text-xs text-stone-500">클릭하여 파일 선택</span>
                  <span className="text-xs text-stone-400">JPG · PNG · WebP · GIF · PDF</span>
                </>
              )}
            </button>
            <input ref={inputRef} type="file" className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
          </div>

          {/* 거래처 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <Building2 size={12} /> 거래처 <span className="text-red-500">*</span>
            </label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="input-field">
              <option value="">— 거래처 선택 —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* AI 안내 */}
          {file && isImg && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <Sparkles size={14} className="text-violet-500 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-700">
                이미지 업로드 후 <strong>Gemini AI</strong>가 날짜·금액·카테고리를 자동으로 추출합니다.
                업로드 후 검수 화면에서 결과를 확인하고 수정할 수 있습니다.
              </p>
            </div>
          )}
          {file && !isImg && (
            <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <FileText size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <p className="text-xs text-stone-500">PDF는 AI 자동 추출을 지원하지 않습니다. 업로드 후 직접 입력해주세요.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">취소</button>
          <button onClick={handleUpload} disabled={uploading || !file || !clientId}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {uploading ? <><Loader2 size={14} className="animate-spin" />분석 중…</> : <><Upload size={14} />업로드</>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function TaxDocumentsPage() {
  const [documents,    setDocuments]    = useState<TaxDocument[]>([]);
  const [clients,      setClients]      = useState<TaxClient[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showDeleted,  setShowDeleted]  = useState(false);

  // 필터
  const [filterClient,   setFilterClient]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterConfirmed, setFilterConfirmed] = useState('');

  // 패널
  const [uploadOpen,   setUploadOpen]   = useState(false);
  const [reviewDoc,    setReviewDoc]    = useState<TaxDocument | null>(null);
  const [reviewEdits,  setReviewEdits]  = useState<TaxDocumentEdit[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<TaxDocument | null>(null);
  const [editDoc,      setEditDoc]      = useState<TaxDocument | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (showDeleted) params.set('deleted', '1');
    if (filterClient)   params.set('client_id', filterClient);
    if (filterCategory) params.set('category',  filterCategory);
    if (filterConfirmed !== '') params.set('confirmed', filterConfirmed);
    const res  = await fetch(`/api/tax/documents?${params}`);
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }, [showDeleted, filterClient, filterCategory, filterConfirmed]);

  const fetchClients = useCallback(async () => {
    const res  = await fetch('/api/tax/clients');
    const data = await res.json();
    setClients(data.clients ?? []);
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { fetchClients(); },  [fetchClients]);

  async function openReview(doc: TaxDocument) {
    openReview(doc);
    setReviewEdits([]);
    const res  = await fetch(`/api/tax/documents/${doc.id}/history`);
    const data = await res.json();
    setReviewEdits(data.edits ?? []);
  }

  function handleUploaded(doc: TaxDocument) {
    setUploadOpen(false);
    fetchDocuments();
    // 이미지면 즉시 AI 검수 팝업 (신규 업로드라 이력 없음)
    if (doc.mime_type.startsWith('image/')) openReview(doc);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/tax/documents/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await fetchDocuments();
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  async function handleRestore(doc: TaxDocument) {
    await fetch(`/api/tax/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    fetchDocuments();
  }

  const pendingReview = documents.filter(d => !d.ai_confirmed && !d.deleted_at && d.mime_type.startsWith('image/')).length;
  const totalSize     = documents.filter(d => !d.deleted_at).reduce((s, d) => s + d.file_size, 0);
  const driveLinked   = documents.filter(d => !d.deleted_at && d.drive_file_id).length;
  const anomalyCount  = documents.filter(d => !d.deleted_at && d.anomaly_flag > 0).length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">문서 보관</h1>
          <p className="text-sm text-stone-400 mt-0.5">영수증 · 세금계산서 이중 백업 (서버 + Google Drive)</p>
        </div>
        <button onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">
          <Upload size={15} /> 문서 업로드
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 문서"   value={`${documents.filter(d=>!d.deleted_at).length}건`} icon={FileText}      color="blue"  />
        <StatCard label="AI 검수 대기" value={`${pendingReview}건`} sub="이미지 문서" icon={Sparkles}    color="amber" />
        <StatCard label="Drive 연동" value={`${driveLinked}건`} sub="이중 백업됨"    icon={CheckCircle2} color="green" />
        <StatCard label="서버 용량"   value={fmtBytes(totalSize)}                    icon={Download}     color="rose"  />
      </div>

      {/* AI 검수 대기 배너 */}
      {pendingReview > 0 && !showDeleted && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">AI 검수 대기 {pendingReview}건</p>
            <p className="text-xs text-amber-600 mt-0.5">AI가 자동 추출한 내용을 검수해주세요.</p>
          </div>
          <button
            onClick={() => { setFilterConfirmed('0'); }}
            className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors">
            검수하기
          </button>
        </div>
      )}

      {/* 이상치 경고 배너 */}
      {anomalyCount > 0 && !showDeleted && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <ShieldAlert size={18} className="text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-800">이상치 감지 {anomalyCount}건</p>
            <p className="text-xs text-orange-600 mt-0.5">금액 또는 날짜 이상이 감지된 문서를 확인해주세요.</p>
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
          <Filter size={12} /> 필터
        </div>

        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 bg-white outline-none focus:border-slate-400">
          <option value="">거래처 전체</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 bg-white outline-none focus:border-slate-400">
          <option value="">카테고리 전체</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterConfirmed} onChange={e => setFilterConfirmed(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 bg-white outline-none focus:border-slate-400">
          <option value="">검수 전체</option>
          <option value="1">검수 완료</option>
          <option value="0">검수 대기</option>
        </select>

        {(filterClient || filterCategory || filterConfirmed) && (
          <button onClick={() => { setFilterClient(''); setFilterCategory(''); setFilterConfirmed(''); }}
            className="text-xs text-stone-500 hover:text-stone-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            초기화
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={() => setShowDeleted(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors',
              showDeleted ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
            )}>
            <Trash2 size={12} />
            {showDeleted ? '삭제된 문서 보는 중' : '삭제된 문서 보기'}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-stone-400 text-sm">불러오는 중...</div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-stone-400">
            <FileText size={28} className="opacity-30" />
            <p className="text-sm">
              {showDeleted ? '삭제된 문서가 없습니다.' : '등록된 문서가 없습니다. 업로드해보세요.'}
            </p>
          </div>
        ) : (
          <>
            {/* 데스크탑 헤더 */}
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_90px] gap-3 px-5 py-3 text-xs font-semibold text-stone-400 border-b border-stone-100 bg-stone-50">
              <span>파일명</span><span>거래처</span><span>날짜</span><span>금액</span><span>카테고리</span><span>검수</span><span className="text-center">관리</span>
            </div>

            <div className="divide-y divide-stone-50">
              {documents.map(doc => (
                <div key={doc.id}
                  className={clsx(
                    'grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_90px] gap-2 lg:gap-3 px-5 py-4 transition-colors',
                    doc.deleted_at ? 'opacity-60 bg-red-50/30' : 'hover:bg-stone-50/60',
                    !doc.deleted_at && doc.anomaly_flag > 0
                      ? 'border-l-4 border-orange-400'
                      : !doc.ai_confirmed && !doc.deleted_at && doc.mime_type.startsWith('image/')
                        ? 'border-l-4 border-amber-400'
                        : ''
                  )}>

                  {/* 파일명 */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isImage(doc.mime_type) ? 'bg-blue-50' : 'bg-stone-100'
                    )}>
                      {isImage(doc.mime_type)
                        ? <Image size={14} className="text-blue-500" />
                        : <FileText size={14} className="text-stone-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{doc.filename}</p>
                      <p className="text-xs text-stone-400">{fmtBytes(doc.file_size)}</p>
                    </div>
                  </div>

                  {/* 거래처 */}
                  <div className="flex items-center">
                    <span className="text-sm text-stone-600 truncate">{doc.client_name}</span>
                  </div>

                  {/* 날짜 */}
                  <div className="flex items-center">
                    <span className="text-sm text-stone-600">{doc.doc_date ?? <span className="text-stone-300">—</span>}</span>
                  </div>

                  {/* 금액 */}
                  <div className="flex items-center">
                    <span className="text-sm text-stone-700 font-medium">{fmtAmount(doc.amount)}</span>
                  </div>

                  {/* 카테고리 */}
                  <div className="flex items-center">
                    {doc.category
                      ? <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', CATEGORY_COLOR[doc.category] ?? CATEGORY_COLOR['기타'])}>{doc.category}</span>
                      : <span className="text-stone-300 text-sm">—</span>}
                  </div>

                  {/* 검수 상태 */}
                  <div className="flex flex-col items-start gap-1">
                    {doc.deleted_at ? (
                      <div>
                        <span className="text-xs text-red-500 font-semibold">삭제됨</span>
                        {doc.deleted_by && <p className="text-[10px] text-stone-400">{doc.deleted_by}</p>}
                      </div>
                    ) : doc.mime_type.startsWith('image/') ? (
                      doc.ai_confirmed
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} />완료</span>
                        : <button onClick={() => openReview(doc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors">
                            <Sparkles size={10} />검수 필요
                          </button>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                    {!doc.deleted_at && doc.anomaly_flag > 0 && (
                      <span
                        title={doc.anomaly_note}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full cursor-help">
                        <ShieldAlert size={9} />이상치
                      </span>
                    )}
                  </div>

                  {/* 관리 버튼 */}
                  <div className="flex items-center justify-start lg:justify-center gap-1">
                    {doc.deleted_at ? (
                      <button onClick={() => handleRestore(doc)} title="복구"
                        className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors">
                        <RotateCcw size={12} />
                      </button>
                    ) : (
                      <>
                        {/* 보기 */}
                        <a href={doc.drive_url ?? `/api/tax/documents/${doc.id}/file`}
                          target="_blank" rel="noopener noreferrer" title="파일 보기"
                          className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Eye size={12} />
                        </a>
                        {/* 수정(검수) */}
                        <button onClick={() => openReview(doc)} title="정보 수정"
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors">
                          <Pencil size={12} />
                        </button>
                        {/* 삭제 */}
                        <button onClick={() => setDeleteTarget(doc)} title="삭제"
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400 text-right">
              {documents.length}건
              {showDeleted && ' (삭제된 문서 · 30일 후 영구 삭제)'}
            </div>
          </>
        )}
      </div>

      {/* 업로드 패널 */}
      {uploadOpen && (
        <UploadPanel clients={clients} onUploaded={handleUploaded} onClose={() => setUploadOpen(false)} />
      )}

      {/* AI 검수 / 수정 패널 */}
      {reviewDoc && (
        <AIReviewPanel
          doc={reviewDoc}
          edits={reviewEdits}
          onConfirm={() => { setReviewDoc(null); setReviewEdits([]); fetchDocuments(); }}
          onClose={() => { setReviewDoc(null); setReviewEdits([]); }}
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
                  <h3 className="font-bold text-stone-800">문서 삭제</h3>
                  <p className="text-sm text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700">{deleteTarget.filename}</span>을(를) 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-stone-400 mt-2">삭제된 문서는 30일간 복구 가능하며, 이후 영구 삭제됩니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">취소</button>
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
