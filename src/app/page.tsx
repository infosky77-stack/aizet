'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { UtensilsCrossed } from 'lucide-react';

export default function LandingPage() {
  const [tableInput, setTableInput] = useState('');
  const [error, setError] = useState('');
  const setTable = useCartStore((s) => s.setTable);
  const router = useRouter();

  function handleStart() {
    const n = parseInt(tableInput);
    if (!tableInput || isNaN(n) || n < 1 || n > 30) {
      setError('1~30 사이의 테이블 번호를 입력해 주세요.');
      return;
    }
    setTable(n);
    router.push('/menu');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-amber-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="text-white" size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-amber-800">AIZET</h1>
            <p className="text-sm text-stone-500 mt-1">AI 스마트 오더</p>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">테이블 번호를 입력하세요</h2>
            <p className="text-sm text-stone-400 mt-0.5">테이블에 부착된 번호를 확인해 주세요</p>
          </div>

          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            placeholder="예) 5"
            value={tableInput}
            onChange={(e) => { setTableInput(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
          />

          {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}

          <button
            onClick={handleStart}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-base rounded-xl transition-colors"
          >
            메뉴 보기
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center">
          테이블 번호가 없으신가요? 직원에게 문의해 주세요.
        </p>
      </div>
    </main>
  );
}
