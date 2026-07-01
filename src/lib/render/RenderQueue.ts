import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { UbuntuLocalWorker } from './UbuntuLocalWorker';
import type { IRenderWorker } from './IRenderWorker';

export type RenderJobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface RenderJob {
  id:           string;
  order_id:     string;
  job_type:     'video' | 'print' | 'catalog';
  worker_type:  string;
  status:       RenderJobStatus;
  priority:     number;
  queued_at:    number;
  started_at:   number | null;
  done_at:      number | null;
  error_msg:    string | null;
  output_uuid:  string | null;
  output_path:  string | null;
  output_type:  'video' | 'pdf' | null;
}

// 등록된 워커 목록 — 2단계에서 CloudflareTunnelWorker 추가 예정
const WORKERS: IRenderWorker[] = [
  new UbuntuLocalWorker(),
];

export function enqueueJob(orderId: string, jobType: 'video' | 'print' | 'catalog'): RenderJob {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO render_jobs (id, order_id, job_type, worker_type, status, priority, queued_at)
    VALUES (?, ?, ?, 'ubuntu_local', 'queued', 0, ?)
  `).run(id, orderId, jobType, now);
  return getJob(id)!;
}

export function getJob(id: string): RenderJob | null {
  return db.prepare<[string], RenderJob>('SELECT * FROM render_jobs WHERE id=?').get(id) ?? null;
}

export function listJobs(limit = 50): RenderJob[] {
  return db.prepare<[], RenderJob>(
    'SELECT * FROM render_jobs ORDER BY queued_at DESC LIMIT 50'
  ).all() as RenderJob[];
}

export function getJobsByOrder(orderId: string): RenderJob[] {
  return db.prepare<[string], RenderJob>(
    'SELECT * FROM render_jobs WHERE order_id=? ORDER BY queued_at DESC'
  ).all(orderId) as RenderJob[];
}

export function countByStatus(): Record<RenderJobStatus, number> {
  const rows = db.prepare<[], { status: string; cnt: number }>(
    'SELECT status, COUNT(*) as cnt FROM render_jobs GROUP BY status'
  ).all() as { status: string; cnt: number }[];
  const result: Record<RenderJobStatus, number> = { queued: 0, processing: 0, done: 0, failed: 0 };
  for (const r of rows) result[r.status as RenderJobStatus] = r.cnt;
  return result;
}

/** 큐에서 다음 잡 하나를 꺼내 처리. 처리 중인 잡이 없을 때만 실행. */
export async function processNextJob(): Promise<{ processed: boolean; jobId?: string; error?: string }> {
  // 이미 processing 중인 잡이 있으면 대기
  const inProgress = db.prepare<[], { cnt: number }>(
    "SELECT COUNT(*) as cnt FROM render_jobs WHERE status='processing'"
  ).get() as { cnt: number };
  if (inProgress.cnt > 0) return { processed: false };

  const next = db.prepare<[], RenderJob>(
    "SELECT * FROM render_jobs WHERE status='queued' ORDER BY priority DESC, queued_at ASC LIMIT 1"
  ).get() as RenderJob | undefined;
  if (!next) return { processed: false };

  const worker = WORKERS.find(w => w.workerType === next.worker_type && w.canAccept());
  if (!worker) return { processed: false };

  // status → processing
  const startedAt = Date.now();
  db.prepare("UPDATE render_jobs SET status='processing', started_at=? WHERE id=?").run(startedAt, next.id);

  // 주문 + userId 조회
  const order = db.prepare<[string], { snapshot: string; order_type: string; title: string; user_id: string }>(
    'SELECT snapshot, order_type, title, user_id FROM media_orders WHERE id=?'
  ).get(next.order_id);

  let snapshot: Record<string, unknown> = {};
  try { snapshot = order?.snapshot ? JSON.parse(order.snapshot) : {}; } catch { /* ignore */ }

  try {
    const result = await worker.execute({
      jobId:   next.id,
      orderId: next.order_id,
      userId:  order?.user_id ?? '',
      jobType: next.job_type,
      snapshot,
      title:   order?.title ?? '',
    });

    const doneAt = Date.now();
    if (result.success) {
      db.prepare(`
        UPDATE render_jobs
        SET status='done', done_at=?, output_uuid=?, output_path=?, output_type=?
        WHERE id=?
      `).run(doneAt, result.outputUuid ?? null, result.outputPath ?? null, result.outputType ?? null, next.id);

      db.prepare(`
        UPDATE media_orders SET status='done', output_uuid=?, updated_at=? WHERE id=?
      `).run(result.outputUuid ?? null, doneAt, next.order_id);
    } else {
      db.prepare("UPDATE render_jobs SET status='failed', done_at=?, error_msg=? WHERE id=?")
        .run(doneAt, result.errorMsg ?? 'unknown error', next.id);
      db.prepare("UPDATE media_orders SET status='failed', updated_at=? WHERE id=?")
        .run(doneAt, next.order_id);
    }
    return { processed: true, jobId: next.id };
  } catch (e) {
    const doneAt = Date.now();
    const msg = e instanceof Error ? e.message : 'unknown error';
    db.prepare("UPDATE render_jobs SET status='failed', done_at=?, error_msg=? WHERE id=?")
      .run(doneAt, msg, next.id);
    db.prepare("UPDATE media_orders SET status='failed', updated_at=? WHERE id=?")
      .run(doneAt, next.order_id);
    return { processed: true, jobId: next.id, error: msg };
  }
}
