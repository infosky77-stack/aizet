'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { useCandyCart } from '@/store/candyCart';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCandyCart();
  const [orderDone, setOrderDone] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', request: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '이름을 입력해 주세요.';
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) e.phone = '올바른 휴대폰 번호를 입력해 주세요.';
    if (form.address.trim().length < 5) e.address = '정확한 주소를 입력해 주세요.';
    return e;
  }

  function handleOrder() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setOrderDone(true);
    clearCart();
  }

  if (orderDone) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">주문이 완료되었습니다!</h1>
        <p className="text-gray-500 text-sm mb-2">주문해 주셔서 감사합니다. 🌿</p>
        <p className="text-xs text-gray-400 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-3">
          ⚠️ 이 화면은 데모입니다. 실제 결제 및 배송이 이루어지지 않습니다.<br />
          한캔디는 현재 출시 준비 중입니다.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/hancandy/products"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            계속 쇼핑하기
          </Link>
          <Link href="/hancandy" className="text-sm text-green-600 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={36} className="text-gray-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-700 mb-2">장바구니가 비었어요</h1>
        <p className="text-gray-400 text-sm mb-6">마음에 드는 캔디를 담아보세요!</p>
        <Link
          href="/hancandy/products"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          제품 보러가기
        </Link>
      </div>
    );
  }

  const subtotal = total();
  const shipping = subtotal >= 30000 ? 0 : 3000;
  const grandTotal = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/hancandy/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors">
        <ArrowLeft size={14} />
        계속 쇼핑하기
      </Link>
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart size={22} className="text-green-600" />
        장바구니
        <span className="text-sm font-normal text-gray-400">({items.length}종)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product: p, quantity }) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${p.bgColor} flex items-center justify-center text-2xl shrink-0`}>
                {p.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm truncate">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.flavor} · {p.weight}</div>
                <div className="text-sm font-black text-green-700 mt-1">{p.price.toLocaleString()}원</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(p.id, quantity - 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-800">{quantity}</span>
                <button
                  onClick={() => updateQuantity(p.id, quantity + 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="text-sm font-black text-gray-900 min-w-[5rem] text-right">
                {(p.price * quantity).toLocaleString()}원
              </div>
              <button
                onClick={() => removeItem(p.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Shipping notice */}
          <div className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${
            shipping === 0
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            <Package size={13} />
            {shipping === 0
              ? '🎉 3만원 이상 구매로 무료 배송 적용!'
              : `3만원 이상 구매 시 무료 배송 (${(30000 - subtotal).toLocaleString()}원 더 담으면 무료)`}
          </div>
        </div>

        {/* Order summary + form */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">주문 요약</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900">
                <span>합계</span>
                <span className="text-green-700">{grandTotal.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* Order form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">배송 정보</h2>
            <div className="space-y-3">
              {[
                { key: 'name', label: '이름', placeholder: '홍길동', type: 'text' },
                { key: 'phone', label: '휴대폰', placeholder: '010-1234-5678', type: 'tel' },
                { key: 'address', label: '주소', placeholder: '서울시 강남구 테헤란로 123, 456호', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setErrors(prev => ({ ...prev, [f.key]: '' })); }}
                    className={`w-full text-sm px-3 py-2.5 rounded-xl border transition-colors ${
                      errors[f.key] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-green-400'
                    } focus:outline-none`}
                  />
                  {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">배송 요청사항 (선택)</label>
                <input
                  type="text"
                  placeholder="예) 부재 시 문 앞에 놓아주세요"
                  value={form.request}
                  onChange={e => setForm(prev => ({ ...prev, request: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleOrder}
              className="mt-5 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-md shadow-green-200 transition-all text-base"
            >
              {grandTotal.toLocaleString()}원 주문하기
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              ※ 데모 화면 – 실제 결제가 이루어지지 않습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
