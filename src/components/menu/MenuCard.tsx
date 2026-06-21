'use client';

import { MenuItem } from '@/types/menu';
import { useCartStore } from '@/store/cart';
import { Plus, Minus, Flame, Leaf } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  item: MenuItem;
}

export function MenuCard({ item }: Props) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menuItem.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md',
        !item.available && 'opacity-50 pointer-events-none',
        qty > 0 && 'border-amber-400 shadow-amber-100'
      )}
    >
      {/* Image placeholder */}
      <div className="h-36 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-5xl relative">
        {item.category === 'noodle' && '🍜'}
        {item.category === 'rice' && '🍚'}
        {item.category === 'dish' && '🍲'}
        {item.category === 'side' && '🥢'}
        {item.category === 'set' && '🍱'}

        {/* Tags */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.tags.includes('popular') && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              인기
            </span>
          )}
          {item.tags.includes('best-value') && (
            <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              추천
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm leading-tight text-stone-800">{item.nameKo}</h3>
          <div className="flex gap-1 shrink-0 mt-0.5">
            {item.tags.includes('spicy') && <Flame size={13} className="text-red-500" />}
            {item.tags.includes('vegetarian') && <Leaf size={13} className="text-green-600" />}
          </div>
        </div>

        <p className="text-xs text-stone-400 line-clamp-2 leading-tight">{item.description}</p>

        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-amber-700">{item.price.toLocaleString()}원</span>

          {qty === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors"
            >
              <Plus size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="w-7 h-7 rounded-full border border-stone-300 hover:border-amber-500 flex items-center justify-center transition-colors"
              >
                <Minus size={13} />
              </button>
              <span className="text-sm font-bold w-4 text-center text-amber-700">{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
