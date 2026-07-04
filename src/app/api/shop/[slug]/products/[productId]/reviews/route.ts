// 구매자 리뷰 작성 API — 인증 없음(공개). 판매중(active) 상품에만 허용.
// rating은 db 계층(addReview)에서 1~5로 클램프된다.

import { NextRequest } from 'next/server';
import { getUserBySlug } from '@/lib/users';
import { getProduct, addReview } from '@/lib/db/products';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; productId: string }> },
) {
  const { slug, productId } = await params;
  const seller = getUserBySlug(slug);
  if (!seller) return Response.json({ error: '상점을 찾을 수 없습니다' }, { status: 404 });

  const product = getProduct(productId);
  if (!product || product.user_id !== seller.id || product.status !== 'active') {
    return Response.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  const text   = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
  const author = typeof body.authorName === 'string' ? body.authorName.trim().slice(0, 40) : '';
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: '별점(1~5)을 선택해 주세요' }, { status: 400 });
  }
  if (!text) return Response.json({ error: '리뷰 내용을 입력해 주세요' }, { status: 400 });

  const review = addReview(productId, seller.id, rating, text, author || '구매자');
  return Response.json({ ok: true, review });
}
