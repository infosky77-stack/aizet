'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Order, PaymentMethod } from '@/types/order';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { CreditCard, Banknote, Smartphone, CheckCircle, Clock, Truck, UtensilsCrossed, MapPin, Receipt } from 'lucide-react';
import { clsx } from 'clsx';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'card', label: '신용/체크카드', icon: <CreditCard size={20} />, color: 'border-stone-300 hover:border-stone-500' },
  { value: 'kakao', label: '카카오페이', icon: <Smartphone size={20} />, color: 'border-yellow-300 hover:border-yellow-500' },
  { value: 'naver', label: '네이버페이', icon: <Smartphone size={20} />, color: 'border-green-300 hover:border-green-500' },
  { value: 'cash', label: '현금결제', icon: <Banknote size={20} />, color: 'border-stone-300 hover:border-stone-500' },
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const { order: o } = await res.json();
        setOrder(o);
        if (o.paymentStatus === 'paid' || o.paymentStatus === 'pending') {
          setSubmitted(true);
          setSelectedMethod(o.paymentMethod ?? null);
        }
      }
    };
    fetchOrder();
    const id = setInterval(fetchOrder, 3000);
    return () => clearInterval(id);
  }, [orderId]);

  async function handlePayment() {
    if (!selectedMethod || !orderId) return;
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentMethod: selectedMethod }),
    });
    if (res.ok) {
      const { order: o } = await res.json();
      setOrder(o);
      setSubmitted(true);
    }
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400">
        잘못된 접근입니다.
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-amber-50 to-[#fafaf8]">
      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">중화가정</p>
            <p className="text-xs text-stone-400">결제</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 text-sm">주문 내역</span>
            {order.orderType === 'delivery' ? (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <Truck size={12} />
                배달 주문
              </span>
            ) : (
              <span className="text-xs text-stone-400">테이블 {order.tableNumber}번</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.name} × {item.quantity}</span>
                <span className="text-stone-800 font-medium">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            {order.deliveryFee !== undefined && (
              <div className="flex justify-between text-sm text-stone-400">
                <span>배달료</span>
                <span>{order.deliveryFee.toLocaleString()}원</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold border-t border-stone-100 pt-3">
            <span>총 결제금액</span>
            <span className="text-amber-700 text-lg">{order.totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {/* Payment status / method selection */}
        {isPaid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-3">
            <CheckCircle size={40} className="text-emerald-500" />
            <p className="font-bold text-emerald-700 text-lg">결제 완료</p>
            <p className="text-sm text-emerald-600 text-center">결제가 확인되었습니다. 감사합니다!</p>
            <div className="flex gap-2 mt-2 w-full">
              <button
                onClick={() => setShowReceipt(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold rounded-xl transition-colors"
              >
                <Receipt size={15} />
                영수증 보기
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                처음으로
              </button>
            </div>
          </div>
        ) : submitted ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col items-center gap-3">
            <Clock size={40} className="text-blue-400 animate-pulse" />
            <p className="font-bold text-blue-700">결제 요청 중</p>
            <p className="text-sm text-blue-600 text-center">
              직원이 결제를 확인하고 있습니다. 잠시만 기다려 주세요.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-4">
            <p className="font-semibold text-stone-700 text-sm">결제 방법 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon, color }) => (
                <button
                  key={value}
                  onClick={() => setSelectedMethod(value)}
                  className={clsx(
                    'flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-colors',
                    selectedMethod === value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : `border-stone-200 text-stone-600 ${color}`
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={!selectedMethod}
              className={clsx(
                'w-full py-4 text-white font-bold rounded-xl transition-colors',
                selectedMethod
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              )}
            >
              {selectedMethod ? `${order.totalAmount.toLocaleString()}원 결제 요청` : '결제 방법을 선택하세요'}
            </button>
          </div>
        )}

        {showReceipt && order && (
          <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />
        )}

        {/* Delivery tracking link */}
        {order.orderType === 'delivery' && (
          <button
            onClick={() => router.push(`/tracking?orderId=${orderId}`)}
            className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <MapPin size={15} />
            배달 실시간 추적
          </button>
        )}

        {/* Order status */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between text-sm">
          <span className="text-stone-500">주문 상태</span>
          <span className={clsx(
            'font-semibold px-3 py-1 rounded-full text-xs',
            order.status === 'pending' && 'bg-yellow-100 text-yellow-700',
            order.status === 'confirmed' && 'bg-blue-100 text-blue-700',
            order.status === 'preparing' && 'bg-orange-100 text-orange-700',
            order.status === 'ready' && 'bg-green-100 text-green-700',
            order.status === 'delivered' && 'bg-stone-100 text-stone-600',
          )}>
            {order.status === 'pending' && '대기 중'}
            {order.status === 'confirmed' && '접수됨'}
            {order.status === 'preparing' && '조리 중'}
            {order.status === 'ready' && '배달 출발'}
            {order.status === 'delivered' && '배달 완료'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
