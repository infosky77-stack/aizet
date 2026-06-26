'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bot, Battery, BatteryCharging, Zap, RotateCcw, MapPin, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import type { Robot, RobotStatus } from '@/types/robot';
import type { Order } from '@/types/order';

// ── 매장 레이아웃 상수 ─────────────────────────────────────────────────────────
const CW = 600;
const CH = 360;

const KITCHEN = { x: 230, y: 20, w: 140, h: 38 };
const CHARGER = { x: 530, y: 310 };

// 12개 테이블 좌표 (캔버스 픽셀)
const TABLE_POS: Record<number, { x: number; y: number }> = {
  1:  { x: 70,  y: 110 },
  2:  { x: 190, y: 110 },
  3:  { x: 310, y: 110 },
  4:  { x: 430, y: 110 },
  5:  { x: 70,  y: 200 },
  6:  { x: 190, y: 200 },
  7:  { x: 310, y: 200 },
  8:  { x: 430, y: 200 },
  9:  { x: 70,  y: 290 },
  10: { x: 190, y: 290 },
  11: { x: 310, y: 290 },
  12: { x: 430, y: 290 },
};

// 로봇 충전소 위치 (약간씩 오프셋)
const ROBOT_CHARGE_POS: Record<string, { x: number; y: number }> = {
  'robot-1': { x: CHARGER.x - 14, y: CHARGER.y - 10 },
  'robot-2': { x: CHARGER.x,      y: CHARGER.y + 2  },
  'robot-3': { x: CHARGER.x + 14, y: CHARGER.y - 10 },
};

// 로봇 색상
const ROBOT_COLOR: Record<string, string> = {
  'robot-1': '#6366f1', // indigo
  'robot-2': '#f59e0b', // amber
  'robot-3': '#10b981', // emerald
};

const STATUS_LABEL: Record<RobotStatus, string> = {
  idle: '대기 중', dispatched: '이동 중', delivering: '서빙 중', returning: '복귀 중',
};
const STATUS_COLOR: Record<RobotStatus, string> = {
  idle: 'bg-stone-100 text-stone-600',
  dispatched: 'bg-amber-100 text-amber-700',
  delivering: 'bg-blue-100 text-blue-700',
  returning: 'bg-violet-100 text-violet-700',
};

// ── 타입 ────────────────────────────────────────────────────────────────────────
interface VisPos { x: number; y: number }
interface TrailPoint { x: number; y: number; t: number }

// ── 배터리 바 ───────────────────────────────────────────────────────────────────
function BatteryBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <Battery size={13} className={level < 30 ? 'text-red-400' : 'text-stone-400'} />
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500',
            level < 30 ? 'bg-red-400' : level < 60 ? 'bg-amber-400' : 'bg-emerald-400'
          )}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className={clsx('text-xs font-mono w-8', level < 30 ? 'text-red-500' : 'text-stone-400')}>
        {level}%
      </span>
    </div>
  );
}

