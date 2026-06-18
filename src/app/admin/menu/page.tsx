'use client';

import { useEffect, useState } from 'react';
import { MenuItem, MenuCategory } from '@/types/menu';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { clsx } from 'clsx';

const CATEGORY_LABEL: Record<MenuCategory, string> = {
  appetizer: '전식',
  main: '메인',
  dessert: '디저트',
  beverage: '음료',
  set: '세트',
};

export default function MenuAdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  // Toggle availability (client-side only in demo — no persist API yet)
  function toggleAvailable(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i))
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">메뉴 관리</h1>
        <span className="text-sm text-stone-400">{items.length}개 메뉴</span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 font-semibold text-stone-600">메뉴</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600 hidden sm:table-cell">카테고리</th>
              <th className="text-right px-4 py-3 font-semibold text-stone-600">가격</th>
              <th className="text-center px-4 py-3 font-semibold text-stone-600">태그</th>
              <th className="text-center px-4 py-3 font-semibold text-stone-600">판매 여부</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={clsx(
                  'border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors',
                  !item.available && 'opacity-50'
                )}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-800">{item.nameKo}</p>
                  <p className="text-xs text-stone-400 mt-0.5 hidden sm:block truncate max-w-xs">
                    {item.description}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-stone-700">
                  {item.price.toLocaleString()}원
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center flex-wrap">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAvailable(item.id)}
                    className={clsx(
                      'relative w-11 h-6 rounded-full transition-colors shrink-0',
                      item.available ? 'bg-amber-600' : 'bg-stone-300'
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        item.available ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
