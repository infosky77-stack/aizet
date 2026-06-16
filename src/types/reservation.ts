export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no-show';
export type ReservationType = 'reservation' | 'walkin';

export interface Reservation {
  id: string;
  type: ReservationType;
  guestName: string;
  phone: string;
  partySize: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  status: ReservationStatus;
  estimatedWaitMinutes?: number;
  tableNumber?: number;
  note?: string;
  createdAt: string;
}
