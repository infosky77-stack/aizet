'use client';

import { MenuCategory } from '@/types/menu';
import { clsx } from 'clsx';

const CATEGORIES: { value: 'all' | MenuCategory; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'noodle', label: '면류' },
  { value: 'rice', label: '밥류' },
  { value: 'dish', label: '요리' },
  { value: 'side', label: '식사보조' },
  { value: 'set', label: '세트메뉴' },
];

interface Props {
  selected: 'all' | MenuCategory;
  onChange: (cat: 'all' | MenuCategory) => void;
}

export function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={clsx(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
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
