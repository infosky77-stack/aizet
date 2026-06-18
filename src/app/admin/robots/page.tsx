'use client';

import { useEffect, useState, useCallback } from 'react';
import { Robot, RobotStatus } from '@/types/robot';
import { Bot, Battery, MapPin, RotateCcw, Zap, Play, ChevronRight, BatteryCharging } from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_LABEL: Record<RobotStatus, string> = {
  idle: '대기 중',
  dispatched: '출동 중',
  delivering: '서빙 중',
  returning: '복귀 중',
};

const STATUS_COLOR: Record<RobotStatus, string> = {
  idle: 'bg-emerald-100 text-emerald-700',
  dispatched: 'bg-amber-100 text-amber-700',
  delivering: 'bg-blue-100 text-blue-700',
  returning: 'bg-stone-100 text-stone-600',
};

const STATUS_NEXT_LABEL: Partial<Record<RobotStatus, string>> = {
  dispatched: '서빙 시작',
  delivering: '복귀 명령',
  returning: '복귀 완료',
};

function BatteryBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <Battery size={14} className={level < 30 ? 'text-red-500' : 'text-stone-400'} />
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            level < 30 ? 'bg-red-400' : level < 60 ? 'bg-amber-400' : 'bg-emerald-400'
          )}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className={clsx('text-xs font-semibold w-8', level < 30 ? 'text-red-500' : 'text-stone-500')}>{level}%</span>
    </div>
  );
}

function DispatchModal({
  robot,
  onDispatch,
  onClose,
}: {
  robot: Robot;
  onDispatch: (tableNumber: number) => void;
  onClose: () => void;
}) {
  const [table, setTable] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const n = parseInt(table);
    if (isNaN(n) || n < 1 || n > 30) {
      setError('1~30 사이의 테이블 번호를 입력하세요');
      return;
    }
    onDispatch(n);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Bot size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800">{robot.name} 파견</h3>
            <p className="text-xs text-stone-400">서빙할 테이블 번호를 입력하세요</p>
          </div>
        </div>

        <input
          type="number"
          min={1}
          max={30}
          placeholder="테이블 번호 (1~30)"
          value={table}
          onChange={(e) => { setTable(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 text-stone-500 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            파견하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RobotsPage() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [dispatchTarget, setDispatchTarget] = useState<Robot | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchRobots = useCallback(async () => {
    const res = await fetch('/api/robots');
    const { robots: r } = await res.json();
    setRobots(r);
  }, []);

  useEffect(() => {
    fetchRobots();
    const id = setInterval(fetchRobots, 3000);
    return () => clearInterval(id);
  }, [fetchRobots]);

  async function handleSimulateStep(robot: Robot) {
    setLoadingId(robot.id);
    await fetch(`/api/robots/${robot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: robot.currentOrderId }),
    });
    await fetchRobots();
    setLoadingId(null);
  }

  async function handleCharge(robot: Robot) {
    setLoadingId(robot.id);
    await fetch(`/api/robots/${robot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'charge' }),
    });
    await fetchRobots();
    setLoadingId(null);
  }

  async function handleDirectDispatch(robot: Robot, tableNumber: number) {
    setDispatchTarget(null);
    setLoadingId(robot.id);
    const fakeOrderId = `manual-${Date.now()}`;
    await fetch(`/api/robots/${robot.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: fakeOrderId, tableNumber }),
    });
    await fetchRobots();
    setLoadingId(null);
  }

  const idleCount = robots.filter((r) => r.status === 'idle').length;
  const activeCount = robots.filter((r) => r.status !== 'idle').length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">서빙 로봇 관리</h1>
        <div className="flex gap-3 text-sm">
          <span className="bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-full border border-emerald-200">
            대기 {idleCount}대
          </span>
          <span className="bg-amber-50 text-amber-700 font-semibold px-3 py-1 rounded-full border border-amber-200">
            운행 {activeCount}대
          </span>
        </div>
      </div>

      {/* Simulation guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
        <Play size={15} className="shrink-0" />
        <span>
          <strong>시뮬레이션 모드:</strong> 로봇을 직접 파견하거나 &apos;다음 단계&apos; 버튼으로 로봇 상태를 진행시킬 수 있습니다.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {robots.map((robot) => (
          <div
            key={robot.id}
            className={clsx(
              'bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4',
              robot.status === 'idle' ? 'border-stone-100' : 'border-amber-200'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    robot.status === 'idle' ? 'bg-stone-100' : 'bg-amber-100'
                  )}
                >
                  <Bot
                    size={20}
                    className={clsx(
                      robot.status === 'idle' ? 'text-stone-400' : 'text-amber-600',
                      robot.status !== 'idle' && robot.status !== 'returning' && 'animate-pulse'
                    )}
                  />
                </div>
                <div>
                  <p className="font-bold text-stone-800">{robot.name}</p>
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLOR[robot.status])}>
                    {STATUS_LABEL[robot.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Battery */}
            <BatteryBar level={robot.batteryLevel} />

            {/* Current task */}
            {robot.currentTable && (
              <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 rounded-xl px-3 py-2">
                <MapPin size={13} className="text-amber-600 shrink-0" />
                <span>테이블 {robot.currentTable}번 서빙</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Simulate next step */}
              {robot.status !== 'idle' && STATUS_NEXT_LABEL[robot.status] && (
                <button
                  onClick={() => handleSimulateStep(robot)}
                  disabled={loadingId === robot.id}
                  className="flex items-center justify-center gap-1.5 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {loadingId === robot.id ? (
                    <RotateCcw size={13} className="animate-spin" />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                  {STATUS_NEXT_LABEL[robot.status]}
                </button>
              )}

              {/* Direct dispatch (idle only) */}
              {robot.status === 'idle' && robot.batteryLevel > 20 && (
                <button
                  onClick={() => setDispatchTarget(robot)}
                  disabled={loadingId === robot.id}
                  className="flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Zap size={13} />
                  직접 파견
                </button>
              )}

              {/* Charge button (idle + low battery) */}
              {robot.status === 'idle' && robot.batteryLevel < 80 && (
                <button
                  onClick={() => handleCharge(robot)}
                  disabled={loadingId === robot.id}
                  className="flex items-center justify-center gap-1.5 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <BatteryCharging size={13} />
                  충전 (+20%)
                </button>
              )}

              {robot.status === 'idle' && robot.batteryLevel <= 20 && (
                <div className="text-center text-xs text-red-500 font-medium py-1">
                  배터리 부족 — 충전 필요
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {dispatchTarget && (
        <DispatchModal
          robot={dispatchTarget}
          onDispatch={(table) => handleDirectDispatch(dispatchTarget, table)}
          onClose={() => setDispatchTarget(null)}
        />
      )}
    </div>
  );
}
