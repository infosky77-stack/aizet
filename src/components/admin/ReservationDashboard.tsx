'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { ReservationCard } from '@/components/admin/ReservationCard';
import { WaitingCard } from '@/components/admin/WaitingCard';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { PublicSession } from '@/types/auth';
import { CalendarClock, Users, CheckCircle, Clock, ArrowRight, Cloud } from 'lucide-react';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  session: PublicSession | null;
}

export function ReservationDashboard({ session }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitingList, setWaitingList]   = useState<Reservation[]>([]);
  const [lastUpdated, setLastUpdated]   = useState('');

  const fetchData = useCallback(async () => {
    const res  = await fetch(`/api/reservations?date=${todayStr()}`);
    const data = await res.json();
    setReservations((data.reservations ?? []).filter((r: Reservation) => r.type === 'reservation'));
    setWaitingList(data.waitingList ?? []);
    setLastUpdated(new Date().toLocaleTimeString('ko-KR'));
  }, []);

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

  async function handleSeat(id: string) {
    await handleUpdate(id, { status: 'seated' });
  }

  async function handleCancel(id: string) {
    await handleUpdate(id, { status: 'cancelled' });
  }

  const activeReservations = reservations.filter(r => ['pending', 'confirmed'].includes(r.status));
  const seatedToday        = reservations.filter(r => r.status === 'seated').length;
  const pendingWaiting     = waitingList.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {session ? (
            <>
              <p className="text-sm text-stone-400 font-medium">
                안녕하세요,{' '}
                <span className="text-stone-700 font-semibold">{session.name}</span>님
              </p>
              <h1 className="text-2xl font-bold text-stone-800 mt-0.5">대시보드</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-stone-400">마지막 업데이트 {lastUpdated}</p>
                {session.driveConnected && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    <Cloud size={10} />
                    Drive 연동됨
                  </span>
                )}
              </div>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
          )}
        </div>
        <Link
          href="/admin/reservations"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-sm shrink-0"
        >
          <CalendarClock size={14} />
          예약 관리
        </Link>
      </div>

      {/* StatCard 3종 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="오늘 예약"
          value={`${reservations.length}건`}
          sub="전체 사전 예약"
          icon={CalendarClock}
          color="amber"
        />
        <StatCard
          label="대기 중"
          value={`${pendingWaiting}명`}
          sub="현장 대기"
          icon={Users}
          color="rose"
        />
        <StatCard
          label="착석 완료"
          value={`${seatedToday}건`}
          sub="오늘 기준"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 오늘 예약 현황 */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-800">오늘 예약 현황</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              8초마다 자동 갱신
            </span>
          </div>

          {activeReservations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400 text-sm">
              <CalendarClock size={32} className="mx-auto mb-2 opacity-30" />
              처리 중인 예약이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeReservations
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(rsv => (
                  <ReservationCard key={rsv.id} rsv={rsv} onUpdate={handleUpdate} />
                ))}
            </div>
          )}
        </div>

        {/* 우측: 대기열 + 바로가기 */}
        <div className="flex flex-col gap-4">
          {/* 현장 대기열 */}
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-stone-800">현장 대기열</h2>
            {waitingList.filter(r => r.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center text-stone-400 text-sm">
                <Clock size={24} className="mx-auto mb-2 opacity-30" />
                대기 중인 고객이 없습니다
              </div>
            ) : (
              waitingList
                .filter(r => r.status === 'pending')
                .slice(0, 3)
                .map((rsv, i) => (
                  <WaitingCard
                    key={rsv.id}
                    rsv={rsv}
                    position={i + 1}
                    onSeat={handleSeat}
                    onCancel={handleCancel}
                  />
                ))
            )}
          </div>

          {/* 예약 관리 전체 보기 */}
          <Link
            href="/admin/reservations"
            className="group bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white block hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} />
                <p className="font-bold text-sm">예약 전체 보기</p>
              </div>
              <ArrowRight size={16} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">
              날짜별 예약 조회, 대기 예측, 테이블 배정까지 한 화면에서
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
