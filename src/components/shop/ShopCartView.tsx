'use client';

// 구매자 장바구니 + 주문서 공유 뷰 — /site/[slug]/shop과 /hancandy가 같은 본체를 쓴다.
// v1은 주문 접수까지(무통장/연락 후 결제 안내). 가격 검증은 서버(주문 API) 담당.
// showHeader=false는 자체 헤더를 가진 상점 레이아웃(한캔디)용.

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CheckCircle, Package, Loader2,
} from 'lucide-react';
import { useShopCart, useCartItems, cartTotal } from '@/store/shopCart';
import { formatPrice } from '@/lib/shop/types';

const inputCls = 'w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-300';

interface Props {
  slug:       string;
  basePath?:  string;
  showHeader?: boolean;
}

export function ShopCartView({ slug, basePath, showHeader = true }: Props) {
  const base = basePath ?? `/site/${slug}/shop`;
  const items = useCartItems(slug);
  const { updateQty, removeItem, clear } = useShopCart();

  const [form, setForm] = useState({ name: '', phone: '', address: '', request: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null);

  async function handleOrder() {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/shop/${slug}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.ok) {
      setDone({ orderId: data.orderId, total: data.total });
      clear(slug);
    } else {
      setError(data?.error ?? '주문 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-3">주문이 접수되었습니다</h1>
        <p className="text-sm text-stone-500 mb-2">
          주문번호 <span className="font-mono font-semibold">{done.orderId.slice(0, 8)}</span> · {formatPrice(done.total)}
        </p>
        <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-3 mb-8 leading-relaxed">
          판매자가 주문을 확인한 뒤 결제(무통장 입금 등)와 배송 안내를 드립니다.<br />
          입력하신 연락처로 곧 연락드릴게요.
        </p>
        <Link
          href={base}
          className="block w-full bg-stone-900 hover:bg-stone-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          계속 쇼핑하기
        </Link>
      </div>
    );
  }

  return (
    <div className={showHeader ? 'min-h-screen bg-stone-50' : ''}>
      {showHeader && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href={base} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-bold text-stone-900">장바구니</h1>
          </div>
        </header>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-stone-400">
            <ShoppingCart size={32} className="opacity-30" />
            <p className="text-sm">장바구니가 비어 있습니다.</p>
            <Link href={base} className="text-sm font-semibold text-red-500 hover:underline">
              상품 보러 가기
            </Link>
          </div>
        ) : (
          <>
            {/* 항목 목록 */}
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 bg-white rounded-2xl border border-stone-100 p-3">
                  <div className="w-16 h-16 rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                    {item.thumbnailPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailPath} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={18} className="text-stone-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">{item.name}</p>
                    <p className="text-base font-black text-stone-900 mt-0.5">{formatPrice(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(slug, item.productId, item.qty - 1)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"><Minus size={13} /></button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(slug, item.productId, item.qty + 1)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"><Plus size={13} /></button>
                    <button onClick={() => removeItem(slug, item.productId)}
                      className="ml-1 p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* 주문서 */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-stone-800">배송 정보</h2>
              <input value={form.name} placeholder="받는 분 이름"
                onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <input value={form.phone} placeholder="휴대폰 번호 (010-0000-0000)"
                onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              <input value={form.address} placeholder="배송 주소"
                onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
              <input value={form.request} placeholder="요청사항 (선택)"
                onChange={(e) => setForm({ ...form, request: e.target.value })} className={inputCls} />
              <p className="text-[11px] text-stone-400 leading-relaxed">
                주문 접수 후 판매자가 결제(무통장 입금 등)와 배송을 개별 안내합니다.
              </p>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <button
                onClick={handleOrder}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {formatPrice(cartTotal(items))} 주문하기
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
