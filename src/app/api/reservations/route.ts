import { NextRequest } from 'next/server';
import { getReservations, getWaitingList, createReservation } from '@/lib/db/reservations';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type'); // 'walkin' | 'reservation' | null (all)
  const date = searchParams.get('date');

  let list = getReservations();
  if (type) list = list.filter((r) => r.type === type);
  if (date) list = list.filter((r) => r.date === date);

  return Response.json({ reservations: list, waitingList: getWaitingList() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, guestName, phone, partySize, date, time, note } = body;

  if (!guestName || !phone || !partySize || !date || !time) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rsv = createReservation({
    type: type ?? 'reservation',
    guestName,
    phone,
    partySize: Number(partySize),
    date,
    time,
    status: 'pending',
    note,
  });

  return Response.json({ reservation: rsv }, { status: 201 });
}
