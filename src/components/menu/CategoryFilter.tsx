'use client';

import { MenuCategory } from '@/types/menu';
import { clsx } from 'clsx';

const CATEGORIES: { value: 'all' | MenuCategory; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'appetizer', label: '전식' },
  { value: 'main', label: '메인' },
  { value: 'dessert', label: '디저트' },
  { value: 'beverage', label: '음료' },
  { value: 'set', label: '세트' },
];

interface Props {
  selected: 'all' | MenuCategory;
  onChange: (cat: 'all' | MenuCategory) => void;
}

export function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={clsx(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selected === cat.value
              ? 'bg-amber-600 text-white'
              : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-400'
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
