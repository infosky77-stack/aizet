'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Order } from '@/types/order';
import {
  CheckCircle,
  Clock,
  ChefHat,
  Bike,
  MapPin,
  UtensilsCrossed,
  ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

const STEPS: {
  status: Order['status'][];
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { status: ['confirmed'], label: '주문 접수', icon: CheckCircle, description: '주문이 확인되었습니다' },
  { status: ['preparing'], label: '조리 중', icon: ChefHat, description: '주방에서 맛있게 준비하고 있어요' },
  { status: ['ready'], label: '배달 출발', icon: Bike, description: '배달원이 픽업했습니다' },
  { status: ['delivered'], label: '배달 완료', icon: MapPin, description: '배달이 완료되었습니다!' },
];

function getStepIndex(status: Order['status']): number {
  if (status === 'confirmed') return 0;
  if (status === 'preparing') return 1;
  if (status === 'ready') return 2;
  if (status === 'delivered') return 3;
  return -1;
}

function EstimatedTime({ order }: { order: Order }) {
  const createdAt = new Date(order.createdAt).getTime();
  const estimatedMs = (order.estimatedDeliveryMinutes ?? 30) * 60 * 1000;
  const arrival = new Date(createdAt + estimatedMs);
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((arrival.getTime() - now) / 60000));

  if (order.status === 'delivered') return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
      <Clock size={20} className="text-amber-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">예상 도착</p>
        <p className="text-xs text-amber-600">
          {remaining > 0 ? `약 ${remaining}분 후 도착 예정` : '곧 도착 예정'}
          {' · '}
          {arrival.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const { order: o } = await res.json();
        setOrder(o);
      }
    };
    fetchOrder();
    const id = setInterval(fetchOrder, 4000);
    return () => clearInterval(id);
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
        잘못된 접근입니다.
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">배달 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#fafaf8] px-4 py-8">
      <div className="max-w-sm mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
              <UtensilsCrossed size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-amber-800 text-sm">AIZET</p>
              <p className="text-xs text-stone-400">배달 추적</p>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-start gap-3">
          <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-400 mb-0.5">배달 주소</p>
            <p className="text-sm font-semibold text-stone-800 break-all">{order.deliveryAddress}</p>
          </div>
        </div>

        {/* Estimated time */}
        <EstimatedTime order={order} />

        {/* Status timeline */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-5">배달 현황</h2>
          <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = currentStep > i;
              const active = currentStep === i;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={i} className="flex gap-4">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        done ? 'bg-emerald-500' : active ? 'bg-amber-500' : 'bg-stone-100'
                      )}
                    >
                      <Icon
                        size={16}
                        className={done ? 'text-white' : active ? 'text-white' : 'text-stone-300'}
                      />
                    </div>
                    {!isLast && (
                      <div
                        className={clsx(
                          'w-0.5 h-8 my-1 transition-colors',
                          done ? 'bg-emerald-300' : 'bg-stone-100'
                        )}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 pb-6">
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        active ? 'text-amber-700' : done ? 'text-stone-700' : 'text-stone-300'
                      )}
                    >
                      {step.label}
                      {active && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                          진행 중
                        </span>
                      )}
                    </p>
                    <p
                      className={clsx(
                        'text-xs mt-0.5',
                        active || done ? 'text-stone-400' : 'text-stone-200'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="font-bold text-stone-800 text-sm mb-3">주문 내역</h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.name} × {item.quantity}</span>
                <span className="text-stone-700 font-medium">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            {order.deliveryFee !== undefined && (
              <div className="flex justify-between text-sm text-stone-400 border-t border-stone-50 pt-2 mt-1">
                <span>배달료</span>
                <span>{order.deliveryFee.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-stone-100 pt-2 mt-1">
              <span>합계</span>
              <span className="text-amber-700">{order.totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {order.status === 'delivered' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col items-center gap-2">
            <CheckCircle size={36} className="text-emerald-500" />
            <p className="font-bold text-emerald-700">배달 완료!</p>
            <p className="text-sm text-emerald-600 text-center">맛있게 드세요. 이용해 주셔서 감사합니다.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              처음으로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense>
      <TrackingContent />
    </Suspense>
  );
}
