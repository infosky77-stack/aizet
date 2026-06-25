'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, Plus, Trash2, RefreshCw, ShieldCheck, AlertCircle,
  CheckCircle, Clock, Copy, Check, ExternalLink, Info,
} from 'lucide-react';
import type { DomainRecord, DomainStatus, SslStatus } from '@/lib/db/domains';

// ── 상수 ────────────────────────────────────────────────────────────────────────
const SITE_SLUGS = [
  { value: 'demo',     label: '중화요리 식당 (demo)' },
  { value: 'hancandy', label: '한캔디 쇼핑몰 (hancandy)' },
  { value: 'korean',   label: '한국어 교육 (korean)' },
  { value: 'print',    label: '인쇄소 (print)' },
  { value: 'tax',      label: '세무법인 (tax)' },
];

const STATUS_META: Record<DomainStatus, { label: string; color: string; dot: string }> = {
  pending: { label: 'DNS 미확인', color: 'bg-stone-100 text-stone-600',  dot: 'bg-stone-400' },
  dns_ok:  { label: 'DNS 확인됨', color: 'bg-blue-100  text-blue-700',   dot: 'bg-blue-500' },
  active:  { label: '연결됨',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500 animate-pulse' },
  error:   { label: '오류',       color: 'bg-red-100   text-red-700',    dot: 'bg-red-500' },
};

const SSL_META: Record<SslStatus, { label: string; color: string }> = {
  none:    { label: 'SSL 없음',   color: 'text-stone-400' },
  issuing: { label: 'SSL 발급 중...', color: 'text-amber-500' },
  active:  { label: 'SSL 정상',   color: 'text-green-600' },
  expired: { label: 'SSL 만료',   color: 'text-orange-500' },
  error:   { label: 'SSL 오류',   color: 'text-red-500' },
};

// ── 타입 ────────────────────────────────────────────────────────────────────────
interface ApiDomain extends DomainRecord {
  domain: string;
}

// ── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
      title="복사"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

// ── DomainCard ───────────────────────────────────────────────────────────────
function DomainCard({
  rec,
  onVerify,
  onIssueSSL,
  onDelete,
  loading,
}: {
  rec: ApiDomain;
  onVerify: (domain: string) => void;
  onIssueSSL: (domain: string) => void;
  onDelete: (domain: string) => void;
  loading: string | null; // domain currently loading
}) {
  const busy = loading === rec.domain;
  const sm   = STATUS_META[rec.status];
  const ssl  = SSL_META[rec.sslStatus];
  const slug = SITE_SLUGS.find(s => s.value === rec.siteSlug)?.label ?? rec.siteSlug;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
      {/* 상단: 도메인명 + 상태 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe size={15} className="text-stone-400 shrink-0" />
            <span className="font-bold text-stone-800 text-sm break-all">{rec.domain}</span>
            {rec.status === 'active' && (
              <a
                href={`https://${rec.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
                title="사이트 열기"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">→ {slug}</p>
        </div>

        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${sm.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
          {sm.label}
        </span>
      </div>

      {/* SSL 상태 */}
      <div className="flex items-center gap-2">
        {rec.sslStatus === 'active'
          ? <ShieldCheck size={14} className="text-green-500 shrink-0" />
          : rec.sslStatus === 'error' || rec.sslStatus === 'expired'
          ? <AlertCircle size={14} className="text-red-400 shrink-0" />
          : <Clock size={14} className="text-stone-300 shrink-0" />
        }
        <span className={`text-xs font-medium ${ssl.color}`}>{ssl.label}</span>
        {rec.sslExpiresAt && rec.sslStatus === 'active' && (
          <span className="text-xs text-stone-400">
            · 만료 {new Date(rec.sslExpiresAt).toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>

      {/* 오류 메시지 */}
      {rec.errorMsg && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 leading-relaxed">
          {rec.errorMsg}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* DNS 확인 */}
        {(rec.status === 'pending' || rec.status === 'dns_ok' || rec.status === 'error') && (
          <button
            onClick={() => onVerify(rec.domain)}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={11} className={busy ? 'animate-spin' : ''} />
            DNS 확인
          </button>
        )}

        {/* SSL 발급 */}
        {(rec.status === 'dns_ok' || (rec.status === 'active' && rec.sslStatus !== 'active')) && rec.sslStatus !== 'issuing' && (
          <button
            onClick={() => onIssueSSL(rec.domain)}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            <ShieldCheck size={11} />
            SSL 발급
          </button>
        )}

        {/* SSL 발급 중 */}
        {rec.sslStatus === 'issuing' && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} className="animate-pulse" />
            SSL 발급 중 (최대 수분)
          </span>
        )}

        {/* 정상 연결 */}
        {rec.status === 'active' && rec.sslStatus === 'active' && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700">
            <CheckCircle size={11} />
            정상 운영 중
          </span>
        )}

        {/* 삭제 */}
        <button
          onClick={() => onDelete(rec.domain)}
          disabled={busy}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={11} />
          삭제
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DomainAdminPage() {
  const [domains, setDomains]     = useState<ApiDomain[]>([]);
  const [serverIp, setServerIp]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  // 추가 폼
  const [newDomain, setNewDomain] = useState('');
  const [newSlug, setNewSlug]     = useState('demo');
  const [adding, setAdding]       = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/domains');
      if (!res.ok) return;
      const data = await res.json() as { domains: ApiDomain[]; serverIp: string };
      setDomains(data.domains);
      setServerIp(data.serverIp);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDomains().finally(() => setLoading(false));
  }, [fetchDomains]);

  // SSL 발급 중인 도메인이 있으면 10초마다 자동 갱신
  useEffect(() => {
    const hasIssuing = domains.some(d => d.sslStatus === 'issuing');
    if (hasIssuing && !pollRef.current) {
      pollRef.current = setInterval(fetchDomains, 10_000);
    } else if (!hasIssuing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [domains, fetchDomains]);

  // ── 도메인 추가 ─────────────────────────────────────────────────────────────
  async function handleAdd() {
    const d = newDomain.trim().toLowerCase();
    if (!d) return;
    setAdding(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d, siteSlug: newSlug }),
      });
      const body = await res.json();
      if (!res.ok) { showToast(body.error ?? '등록 실패', false); return; }
      showToast(`${d} 등록 완료`);
      setNewDomain('');
      await fetchDomains();
    } catch { showToast('네트워크 오류', false); }
    finally { setAdding(false); }
  }

  // ── DNS 확인 ────────────────────────────────────────────────────────────────
  async function handleVerify(domain: string) {
    setActionLoading(domain);
    try {
      const res  = await fetch(`/api/domains/${domain}/verify`);
      const body = await res.json() as { ok: boolean; reason?: string; addrs?: string[] };
      if (body.ok) {
        showToast(`${domain} — DNS 확인됨`);
      } else {
        showToast(body.reason ?? 'DNS 확인 실패', false);
      }
      await fetchDomains();
    } catch { showToast('네트워크 오류', false); }
    finally { setActionLoading(null); }
  }

  // ── SSL 발급 ────────────────────────────────────────────────────────────────
  async function handleIssueSSL(domain: string) {
    setActionLoading(domain);
    try {
      const res  = await fetch(`/api/domains/${domain}/ssl`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) { showToast(body.error ?? 'SSL 발급 요청 실패', false); return; }
      showToast(`${domain} — SSL 발급 요청됨 (최대 수분 소요)`);
      await fetchDomains();
    } catch { showToast('네트워크 오류', false); }
    finally { setActionLoading(null); }
  }

  // ── 도메인 삭제 ─────────────────────────────────────────────────────────────
  async function handleDelete(domain: string) {
    if (!confirm(`${domain} 도메인을 삭제하시겠습니까?`)) return;
    setActionLoading(domain);
    try {
      const res = await fetch(`/api/domains/${domain}`, { method: 'DELETE' });
      if (!res.ok) { showToast('삭제 실패', false); return; }
      showToast(`${domain} 삭제 완료`);
      await fetchDomains();
    } catch { showToast('네트워크 오류', false); }
    finally { setActionLoading(null); }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">도메인 관리</h1>
        <p className="text-sm text-stone-400 mt-1">내 구매 도메인을 AIZET 사이트에 연결합니다.</p>
      </div>

      {/* 서버 IP 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-blue-500 shrink-0" />
          <p className="text-sm font-semibold text-blue-800">A레코드 설정 안내</p>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          도메인 등록기(가비아, 후이즈, Cloudflare 등)에서 구매한 도메인의 <strong>A레코드</strong>를 아래 서버 IP로 설정하세요.
          설정 후 DNS 전파에 수분~수십 분이 소요될 수 있습니다.
        </p>
        <div className="flex items-center gap-2 mt-1">
          <code className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-blue-900 select-all">
            {serverIp || '확인 중...'}
          </code>
          {serverIp && <CopyButton text={serverIp} />}
        </div>
      </div>

      {/* 도메인 추가 폼 */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
        <h2 className="font-bold text-stone-800 text-sm">도메인 연결하기</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="myrestaurant.com"
            className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-stone-300"
          />
          <select
            value={newSlug}
            onChange={e => setNewSlug(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700"
          >
            {SITE_SLUGS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding || !newDomain.trim()}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus size={15} />
            {adding ? '등록 중...' : '등록'}
          </button>
        </div>
        <p className="text-xs text-stone-400">
          등록 후 <strong>DNS 확인</strong> → <strong>SSL 발급</strong> 순서로 진행하세요.
        </p>
      </div>

      {/* 도메인 목록 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-sm">연결된 도메인 ({domains.length})</h2>
          <button
            onClick={fetchDomains}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw size={12} />
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-stone-400 text-center py-12">불러오는 중...</div>
        ) : domains.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center">
            <Globe size={32} className="mx-auto mb-3 text-stone-200" />
            <p className="font-semibold text-stone-500 text-sm">연결된 도메인이 없습니다</p>
            <p className="text-xs text-stone-400 mt-1">위에서 도메인을 등록해 보세요.</p>
          </div>
        ) : (
          domains.map(rec => (
            <DomainCard
              key={rec.domain}
              rec={rec}
              onVerify={handleVerify}
              onIssueSSL={handleIssueSSL}
              onDelete={handleDelete}
              loading={actionLoading}
            />
          ))
        )}
      </div>

      {/* 단계 안내 */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5">
        <p className="text-xs font-bold text-stone-600 mb-3">연결 단계</p>
        <ol className="flex flex-col gap-2.5">
          {[
            ['1단계', '도메인 등록기에서 A레코드 → 서버 IP로 설정'],
            ['2단계', '위에서 도메인 등록 후 [DNS 확인] 클릭'],
            ['3단계', 'DNS 확인됨 표시 후 [SSL 발급] 클릭 (Let\'s Encrypt 자동 발급)'],
            ['4단계', '연결됨 + SSL 정상 표시되면 도메인으로 사이트 접속 가능'],
          ].map(([step, desc]) => (
            <li key={step} className="flex items-start gap-2.5 text-xs">
              <span className="shrink-0 w-12 font-bold text-amber-600">{step}</span>
              <span className="text-stone-600 leading-relaxed">{desc}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 transition-all ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
