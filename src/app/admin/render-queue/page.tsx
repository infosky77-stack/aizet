'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Play, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

interface RenderJob {
  id:          string;
  order_id:    string;
  job_type:    'video' | 'print';
  worker_type: string;
  status:      JobStatus;
  priority:    number;
  queued_at:   number;
  started_at:  number | null;
  done_at:     number | null;
  error_msg:   string | null;
}

interface Counts { queued: number; processing: number; done: number; failed: number }

const STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  queued:     { label: '대기',   color: 'bg-blue-100   text-blue-700'   },
  processing: { label: '처리 중', color: 'bg-violet-100 text-violet-700' },
  done:       { label: '완료',   color: 'bg-emerald-100 text-emerald-700' },
  failed:     { label: '실패',   color: 'bg-red-100    text-red-700'    },
};

function fmt(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RenderQueuePage() {
  const router   = useRouter();
  const [jobs,   setJobs]       = useState<RenderJob[]>([]);
  const [counts, setCounts]     = useState<Counts>({ queued: 0, processing: 0, done: 0, failed: 0 });
  const [loading,  setLoading]  = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState('');

  async function fetchQueue() {
    const res = await fetch('/api/admin/render-queue');
    if (res.status === 403) { router.replace('/admin'); return; }
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setCounts(data.counts ?? {});
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProcess() {
    setProcessing(true);
    setProcessResult('');
    try {
      const res  = await fetch('/api/admin/render-queue/process', { method: 'POST' });
      const data = await res.json();
      if (data.processed) {
        setProcessResult(`처리됨: 잡 ${data.jobId?.slice(0, 8) ?? '?'}…${data.error ? ` (오류: ${data.error})` : ''}`);
      } else {
        setProcessResult('처리할 잡이 없거나 이미 처리 중입니다.');
      }
      await fetchQueue();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">렌더 큐</h1>
          <p className="text-sm text-stone-400 mt-0.5">FullAutoCut / FullAutoShot 처리 대기열</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchQueue}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleProcess} disabled={processing || counts.queued === 0}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              !processing && counts.queued > 0
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed',
            )}>
            {processing
              ? <><Loader2 size={14} className="animate-spin" />처리 중...</>
              : <><Play size={14} />다음 잡 처리</>}
          </button>
        </div>
      </div>

      {/* 카운트 요약 */}
      <div className="grid grid-cols-4 gap-3">
        {(['queued', 'processing', 'done', 'failed'] as const).map(s => (
          <div key={s} className="bg-white border border-stone-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-stone-800">{counts[s]}</p>
            <p className="text-xs text-stone-400 mt-0.5">{STATUS_META[s].label}</p>
          </div>
        ))}
      </div>

      {/* 처리 결과 */}
      {processResult && (
        <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
          {processResult}
        </p>
      )}

      {/* 잡 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-stone-300" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
          <CheckCircle size={36} className="opacity-30" />
          <p className="text-sm">잡이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map(job => {
            const meta = STATUS_META[job.status];
            return (
              <div key={job.id}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  {job.status === 'queued'     && <Clock size={16} className="text-blue-500" />}
                  {job.status === 'processing' && <Loader2 size={16} className="text-violet-500 animate-spin" />}
                  {job.status === 'done'       && <CheckCircle size={16} className="text-emerald-500" />}
                  {job.status === 'failed'     && <AlertCircle size={16} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded-full', meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                      {job.job_type === 'video' ? 'FullAutoCut' : 'FullAutoShot'}
                    </span>
                    <span className="text-[11px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      {job.worker_type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 font-mono truncate">
                    잡: {job.id.slice(0, 12)}… · 주문: {job.order_id.slice(0, 12)}…
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
                    <span>큐 등록: {fmt(job.queued_at)}</span>
                    {job.started_at && <span>시작: {fmt(job.started_at)}</span>}
                    {job.done_at    && <span>완료: {fmt(job.done_at)}</span>}
                  </div>
                  {job.error_msg && (
                    <p className="text-xs text-red-500 mt-1">오류: {job.error_msg}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
