import { NextRequest } from 'next/server';
import { getTaxReservations, createTaxReservation, updateTaxReservationStatus } from '@/lib/tax/data';

export async function GET() {
  return Response.json({ reservations: getTaxReservations() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, businessType, topic, date, time, note } = body;

  if (!name || !phone || !topic || !date || !time) {
    return Response.json({ error: '필수 항목을 입력해 주세요.' }, { status: 400 });
  }

  const rsv = createTaxReservation({ name, phone, email: email ?? '', businessType: businessType ?? '개인', topic, date, time, note: note ?? '' });
  return Response.json({ reservation: rsv }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const rsv = updateTaxReservationStatus(id, status);
  if (!rsv) return Response.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
  return Response.json({ reservation: rsv });
}
