'use client';

// 리뷰 작성 폼 — 별점 선택 + 이름(선택) + 내용. 제출 성공 시 router.refresh()로
// 서버 컴포넌트(ProductDetailView)의 목록/집계를 다시 그린다.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  slug:      string;
  productId: string;
}

export function ReviewForm({ slug, productId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/shop/${slug}/products/${productId}/reviews`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rating, body, authorName: author }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.ok) {
      setOpen(false);
      setBody('');
      router.refresh();
    } else {
      setError(data?.error ?? '리뷰 등록에 실패했습니다.');
    }
    setSubmitting(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors"
      >
        상품평 남기기
      </button>
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`별점 ${n}점`}>
            <Star
              size={22}
              className={clsx(
                'transition-colors',
                n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200 hover:fill-amber-200',
              )}
            />
          </button>
        ))}
        <span className="text-xs text-stone-400 ml-1">{rating}점</span>
      </div>
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="이름 (선택)"
        className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="상품은 어떠셨나요?"
        className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white resize-y focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !body.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          등록
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-xs font-semibold rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
