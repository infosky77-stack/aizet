import { NextRequest } from 'next/server';
import { getLegalReservations, createLegalReservation, updateLegalReservationStatus } from '@/lib/legal/data';

export async function GET() {
  return Response.json({ reservations: getLegalReservations() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, serviceType, topic, date, time, note } = body;

  if (!name || !phone || !topic || !date || !time) {
    return Response.json({ error: '필수 항목을 입력해 주세요.' }, { status: 400 });
  }

  const rsv = createLegalReservation({ name, phone, email: email ?? '', serviceType: serviceType ?? '', topic, date, time, note: note ?? '' });
  return Response.json({ reservation: rsv }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const rsv = updateLegalReservationStatus(id, status);
  if (!rsv) return Response.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
  return Response.json({ reservation: rsv });
}
