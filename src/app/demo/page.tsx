'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { UtensilsCrossed, Truck, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { OrderType } from '@/types/order';

export default function LandingPage() {
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableInput, setTableInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [error, setError] = useState('');
  const { setTable, setOrderType: storeSetOrderType, setDeliveryAddress } = useCartStore();
  const router = useRouter();

  function handleStart() {
    if (orderType === 'dine-in') {
      const n = parseInt(tableInput);
      if (!tableInput || isNaN(n) || n < 1 || n > 30) {
        setError('1~30 사이의 테이블 번호를 입력해 주세요.');
        return;
      }
      storeSetOrderType('dine-in');
      setTable(n);
      router.push('/menu');
    } else {
      if (!addressInput.trim() || addressInput.trim().length < 5) {
        setError('정확한 배달 주소를 입력해 주세요.');
        return;
      }
      storeSetOrderType('delivery');
      setDeliveryAddress(addressInput.trim());
      router.push('/menu');
    }
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
          {/* Order type selector */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-2">주문 방식 선택</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOrderType('dine-in'); setError(''); }}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-colors',
                  orderType === 'dine-in'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                )}
              >
                <UtensilsCrossed size={22} />
                매장 주문
              </button>
              <button
                onClick={() => { setOrderType('delivery'); setError(''); }}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-colors',
                  orderType === 'delivery'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                )}
              >
                <Truck size={22} />
                배달 주문
              </button>
            </div>
          </div>

          {/* Dine-in: table number */}
          {orderType === 'dine-in' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">테이블 번호</label>
              <p className="text-xs text-stone-400">테이블에 부착된 번호를 확인해 주세요</p>
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
            </div>
          )}

          {/* Delivery: address */}
          {orderType === 'delivery' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-500" />
                배달 주소
              </label>
              <textarea
                rows={2}
                placeholder="예) 서울시 마포구 와우산로 17길 5, 201호"
                value={addressInput}
                onChange={(e) => { setAddressInput(e.target.value); setError(''); }}
                className="w-full text-sm py-3 px-4 rounded-xl border-2 border-stone-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}

          <button
            onClick={handleStart}
            className={clsx(
              'w-full py-4 text-white font-semibold text-base rounded-xl transition-colors',
              orderType === 'dine-in'
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            )}
          >
            {orderType === 'dine-in' ? '메뉴 보기' : '메뉴 보기'}
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center">
          {orderType === 'dine-in'
            ? '테이블 번호가 없으신가요? 직원에게 문의해 주세요.'
            : '배달 가능 지역: 서울시 마포구, 서대문구 일대'}
        </p>
      </div>
    </main>
  );
}
