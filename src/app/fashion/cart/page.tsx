'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, CheckCircle, Truck, Tag, CreditCard, ShoppingBag } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  qty: number;
  img: string;
}

const INITIAL_CART: CartItem[] = [
  { id: 1, name: '오버핏 울 코트', category: '아우터', price: 148000, size: 'M', color: '차콜', qty: 1, img: '/fashion/product-01.jpg' },
  { id: 3, name: '와이드 슬랙스', category: '하의', price: 75000, size: 'S', color: '블랙', qty: 1, img: '/fashion/product-03.jpg' },
];

type Step = 'cart' | 'address' | 'payment' | 'done';

const PAYMENT_METHODS = ['신용카드', '카카오페이', '네이버페이', '토스페이', '무통장입금'];

export default function FashionCartPage() {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [step, setStep] = useState<Step>('cart');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', addressDetail: '', memo: '' });
  const [payMethod, setPayMethod] = useState('신용카드');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 50000 ? 0 : 3000;
  const discount = couponApplied ? Math.floor(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  function updateQty(id: number, delta: number) {
    setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }
  function remove(id: number) {
    setCart(c => c.filter(i => i.id !== id));
  }
  function applyCoupon() {
    if (coupon.trim().toUpperCase() === 'NEW10') {
      setCouponApplied(true);
    } else {
      alert('유효하지 않은 쿠폰 코드입니다. (힌트: NEW10)');
    }
  }

  function validateAddress() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '받으시는 분 성함을 입력해 주세요.';
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) e.phone = '올바른 휴대폰 번호를 입력해 주세요.';
    if (!form.address.trim()) e.address = '배송지 주소를 입력해 주세요.';
    return e;
  }

  async function handlePayment() {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    setStep('done');
  }

  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-orange-500" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-3">주문이 완료되었습니다!</h1>
        <p className="text-stone-500 mb-2">주문 확인 문자를 발송했습니다.</p>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-stone-700 text-left mt-4 mb-6 space-y-1.5">
          <p><span className="font-semibold">주문 번호:</span> MF-{Date.now().toString().slice(-8)}</p>
          <p><span className="font-semibold">받으시는 분:</span> {form.name}</p>
          <p><span className="font-semibold">결제 방법:</span> {payMethod}</p>
          <p><span className="font-semibold">결제 금액:</span> {total.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 text-sm text-stone-600 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={14} className="text-orange-500" />
            <span className="font-semibold">배송 예정: 2~3 영업일 이내</span>
          </div>
          <p className="text-xs text-stone-400">주문 후 송장번호는 문자로 발송됩니다.</p>
        </div>
        <Link href="/fashion" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          <ShoppingBag size={16} />
          쇼핑 계속하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* 단계 표시 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['cart', 'address', 'payment'] as const).map((s, i) => {
          const labels = { cart: '장바구니', address: '배송지', payment: '결제' };
          const active = s === step;
          const done = ['cart', 'address', 'payment'].indexOf(s) < ['cart', 'address', 'payment'].indexOf(step);
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${done ? 'bg-orange-400' : 'bg-stone-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                active ? 'bg-orange-600 text-white' : done ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-400'
              }`}>
                <span>{labels[s]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 영역 */}
        <div className="lg:col-span-2">
          {/* ── STEP 1: 장바구니 ── */}
          {step === 'cart' && (
            <div>
              <h1 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-2">
                <ShoppingCart size={22} />
                장바구니 ({cart.length}개)
              </h1>
              {cart.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
                  <ShoppingCart size={40} className="text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-500 mb-4">장바구니가 비어 있습니다.</p>
                  <Link href="/fashion" className="inline-flex items-center gap-2 bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-orange-700 transition-colors text-sm">
                    쇼핑하러 가기
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <CartItemRow key={item.id} item={item} onQtyChange={updateQty} onRemove={remove} />
                  ))}
                </div>
              )}

              {/* 쿠폰 */}
              {cart.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl border border-stone-100 p-5">
                  <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                    <Tag size={16} className="text-orange-500" />
                    쿠폰 코드
                  </h3>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      placeholder="쿠폰 코드 입력 (예: NEW10)"
                      disabled={couponApplied}
                      className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-stone-50 disabled:text-stone-400"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponApplied || !coupon.trim()}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {couponApplied ? '적용됨' : '적용'}
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-green-600 font-semibold mt-2">신규 회원 10% 할인 쿠폰이 적용되었습니다!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: 배송지 ── */}
          {step === 'address' && (
            <div>
              <h1 className="text-2xl font-black text-stone-900 mb-6">배송지 입력</h1>
              <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">받으시는 분 <span className="text-red-500">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                    placeholder="성함을 입력해 주세요"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition ${errors.name ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">휴대폰 번호 <span className="text-red-500">*</span></label>
                  <input
                    value={form.phone}
                    onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: '' })); }}
                    placeholder="010-0000-0000"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition ${errors.phone ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">배송 주소 <span className="text-red-500">*</span></label>
                  <input
                    value={form.address}
                    onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: '' })); }}
                    placeholder="도로명 주소를 입력해 주세요"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition ${errors.address ? 'border-red-300 bg-red-50' : 'border-stone-200'}`}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">상세 주소</label>
                  <input
                    value={form.addressDetail}
                    onChange={e => setForm(f => ({ ...f, addressDetail: e.target.value }))}
                    placeholder="동·호수·층을 입력해 주세요"
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">배송 메모</label>
                  <select
                    value={form.memo}
                    onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition bg-white"
                  >
                    <option value="">선택 안 함</option>
                    <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                    <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
                    <option value="직접 받겠습니다">직접 받겠습니다</option>
                    <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: 결제 ── */}
          {step === 'payment' && (
            <div>
              <h1 className="text-2xl font-black text-stone-900 mb-6">결제 수단 선택</h1>
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                        payMethod === m
                          ? 'border-orange-500 bg-orange-50 text-orange-800'
                          : 'border-stone-100 bg-white text-stone-700 hover:border-orange-200'
                      }`}
                    >
                      <CreditCard size={18} className={payMethod === m ? 'text-orange-500' : 'text-stone-400'} />
                      <span className="font-semibold text-sm">{m}</span>
                      {payMethod === m && <CheckCircle size={16} className="text-orange-500 ml-auto" />}
                    </button>
                  ))}
                </div>

                <div className="mt-6 bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-1">
                  <p className="font-semibold text-stone-700 mb-2">결제 안내</p>
                  <p>• 결제 완료 후 바로 주문 확인 문자가 발송됩니다.</p>
                  <p>• 카드 결제 시 일시불 또는 할부(3개월 이상 무이자) 선택 가능합니다.</p>
                  <p>• 무통장입금 선택 시 입금 기한은 24시간이며, 미입금 시 자동 취소됩니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 주문 요약 사이드바 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-24">
            <h3 className="font-black text-stone-900 mb-4">주문 요약</h3>
            <div className="space-y-2 text-sm mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-stone-600">
                  <span className="truncate pr-2">{item.name} ({item.size}) × {item.qty}</span>
                  <span className="shrink-0 font-medium">{(item.price * item.qty).toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>상품 금액</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>배송비</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-600">
                  <span>쿠폰 할인</span>
                  <span>-{discount.toLocaleString()}원</span>
                </div>
              )}
              <div className="border-t border-stone-100 pt-2 flex justify-between font-black text-stone-900 text-base">
                <span>최종 결제 금액</span>
                <span className="text-orange-600">{total.toLocaleString()}원</span>
              </div>
            </div>

            {subtotal > 0 && subtotal < 50000 && (
              <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2.5 mt-3 text-center">
                {(50000 - subtotal).toLocaleString()}원 더 구매하면 무료배송!
              </p>
            )}

            <div className="mt-4 space-y-2">
              {step === 'cart' && (
                <button
                  onClick={() => setStep('address')}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  주문하기 <ArrowRight size={15} />
                </button>
              )}
              {step === 'address' && (
                <>
                  <button
                    onClick={() => {
                      const e = validateAddress();
                      if (Object.keys(e).length > 0) { setErrors(e); return; }
                      setStep('payment');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors"
                  >
                    결제 수단 선택 <ArrowRight size={15} />
                  </button>
                  <button onClick={() => setStep('cart')} className="w-full text-sm text-stone-500 hover:text-stone-700 py-2">
                    장바구니로 돌아가기
                  </button>
                </>
              )}
              {step === 'payment' && (
                <>
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
                  >
                    <CreditCard size={15} />
                    {submitting ? '결제 처리 중...' : `${total.toLocaleString()}원 결제하기`}
                  </button>
                  <button onClick={() => setStep('address')} className="w-full text-sm text-stone-500 hover:text-stone-700 py-2">
                    배송지로 돌아가기
                  </button>
                </>
              )}
            </div>

            <p className="text-[10px] text-stone-400 text-center mt-3">
              본 데모에서는 실제 결제가 이루어지지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 items-start shadow-sm">
      <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <ShoppingBag size={24} />
          </div>
        ) : (
          <Image
            src={item.img}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">{item.category}</p>
        <h4 className="font-bold text-stone-900 text-sm leading-snug mb-1">{item.name}</h4>
        <div className="flex gap-2 text-xs text-stone-500 mb-2">
          <span>사이즈: {item.size}</span>
          <span>·</span>
          <span>색상: {item.color}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 border border-stone-200 rounded-lg">
            <button onClick={() => onQtyChange(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-50 rounded-l-lg transition-colors">
              <Minus size={12} />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-stone-900">{item.qty}</span>
            <button onClick={() => onQtyChange(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-50 rounded-r-lg transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-stone-900 text-sm">{(item.price * item.qty).toLocaleString()}원</span>
            <button onClick={() => onRemove(item.id)} className="text-stone-300 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
