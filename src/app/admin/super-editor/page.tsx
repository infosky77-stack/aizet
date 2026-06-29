'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Printer, Plus, Clock, CheckCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

type OrderType   = 'video' | 'print';
type OrderStatus = 'editing' | 'queued' | 'processing' | 'done' | 'failed';

interface MediaOrder {
  id:         string;
  order_type: OrderType;
  title:      string;
  is_paid:    number;
  status:     OrderStatus;
  updated_at: number;
}

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  editing:    { label: '편집 중',   color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  queued:     { label: '대기 중',   color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  processing: { label: '처리 중',   color: 'text-violet-600 bg-violet-50 border-violet-200' },
  done:       { label: '완료',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed:     { label: '실패',      color: 'text-red-600    bg-red-50    border-red-200'    },
};

export default function SuperEditorIndexPage() {
  const router = useRouter();
  const [orders,    setOrders]    = useState<MediaOrder[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [newType,   setNewType]   = useState<OrderType>('video');
  const [newTitle,  setNewTitle]  = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  async function fetchOrders() {
    const res = await fetch('/api/admin/super-editor');
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/super-editor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderType: newType, title: newTitle.trim() }),
      });
      if (res.ok) {
        const { order } = await res.json();
        router.push(`/admin/super-editor/${order.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('미결제 주문을 삭제하시겠습니까?')) return;
    setDeleting(id);
    await fetch(`/api/admin/super-editor?orderId=${id}`, { method: 'DELETE' });
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeleting(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">슈퍼에디터</h1>
          <p className="text-sm text-stone-400 mt-0.5">영상 / 인쇄 콘텐츠 편집 및 자동 컴파일</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          새 주문
        </button>
      </div>

      {/* 새 주문 폼 */}
      {showForm && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <p className="font-semibold text-stone-700 text-sm">새 주문 만들기</p>

          {/* 유형 선택 */}
          <div className="grid grid-cols-2 gap-3">
            {(['video', 'print'] as const).map(t => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-colors',
                  newType === t
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300',
                )}
              >
                {t === 'video' ? <Film size={22} /> : <Printer size={22} />}
                {t === 'video' ? '영상 (FullAutoCut)' : '인쇄 (FullAutoShot)'}
              </button>
            ))}
          </div>

          {/* 제목 */}
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="주문 제목 (예: 여름 프로모션 영상)"
            maxLength={100}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                newTitle.trim() && !creating
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed',
              )}
            >
              {creating ? <><Loader2 size={15} className="animate-spin" />생성 중...</> : '편집 시작'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewTitle(''); }}
              className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 주문 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-stone-300" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
          <Film size={36} className="opacity-30" />
          <p className="text-sm">아직 주문이 없습니다. 새 주문을 만들어보세요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => {
            const meta = STATUS_META[order.status];
            return (
              <div
                key={order.id}
                className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:border-violet-300 transition-colors"
              >
                {/* 아이콘 */}
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  order.order_type === 'video' ? 'bg-violet-100' : 'bg-indigo-100',
                )}>
                  {order.order_type === 'video'
                    ? <Film size={18} className="text-violet-600" />
                    : <Printer size={18} className="text-indigo-600" />}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0" onClick={() => {
                  if (order.status === 'editing') router.push(`/admin/super-editor/${order.id}`);
                }} style={{ cursor: order.status === 'editing' ? 'pointer' : 'default' }}>
                  <p className="font-semibold text-stone-800 text-sm truncate">{order.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full border', meta.color)}>
                      {meta.label}
                    </span>
                    {order.is_paid === 1 && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle size={11} /> 결제완료
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 ml-auto">
                      {new Date(order.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-2 shrink-0">
                  {order.status === 'editing' && (
                    <button
                      onClick={() => router.push(`/admin/super-editor/${order.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                      편집
                    </button>
                  )}
                  {order.is_paid === 0 && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deleting === order.id}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {deleting === order.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <Clock size={16} className="text-violet-500 animate-pulse" />
                  )}
                  {order.status === 'done' && (
                    <CheckCircle size={16} className="text-emerald-500" />
                  )}
                  {order.status === 'failed' && (
                    <AlertCircle size={16} className="text-red-400" />
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
