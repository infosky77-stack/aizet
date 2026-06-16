'use client';

import { Reservation } from '@/types/reservation';
import { Users, Clock, CheckCircle } from 'lucide-react';

interface Props {
  rsv: Reservation;
  position: number;
  onSeat: (id: string) => void;
  onCancel: (id: string) => void;
}

function waitedMinutes(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

export function WaitingCard({ rsv, position, onSeat, onCancel }: Props) {
  const waited = waitedMinutes(rsv.createdAt);
  const isLong = waited > 20;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isLong ? 'border-red-200' : 'border-stone-100'}`}>
      {/* Position badge + name */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-50">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          position === 1 ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
        }`}>
          {position}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-stone-800">{rsv.guestName}</p>
          <p className="text-xs text-stone-400">{rsv.phone}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isLong ? 'text-red-500' : 'text-stone-600'}`}>
            {waited}분 대기
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1"><Users size={11} /> {rsv.partySize}명</span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {rsv.estimatedWaitMinutes != null
            ? `예상 ${rsv.estimatedWaitMinutes}분`
            : '예측 전'}
        </span>
        {isLong && (
          <span className="ml-auto text-red-500 font-semibold">장기 대기</span>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-stone-50 flex gap-2">
        <button
          onClick={() => onSeat(rsv.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <CheckCircle size={14} />
          입장 처리
        </button>
        <button
          onClick={() => onCancel(rsv.id)}
          className="px-3 py-2 border border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400 text-sm rounded-xl transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
