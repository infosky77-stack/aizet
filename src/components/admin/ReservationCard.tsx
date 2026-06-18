'use client';

import { Reservation, ReservationStatus } from '@/types/reservation';
import { clsx } from 'clsx';
import { Users, Phone, MessageSquare, Hash } from 'lucide-react';

const STATUS_CFG: Record<ReservationStatus, { label: string; cls: string }> = {
  pending:   { label: '대기',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: '확정',   cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
  seated:    { label: '착석',   cls: 'bg-green-100  text-green-700  border-green-200'  },
  cancelled: { label: '취소',   cls: 'bg-red-100    text-red-600    border-red-200'    },
  'no-show': { label: '노쇼',   cls: 'bg-stone-100  text-stone-500  border-stone-200'  },
};

const NEXT_STATUS: Partial<Record<ReservationStatus, { status: ReservationStatus; label: string }>> = {
  pending:   { status: 'confirmed', label: '예약 확정' },
  confirmed: { status: 'seated',    label: '착석 처리' },
};

interface Props {
  rsv: Reservation;
  onUpdate: (id: string, patch: { status?: ReservationStatus; tableNumber?: number }) => void;
}

export function ReservationCard({ rsv, onUpdate }: Props) {
  const cfg = STATUS_CFG[rsv.status];
  const next = NEXT_STATUS[rsv.status];

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border shadow-sm overflow-hidden',
        rsv.status === 'pending' && 'border-yellow-300',
        rsv.status === 'seated'  && 'border-green-300',
        rsv.status === 'confirmed' && 'border-blue-200',
        !['pending','confirmed','seated'].includes(rsv.status) && 'border-stone-100 opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-stone-800">{rsv.guestName}</span>
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.cls)}>
            {cfg.label}
          </span>
        </div>
        <span className="text-sm font-semibold text-amber-700">{rsv.time}</span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-xs text-stone-500">
        <span className="flex items-center gap-1"><Users size={11} /> {rsv.partySize}명</span>
        <span className="flex items-center gap-1"><Phone size={11} /> {rsv.phone}</span>
        {rsv.tableNumber && (
          <span className="flex items-center gap-1"><Hash size={11} /> 테이블 {rsv.tableNumber}번</span>
        )}
        {rsv.note && (
          <span className="flex items-center gap-1 col-span-2 text-amber-700">
            <MessageSquare size={11} /> {rsv.note}
          </span>
        )}
      </div>

      {/* Actions */}
      {next && (
        <div className="px-4 py-3 border-t border-stone-50 flex gap-2">
          <button
            onClick={() => onUpdate(rsv.id, { status: next.status })}
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {next.label}
          </button>
          <button
            onClick={() => onUpdate(rsv.id, { status: 'cancelled' })}
            className="px-3 py-2 border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400 text-sm rounded-xl transition-colors"
          >
            취소
          </button>
          {rsv.status === 'pending' && (
            <button
              onClick={() => onUpdate(rsv.id, { status: 'no-show' })}
              className="px-3 py-2 border border-stone-200 text-stone-400 hover:border-stone-400 text-sm rounded-xl transition-colors"
            >
              노쇼
            </button>
          )}
        </div>
      )}
    </div>
  );
}
