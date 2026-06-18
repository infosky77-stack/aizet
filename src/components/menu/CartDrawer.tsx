'use client';

import { useCartStore } from '@/store/cart';
import { X, Plus, Minus, ShoppingBag, MapPin, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DELIVERY_FEE = 3000;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, tableNumber, deliveryAddress, orderType, updateQuantity, clearCart, total, setLastOrderId } = useCartStore();
  const router = useRouter();

  async function handleOrder() {
    const payload =
      orderType === 'dine-in'
        ? { orderType: 'dine-in', tableNumber, items: items.map((i) => ({ menuItemId: i.menuItem.id, name: i.menuItem.nameKo, price: i.menuItem.price, quantity: i.quantity })) }
        : { orderType: 'delivery', deliveryAddress, items: items.map((i) => ({ menuItemId: i.menuItem.id, name: i.menuItem.nameKo, price: i.menuItem.price, quantity: i.quantity })) };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const { order } = await res.json();
    if (order?.id) {
      setLastOrderId(order.id);
      clearCart();
      onClose();
      router.push(`/payment?orderId=${order.id}`);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-lg">장바구니</h2>
            {orderType === 'dine-in' ? (
              <p className="text-xs text-stone-400">테이블 {tableNumber}번</p>
            ) : (
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <MapPin size={11} />
                <span className="truncate max-w-[180px]">{deliveryAddress}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
              <ShoppingBag size={48} className="opacity-30" />
              <p className="text-sm">담은 메뉴가 없습니다</p>
            </div>
          ) : (
            items.map((ci) => (
              <div key={ci.menuItem.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ci.menuItem.nameKo}</p>
                  <p className="text-xs text-amber-700 font-semibold">
                    {(ci.menuItem.price * ci.quantity).toLocaleString()}원
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(ci.menuItem.id, ci.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-stone-200 hover:border-amber-400 flex items-center justify-center transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{ci.quantity}</span>
                  <button
                    onClick={() => updateQuantity(ci.menuItem.id, ci.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-100 flex flex-col gap-3">
            {orderType === 'delivery' && (
              <div className="flex justify-between items-center text-sm text-stone-400">
                <span className="flex items-center gap-1"><Truck size={12} />배달료</span>
                <span>{DELIVERY_FEE.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium text-stone-600">합계</span>
              <span className="text-xl font-bold text-amber-700">
                {(total() + (orderType === 'delivery' ? DELIVERY_FEE : 0)).toLocaleString()}원
              </span>
            </div>
            <button
              onClick={handleOrder}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
            >
              {items.reduce((s, i) => s + i.quantity, 0)}개 주문하기
            </button>
            <button
              onClick={clearCart}
              className="text-xs text-stone-400 hover:text-red-400 text-center transition-colors"
            >
              장바구니 비우기
            </button>
          </div>
        )}
      </div>
    </>
  );
}
