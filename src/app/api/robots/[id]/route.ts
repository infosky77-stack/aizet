import { NextRequest } from 'next/server';
import { dispatchRobot, updateRobotStatus, simulateStep, chargeBattery } from '@/lib/db/robots';
import { updateOrderRobot, updateOrderStatus } from '@/lib/db/orders';
import { RobotStatus } from '@/types/robot';

const VALID_STATUSES: RobotStatus[] = ['idle', 'dispatched', 'delivering', 'returning'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { orderId, tableNumber } = await req.json();

  if (!orderId || !tableNumber) {
    return Response.json({ error: 'orderId and tableNumber required' }, { status: 400 });
  }

  const robot = dispatchRobot(id, orderId, tableNumber);
  if (!robot) return Response.json({ error: 'Robot not available' }, { status: 409 });

  updateOrderRobot(orderId, id);
  return Response.json({ robot });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, orderId } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const robot = updateRobotStatus(id, status);
  if (!robot) return Response.json({ error: 'Robot not found' }, { status: 404 });

  if (status === 'idle' && orderId) {
    updateOrderRobot(orderId, undefined);
    updateOrderStatus(orderId, 'delivered');
  }

  return Response.json({ robot });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.action === 'charge') {
    const robot = chargeBattery(id, 20);
    if (!robot) return Response.json({ error: 'Robot not available for charging' }, { status: 409 });
    return Response.json({ robot });
  }

  const robot = simulateStep(id);
  if (!robot) return Response.json({ error: 'Robot not found' }, { status: 404 });

  if (robot.status === 'idle' && body.orderId) {
    updateOrderRobot(body.orderId, undefined);
    updateOrderStatus(body.orderId, 'delivered');
  }

  return Response.json({ robot });
}
