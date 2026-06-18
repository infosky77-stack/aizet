import { Reservation, ReservationStatus } from '@/types/reservation';

const reservations: Reservation[] = [];
let seeded = false;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function nowPlus(minutes: number) {
  const d = new Date(Date.now() + minutes * 60000);
  return d.toTimeString().slice(0, 5);
}

function seedReservations() {
  if (seeded) return;
  seeded = true;
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const seeds: Omit<Reservation, 'id'>[] = [
    // 현장 대기 (walkin)
    {
      type: 'walkin',
      guestName: '김민준',
      phone: '010-1234-5678',
      partySize: 2,
      date: today,
      time: nowPlus(-18),
      status: 'pending',
      estimatedWaitMinutes: 15,
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    },
    {
      type: 'walkin',
      guestName: '이서연',
      phone: '010-2345-6789',
      partySize: 4,
      date: today,
      time: nowPlus(-10),
      status: 'pending',
      estimatedWaitMinutes: 25,
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      type: 'walkin',
      guestName: '박도현',
      phone: '010-3456-7890',
      partySize: 1,
      date: today,
      time: nowPlus(-3),
      status: 'pending',
      estimatedWaitMinutes: 10,
      createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    // 사전 예약 (reservation)
    {
      type: 'reservation',
      guestName: '최유진',
      phone: '010-4567-8901',
      partySize: 3,
      date: today,
      time: '19:00',
      status: 'confirmed',
      tableNumber: 8,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      type: 'reservation',
      guestName: '정하은',
      phone: '010-5678-9012',
      partySize: 6,
      date: today,
      time: '20:00',
      status: 'confirmed',
      note: '생일 파티, 케이크 서비스 요청',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      type: 'reservation',
      guestName: '강지훈',
      phone: '010-6789-0123',
      partySize: 2,
      date: today,
      time: '18:30',
      status: 'seated',
      tableNumber: 4,
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      type: 'reservation',
      guestName: '윤소희',
      phone: '010-7890-1234',
      partySize: 4,
      date: tomorrow,
      time: '12:30',
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      type: 'reservation',
      guestName: '임태양',
      phone: '010-8901-2345',
      partySize: 2,
      date: tomorrow,
      time: '19:30',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
  ];

  seeds.forEach((data, i) => {
    reservations.push({ ...data, id: `rsv-seed-${i + 1}` });
  });
}

export function getReservations(): Reservation[] {
  seedReservations();
  return [...reservations].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
}

export function getWaitingList(): Reservation[] {
  seedReservations();
  return reservations
    .filter((r) => r.type === 'walkin' && r.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getReservationById(id: string): Reservation | undefined {
  seedReservations();
  return reservations.find((r) => r.id === id);
}

export function createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Reservation {
  seedReservations();
  const rsv: Reservation = {
    ...data,
    id: `rsv-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reservations.push(rsv);
  return rsv;
}

export function updateReservation(
  id: string,
  patch: Partial<Pick<Reservation, 'status' | 'tableNumber' | 'estimatedWaitMinutes'>>
): Reservation | null {
  seedReservations();
  const rsv = reservations.find((r) => r.id === id);
  if (!rsv) return null;
  Object.assign(rsv, patch);
  return rsv;
}
