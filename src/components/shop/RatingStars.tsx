// 별점 + 리뷰수 표시 — 리뷰 없으면 아무것도 그리지 않는다(쿠팡 카드 관례).
import { Star } from 'lucide-react';

interface Props {
  rating: number | null | undefined;
  count:  number | undefined;
  size?:  number;
}

export function RatingStars({ rating, count, size = 12 }: Props) {
  if (rating == null) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-stone-500">
      <span className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}
          />
        ))}
      </span>
      <span className="font-medium">{rating}</span>
      {count !== undefined && count > 0 && (
        <span className="text-stone-400">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
