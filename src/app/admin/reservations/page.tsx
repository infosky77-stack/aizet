'use client';

import { useEffect, useState, useCallback } from 'react';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { ReservationCard } from '@/components/admin/ReservationCard';
import { WaitingCard } from '@/components/admin/WaitingCard';
import { Sparkles, CalendarClock, Users, Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'reservations' | 'waiting';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ReservationsAdminPage() {
  const [tab, setTab] = useState<Tab>('reservations');
  const [date, setDate] = useState(todayStr());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitingList, setWaitingList] = useState<Reservation[]>([]);
  const [predicting, setPredicting] = useState(false);
  const [showAddWaiting, setShowAddWaiting] = useState(false);
  const [newWaiting, setNewWaiting] = useState({ guestName: '', phone: '', partySize: '2' });

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/reservations?date=${date}`);
    const data = await res.json();
    setReservations((data.reservations ?? []).filter((r: Reservation) => r.type === 'reservation'));
    setWaitingList(data.waitingList ?? []);
  }, [date]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  async function handleUpdate(id: string, patch: { status?: ReservationStatus; tableNumber?: number }) {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    fetchData();
  }

  async function handlePredictWait() {
    setPredicting(true);
    await fetch('/api/reservations/predict-wait', { method: 'POST' });
    setPredicting(false);
    fetchData();
  }

  async function handleAddWaiting() {
    if (!newWaiting.guestName || !newWaiting.phone) return;
    const now = new Date();
    await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'walkin',
        guestName: newWaiting.guestName,
        phone: newWaiting.phone,
        partySize: Number(newWaiting.partySize),
        date: todayStr(),
        time: now.toTimeString().slice(0, 5),
        status: 'pending',
      }),
    });
    setNewWaiting({ guestName: '', phone: '', partySize: '2' });
    setShowAddWaiting(false);
    fetchData();
  }

  const rsvByStatus = {
    active: reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)),
    seated: reservations.filter((r) => r.status === 'seated'),
    done:   reservations.filter((r) => ['cancelled', 'no-show'].includes(r.status)),
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-stone-800">예약 · 대기 관리</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={() => setDate(todayStr())}
            className={clsx(
              'px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
              date === todayStr() ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            )}
          >
            오늘
          </button>
          <button
            onClick={() => setDate(tomorrowStr())}
            className={clsx(
              'px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
              date === tomorrowStr() ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            )}
          >
            내일
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: '대기 중 예약', value: rsvByStatus.active.length, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: '착석', value: rsvByStatus.seated.length, color: 'text-green-600 bg-green-50 border-green-100' },
          { label: '현장 대기', value: waitingList.length, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: '총 인원', value: `${[...reservations, ...waitingList].reduce((s, r) => s + r.partySize, 0)}명`, color: 'text-stone-600 bg-stone-50 border-stone-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold', color)}>
            {label} <span>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {[
          { value: 'reservations' as Tab, label: '사전 예약', icon: CalendarClock },
          { value: 'waiting'      as Tab, label: '현장 대기', icon: Users },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === value ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            )}
          >
            <Icon size={14} />
            {label}
            <span className={clsx('text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold', tab === value ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-500')}>
              {value === 'reservations' ? reservations.length : waitingList.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── 사전 예약 탭 ── */}
      {tab === 'reservations' && (
        <div className="flex flex-col gap-6">
          {rsvByStatus.active.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">대기 · 확정</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rsvByStatus.active.map((r) => (
                  <ReservationCard key={r.id} rsv={r} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )}

          {rsvByStatus.seated.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">착석 중</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rsvByStatus.seated.map((r) => (
                  <ReservationCard key={r.id} rsv={r} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )}

          {rsvByStatus.done.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">완료 · 취소</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rsvByStatus.done.map((r) => (
                  <ReservationCard key={r.id} rsv={r} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )}

          {reservations.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
              <CalendarClock size={36} className="mx-auto mb-2 opacity-30" />
              이 날짜에 예약이 없습니다
            </div>
          )}
        </div>
      )}

      {/* ── 현장 대기 탭 ── */}
      {tab === 'waiting' && (
        <div className="flex flex-col gap-4">
          {/* AI 예측 + 현장 등록 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePredictWait}
              disabled={predicting || waitingList.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-stone-300 disabled:to-stone-300 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {predicting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI 대기 시간 예측
            </button>
            <button
              onClick={() => setShowAddWaiting(!showAddWaiting)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 hover:border-amber-400 text-stone-600 text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={14} />
              현장 접수
            </button>
          </div>

          {/* Add waiting form */}
          {showAddWaiting && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-amber-800">현장 대기 등록</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="이름"
                  value={newWaiting.guestName}
                  onChange={(e) => setNewWaiting((p) => ({ ...p, guestName: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm"
                />
                <input
                  placeholder="전화번호"
                  value={newWaiting.phone}
                  onChange={(e) => setNewWaiting((p) => ({ ...p, phone: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-stone-600">인원</span>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNewWaiting((p) => ({ ...p, partySize: String(n) }))}
                    className={clsx(
                      'w-8 h-8 rounded-lg border text-sm font-semibold transition-colors',
                      newWaiting.partySize === String(n)
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-600 border-stone-200'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddWaiting} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors">
                  등록
                </button>
                <button onClick={() => setShowAddWaiting(false)} className="px-4 py-2 border border-stone-200 text-stone-500 text-sm rounded-xl hover:border-stone-400 transition-colors">
                  취소
                </button>
              </div>
            </div>
          )}

          {/* Waiting list */}
          {waitingList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center text-stone-400 text-sm">
              <Users size={36} className="mx-auto mb-2 opacity-30" />
              현재 대기 중인 고객이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {waitingList.map((rsv, i) => (
                <WaitingCard
                  key={rsv.id}
                  rsv={rsv}
                  position={i + 1}
                  onSeat={(id) => handleUpdate(id, { status: 'seated' })}
                  onCancel={(id) => handleUpdate(id, { status: 'cancelled' })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