// ── 파견 모달 ───────────────────────────────────────────────────────────────────
function DispatchModal({ robot, onDispatch, onClose }: {
  robot: Robot;
  onDispatch: (table: number) => void;
  onClose: () => void;
}) {
  const [table, setTable] = useState('');
  const [err, setErr] = useState('');
  function submit() {
    const n = parseInt(table);
    if (isNaN(n) || n < 1 || n > 12) { setErr('1~12 사이 테이블 번호'); return; }
    onDispatch(n);
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Bot size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800">{robot.name} 수동 파견</h3>
            <p className="text-xs text-stone-400">테이블 번호 입력 (1~12)</p>
          </div>
        </div>
        <input
          type="number" min={1} max={12} placeholder="테이블 번호"
          value={table} autoFocus
          onChange={e => { setTable(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none"
        />
        {err && <p className="text-red-500 text-sm text-center -mt-2">{err}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-200 text-stone-500 text-sm font-semibold rounded-xl hover:bg-stone-50">취소</button>
          <button onClick={submit} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl">파견</button>
        </div>
      </div>
    </div>
  );
}

// ── Canvas 드로잉 ───────────────────────────────────────────────────────────────
function getTableStatus(tableNum: number, orders: Order[]): 'empty' | 'pending' | 'preparing' | 'ready' | 'robot' {
  const active = orders.filter(o => o.orderType === 'dine-in' && o.tableNumber === tableNum);
  if (!active.length) return 'empty';
  if (active.some(o => o.robotId)) return 'robot';
  if (active.some(o => o.status === 'ready')) return 'ready';
  if (active.some(o => o.status === 'preparing' || o.status === 'confirmed')) return 'preparing';
  if (active.some(o => o.status === 'pending')) return 'pending';
  return 'empty';
}

function drawFloorPlan(
  ctx: CanvasRenderingContext2D,
  orders: Order[],
  robots: Robot[],
  visPos: Record<string, VisPos>,
  trails: Record<string, TrailPoint[]>,
  tick: number,
) {
  ctx.clearRect(0, 0, CW, CH);

  // 배경
  ctx.fillStyle = '#f8f7f4';
  ctx.fillRect(0, 0, CW, CH);

  // 벽 테두리
  ctx.strokeStyle = '#d4cfc8';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, CW - 4, CH - 4);

  // 주방
  ctx.fillStyle = '#e8e4de';
  ctx.beginPath();
  ctx.roundRect(KITCHEN.x, KITCHEN.y, KITCHEN.w, KITCHEN.h, 6);
  ctx.fill();
  ctx.strokeStyle = '#c5bfb8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#8a8079';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KITCHEN', KITCHEN.x + KITCHEN.w / 2, KITCHEN.y + 24);

  // 충전소
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.roundRect(CHARGER.x - 22, CHARGER.y - 18, 44, 36, 8);
  ctx.fill();
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', CHARGER.x, CHARGER.y + 5);
  ctx.fillStyle = '#6b7280';
  ctx.font = '9px sans-serif';
  ctx.fillText('충전소', CHARGER.x, CHARGER.y + 24);

  // 통로선 (점선)
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = '#e5e0d8';
  ctx.lineWidth = 1;
  // 가로 통로
  [150, 245].forEach(y => {
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(CW - 60, y); ctx.stroke();
  });
  // 세로 통로
  [130, 250, 370, 490].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, 65); ctx.lineTo(x, CH - 20); ctx.stroke();
  });
  ctx.setLineDash([]);

  // 테이블
  const TABLE_W = 52, TABLE_H = 36;
  for (const [numStr, pos] of Object.entries(TABLE_POS)) {
    const num = parseInt(numStr);
    const st = getTableStatus(num, orders);

    // 테이블 색상
    const fills: Record<string, string> = {
      empty:    '#ffffff',
      pending:  '#fef9c3',
      preparing:'#fef3c7',
      ready:    '#dcfce7',
      robot:    '#dbeafe',
    };
    const strokes: Record<string, string> = {
      empty:    '#e5e0d8',
      pending:  '#fde68a',
      preparing:'#fbbf24',
      ready:    '#86efac',
      robot:    '#93c5fd',
    };

    // ready 테이블 펄스
    if (st === 'ready' || st === 'robot') {
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.08);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.2 * pulse;
      ctx.fillStyle = st === 'robot' ? '#3b82f6' : '#22c55e';
      ctx.beginPath();
      ctx.roundRect(pos.x - TABLE_W / 2 - 4, pos.y - TABLE_H / 2 - 4, TABLE_W + 8, TABLE_H + 8, 10);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = fills[st] ?? '#fff';
    ctx.beginPath();
    ctx.roundRect(pos.x - TABLE_W / 2, pos.y - TABLE_H / 2, TABLE_W, TABLE_H, 7);
    ctx.fill();
    ctx.strokeStyle = strokes[st] ?? '#e5e0d8';
    ctx.lineWidth = st === 'empty' ? 1 : 2;
    ctx.stroke();

    // 테이블 번호
    ctx.fillStyle = st === 'empty' ? '#9ca3af' : '#374151';
    ctx.font = `bold ${num < 10 ? 13 : 11}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`T${num}`, pos.x, pos.y + 5);
  }

  // 로봇 잔상
  for (const robot of robots) {
    const trail = trails[robot.id] ?? [];
    const col = ROBOT_COLOR[robot.id] ?? '#6366f1';
    trail.forEach((pt, i) => {
      const alpha = ((i + 1) / trail.length) * 0.25;
      const r = 5 * ((i + 1) / trail.length);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // 로봇 이동 경로 미리보기 (dispatched · returning)
  for (const robot of robots) {
    if (robot.status !== 'dispatched' && robot.status !== 'returning') continue;
    const vp = visPos[robot.id];
    if (!vp) continue;
    const target = robot.status === 'dispatched' && robot.currentTable
      ? TABLE_POS[robot.currentTable]
      : ROBOT_CHARGE_POS[robot.id] ?? CHARGER;
    if (!target) continue;
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = ROBOT_COLOR[robot.id] ?? '#6366f1';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vp.x, vp.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }

  // 로봇 아이콘
  for (const robot of robots) {
    const vp = visPos[robot.id];
    if (!vp) continue;
    const col = ROBOT_COLOR[robot.id] ?? '#6366f1';
    const isMoving = robot.status === 'dispatched' || robot.status === 'returning';
    const isDelivering = robot.status === 'delivering';

    // 펄스 링 (서빙 중)
    if (isDelivering) {
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.1);
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.25 * pulse;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vp.x, vp.y, 16 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 이동 중 그림자
    if (isMoving) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(vp.x, vp.y + 11, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 본체 원
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 로봇 라벨 (R1/R2/R3)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(robot.name.split(' ')[0], vp.x, vp.y + 3);
  }

  ctx.textAlign = 'left';
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────
export default function RobotsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [visPos, setVisPos] = useState<Record<string, VisPos>>({});
  const [trails, setTrails] = useState<Record<string, TrailPoint[]>>({});
  const [dispatchTarget, setDispatchTarget] = useState<Robot | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const robotsRef = useRef<Robot[]>([]);
  const ordersRef = useRef<Order[]>([]);
  const visPosRef = useRef<Record<string, VisPos>>({});
  const trailsRef = useRef<Record<string, TrailPoint[]>>({});
  const autoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const dispatchedOrders = useRef<Set<string>>(new Set());

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEventLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 30));
  }

  // 로봇의 목표 좌표 계산
  function getRobotTarget(robot: Robot): VisPos {
    if (robot.status === 'idle') return ROBOT_CHARGE_POS[robot.id] ?? CHARGER;
    if ((robot.status === 'dispatched' || robot.status === 'delivering') && robot.currentTable) {
      return TABLE_POS[robot.currentTable] ?? CHARGER;
    }
    return ROBOT_CHARGE_POS[robot.id] ?? CHARGER;
  }

  // 데이터 폴링
  const fetchAll = useCallback(async () => {
    try {
      const [rRes, oRes] = await Promise.all([fetch('/api/robots'), fetch('/api/orders')]);
      const { robots: newRobots } = await rRes.json();
      const { orders: newOrders } = await oRes.json();

      robotsRef.current = newRobots;
      ordersRef.current = newOrders;

      // 초기 위치 설정 (처음 로드 시)
      setVisPos(prev => {
        const next = { ...prev };
        for (const r of newRobots) {
          if (!next[r.id]) {
            const start = ROBOT_CHARGE_POS[r.id] ?? CHARGER;
            next[r.id] = { x: start.x, y: start.y };
          }
        }
        visPosRef.current = next;
        return next;
      });

      setRobots(newRobots);
      setOrders(newOrders);
    } catch { /* 폴링 실패 무시 */ }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 3000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // AZOS 자동 파견: ready 주문 감지 → 유휴 로봇 자동 투입
  useEffect(() => {
    const readyOrders = orders.filter(
      o => o.orderType === 'dine-in'
        && o.status === 'ready'
        && !o.robotId
        && o.tableNumber
        && !dispatchedOrders.current.has(o.id)
    );
    const idleRobot = robots.find(r => r.status === 'idle' && r.batteryLevel > 20);
    if (!readyOrders.length || !idleRobot) return;

    const order = readyOrders[0];
    dispatchedOrders.current.add(order.id);

    fetch(`/api/robots/${idleRobot.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, tableNumber: order.tableNumber }),
    }).then(async r => {
      if (r.ok) {
        addLog(`AZOS: ${idleRobot.name} → 테이블 ${order.tableNumber}번 자동 파견`);
        await fetchAll();
        scheduleAutoAdvance(idleRobot.id, 'dispatched');
      }
    }).catch(() => { dispatchedOrders.current.delete(order.id); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, robots]);

  // 자동 단계 진행
  function scheduleAutoAdvance(robotId: string, currentStatus: RobotStatus) {
    if (autoTimers.current[robotId]) clearTimeout(autoTimers.current[robotId]);
    const delays: Partial<Record<RobotStatus, number>> = {
      dispatched: 5000,
      delivering: 6000,
      returning:  5000,
    };
    const delay = delays[currentStatus];
    if (!delay) return;

    autoTimers.current[robotId] = setTimeout(async () => {
      const res = await fetch(`/api/robots/${robotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: robotsRef.current.find(r => r.id === robotId)?.currentOrderId }),
      });
      if (res.ok) {
        const { robot: updated } = await res.json() as { robot: Robot };
        const labels: Partial<Record<RobotStatus, string>> = {
          delivering: `테이블 ${updated.currentTable}번 서빙 도착`,
          returning:  `테이블 ${updated.currentTable ?? '?'}번 서빙 완료 → 복귀 중`,
          idle:       '복귀 완료 · 충전 중',
        };
        addLog(`${updated.name}: ${labels[updated.status] ?? updated.status}`);
        await fetchAll();
        if (updated.status !== 'idle') scheduleAutoAdvance(robotId, updated.status);
      }
    }, delay);
  }

  // rAF 애니메이션 루프
  useEffect(() => {
    let rafId: number;
    let t = 0;

    function loop() {
      t++;
      setTick(t);

      // lerp 위치 갱신
      const currentRobots = robotsRef.current;
      const pos = { ...visPosRef.current };
      const newTrails: Record<string, TrailPoint[]> = { ...trailsRef.current };

      for (const robot of currentRobots) {
        const target = getRobotTarget(robot);
        const cur = pos[robot.id] ?? target;
        const speed = robot.status === 'idle' ? 0.08 : 0.04;
        const nx = cur.x + (target.x - cur.x) * speed;
        const ny = cur.y + (target.y - cur.y) * speed;
        pos[robot.id] = { x: nx, y: ny };

        // 잔상: 이동 중에만
        if (robot.status === 'dispatched' || robot.status === 'returning') {
          const trail = newTrails[robot.id] ?? [];
          if (t % 3 === 0) {
            trail.unshift({ x: nx, y: ny, t });
            newTrails[robot.id] = trail.slice(0, 12);
          }
        } else {
          newTrails[robot.id] = [];
        }
      }

      visPosRef.current = pos;
      trailsRef.current = newTrails;

      // canvas 드로잉
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        drawFloorPlan(ctx, ordersRef.current, currentRobots, pos, newTrails, t);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      Object.values(autoTimers.current).forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 수동 단계 진행
  async function handleSimulateStep(robot: Robot) {
    setLoadingId(robot.id);
    if (autoTimers.current[robot.id]) clearTimeout(autoTimers.current[robot.id]);
    const res = await fetch(`/api/robots/${robot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: robot.currentOrderId }),
    });
    if (res.ok) {
      const { robot: updated } = await res.json() as { robot: Robot };
      addLog(`[수동] ${updated.name}: ${STATUS_LABEL[updated.status]}`);
      if (updated.status !== 'idle') scheduleAutoAdvance(robot.id, updated.status);
    }
    await fetchAll();
    setLoadingId(null);
  }

  async function handleCharge(robot: Robot) {
    setLoadingId(robot.id);
    await fetch(`/api/robots/${robot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'charge' }),
    });
    addLog(`${robot.name}: 충전 (+20%)`);
    await fetchAll();
    setLoadingId(null);
  }

  async function handleManualDispatch(robot: Robot, tableNumber: number) {
    setDispatchTarget(null);
    setLoadingId(robot.id);
    if (autoTimers.current[robot.id]) clearTimeout(autoTimers.current[robot.id]);
    const fakeOrderId = `manual-${Date.now()}`;
    const res = await fetch(`/api/robots/${robot.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: fakeOrderId, tableNumber }),
    });
    if (res.ok) {
      addLog(`[수동] ${robot.name} → 테이블 ${tableNumber}번 파견`);
      scheduleAutoAdvance(robot.id, 'dispatched');
    }
    await fetchAll();
    setLoadingId(null);
  }

  const activeCount = robots.filter(r => r.status !== 'idle').length;
  const idleCount = robots.filter(r => r.status === 'idle').length;
  const dispatchedCount = robots.filter(r => r.status === 'dispatched' || r.status === 'returning').length;
  const deliveringCount = robots.filter(r => r.status === 'delivering').length;

  return (
    <div className="p-6 flex flex-col gap-5 max-w-6xl">
      {/* AZOS 오케스트레이션 배너 */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-bold text-indigo-800">
            AZOS가 {robots.length}대 로봇 동선을 조율 중
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto text-xs font-semibold">
          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            <Activity size={11} /> 서빙 중 {deliveringCount}대
          </span>
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            <MapPin size={11} /> 이동 중 {dispatchedCount}대
          </span>
          <span className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
            <BatteryCharging size={11} /> 대기 {idleCount}대
          </span>
        </div>
      </div>

      {/* 메인 2단 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

        {/* 평면도 캔버스 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-800 text-sm">매장 평면도</h2>
            <div className="flex items-center gap-3 text-[10px] text-stone-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-stone-200 inline-block" /> 빈 테이블</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block" /> 주문 중</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> 서빙 대기</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" /> 로봇 도착</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              className="w-full"
              style={{ maxHeight: CH }}
            />
          </div>
          <p className="text-[10px] text-stone-400 text-center">
            ready 상태 주문 발생 시 AZOS가 자동으로 가용 로봇을 파견합니다
          </p>
        </div>

        {/* 우측 패널 */}
        <div className="flex flex-col gap-4">
          {/* 로봇 카드 */}
          <div>
            <h2 className="font-bold text-stone-800 text-sm mb-3">로봇 상태</h2>
            <div className="flex flex-col gap-3">
              {robots.map(robot => (
                <div
                  key={robot.id}
                  className={clsx(
                    'bg-white rounded-2xl border p-4 flex flex-col gap-3 shadow-sm transition-colors',
                    robot.status === 'idle' ? 'border-stone-100' : 'border-indigo-200'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: ROBOT_COLOR[robot.id] ?? '#6366f1' }}
                    >
                      {robot.name.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{robot.name}</p>
                      <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STATUS_COLOR[robot.status])}>
                        {STATUS_LABEL[robot.status]}
                        {robot.currentTable ? ` · T${robot.currentTable}` : ''}
                      </span>
                    </div>
                  </div>

                  <BatteryBar level={robot.batteryLevel} />

                  <div className="flex gap-1.5">
                    {robot.status !== 'idle' && (
                      <button
                        onClick={() => handleSimulateStep(robot)}
                        disabled={loadingId === robot.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                      >
                        {loadingId === robot.id
                          ? <RotateCcw size={11} className="animate-spin" />
                          : <Bot size={11} />}
                        다음 단계
                      </button>
                    )}
                    {robot.status === 'idle' && robot.batteryLevel > 20 && (
                      <button
                        onClick={() => setDispatchTarget(robot)}
                        disabled={loadingId === robot.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                      >
                        <Zap size={11} />
                        수동 파견
                      </button>
                    )}
                    {robot.status === 'idle' && robot.batteryLevel < 80 && (
                      <button
                        onClick={() => handleCharge(robot)}
                        disabled={loadingId === robot.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-xl disabled:opacity-50"
                      >
                        <BatteryCharging size={11} />
                        충전
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이벤트 로그 */}
          <div className="bg-stone-900 rounded-2xl p-4 flex flex-col gap-2 min-h-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">실시간 이벤트</span>
            </div>
            {eventLog.length === 0 ? (
              <p className="text-[11px] text-stone-600 italic">로봇 파견 이벤트 대기 중...</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {eventLog.map((log, i) => (
                  <p key={i} className={clsx(
                    'text-[10px] font-mono leading-relaxed',
                    i === 0 ? 'text-green-400' : 'text-stone-500'
                  )}>
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 수동 파견 모달 */}
      {dispatchTarget && (
        <DispatchModal
          robot={dispatchTarget}
          onDispatch={table => handleManualDispatch(dispatchTarget, table)}
          onClose={() => setDispatchTarget(null)}
        />
      )}
    </div>
  );
}
