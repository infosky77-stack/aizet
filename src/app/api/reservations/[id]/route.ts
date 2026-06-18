import { NextRequest } from 'next/server';
import { updateReservation, getReservationById } from '@/lib/db/reservations';
import { ReservationStatus } from '@/types/reservation';

const VALID: ReservationStatus[] = ['pending', 'confirmed', 'seated', 'cancelled', 'no-show'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, tableNumber, estimatedWaitMinutes } = body;

  if (status && !VALID.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const rsv = updateReservation(id, { status, tableNumber, estimatedWaitMinutes });
  if (!rsv) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ reservation: rsv });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rsv = getReservationById(id);
  if (!rsv) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ reservation: rsv });
}
