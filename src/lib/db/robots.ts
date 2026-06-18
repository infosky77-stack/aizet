import { Robot, RobotStatus } from '@/types/robot';

const robots: Robot[] = [
  { id: 'robot-1', name: 'R1 알파', status: 'idle', batteryLevel: 92, updatedAt: new Date().toISOString() },
  { id: 'robot-2', name: 'R2 베타', status: 'idle', batteryLevel: 78, updatedAt: new Date().toISOString() },
  { id: 'robot-3', name: 'R3 감마', status: 'idle', batteryLevel: 55, updatedAt: new Date().toISOString() },
];

const NEXT_STATUS: Partial<Record<RobotStatus, RobotStatus>> = {
  dispatched: 'delivering',
  delivering: 'returning',
  returning: 'idle',
};

const BATTERY_DRAIN: Partial<Record<RobotStatus, number>> = {
  dispatched: 3,
  delivering: 4,
  returning: 2,
};

const BATTERY_CHARGE_RATE = 5;

export function getRobots(): Robot[] {
  return [...robots];
}

export function getRobotById(id: string): Robot | undefined {
  return robots.find((r) => r.id === id);
}

export function dispatchRobot(robotId: string, orderId: string, tableNumber: number): Robot | null {
  const robot = robots.find((r) => r.id === robotId);
  if (!robot || robot.status !== 'idle') return null;
  robot.status = 'dispatched';
  robot.currentOrderId = orderId;
  robot.currentTable = tableNumber;
  robot.updatedAt = new Date().toISOString();
  return robot;
}

export function updateRobotStatus(robotId: string, status: RobotStatus): Robot | null {
  const robot = robots.find((r) => r.id === robotId);
  if (!robot) return null;
  robot.status = status;
  if (status === 'idle') {
    robot.currentOrderId = undefined;
    robot.currentTable = undefined;
  }
  robot.updatedAt = new Date().toISOString();
  return robot;
}

export function getIdleRobot(): Robot | undefined {
  return robots.find((r) => r.status === 'idle' && r.batteryLevel > 20);
}

export function simulateStep(robotId: string): Robot | null {
  const robot = robots.find((r) => r.id === robotId);
  if (!robot) return null;

  const nextStatus = NEXT_STATUS[robot.status];
  if (!nextStatus) return robot;

  const drain = BATTERY_DRAIN[robot.status] ?? 0;
  robot.batteryLevel = Math.max(0, robot.batteryLevel - drain);

  if (nextStatus === 'idle') {
    robot.currentOrderId = undefined;
    robot.currentTable = undefined;
    robot.batteryLevel = Math.min(100, robot.batteryLevel + BATTERY_CHARGE_RATE);
  }

  robot.status = nextStatus;
  robot.updatedAt = new Date().toISOString();
  return robot;
}

export function chargeBattery(robotId: string, amount: number): Robot | null {
  const robot = robots.find((r) => r.id === robotId);
  if (!robot || robot.status !== 'idle') return null;
  robot.batteryLevel = Math.min(100, robot.batteryLevel + amount);
  robot.updatedAt = new Date().toISOString();
  return robot;
}
