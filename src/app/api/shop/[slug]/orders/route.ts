// 구매자 주문 접수 API — 인증 없음(공개). v1은 주문 접수까지(PG 없음, 무통장/연락 후 결제).
//
// 클라이언트 장바구니의 가격/이름은 신뢰하지 않는다: productId로 서버 상품을 다시 조회해
// active(판매중)·소유자 일치인 항목만 서버 가격으로 주문에 넣는다. 이 검증을 우회하는
// 경로를 만들지 말 것(할인 조작 방지의 핵심).

import { NextRequest } from 'next/server';
import { getUserBySlug } from '@/lib/users';
import { getProduct } from '@/lib/db/products';
import { createShopOrder, type ShopOrderItemInput } from '@/lib/db/shop-orders';

export const dynamic = 'force-dynamic';

interface OrderBody {
  buyer?: { name?: string; phone?: string; address?: string; request?: string };
  items?: { productId?: string; qty?: number }[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const seller = getUserBySlug(slug);
  if (!seller) return Response.json({ error: '상점을 찾을 수 없습니다' }, { status: 404 });

  const body: OrderBody = await req.json().catch(() => ({}));
  const buyer = body.buyer ?? {};
  const name    = (buyer.name ?? '').trim();
  const phone   = (buyer.phone ?? '').replace(/\s/g, '');
  const address = (buyer.address ?? '').trim();
  if (!name) return Response.json({ error: '이름을 입력해 주세요' }, { status: 400 });
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)) {
    return Response.json({ error: '올바른 휴대폰 번호를 입력해 주세요' }, { status: 400 });
  }
  if (address.length < 5) return Response.json({ error: '정확한 주소를 입력해 주세요' }, { status: 400 });

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: ShopOrderItemInput[] = [];
  for (const raw of rawItems) {
    if (!raw.productId) continue;
    const product = getProduct(raw.productId);
    if (!product || product.user_id !== seller.id || product.status !== 'active') continue;
    items.push({
      productId: product.id,
      name:      product.name,
      price:     product.price, // 서버 가격 — 클라이언트 값 무시
      qty:       Math.max(1, Math.min(99, Math.round(raw.qty ?? 1))),
    });
  }
  if (items.length === 0) {
    return Response.json({ error: '주문 가능한 상품이 없습니다' }, { status: 400 });
  }

  const order = createShopOrder(seller.id, {
    name, phone, address, request: (buyer.request ?? '').trim(),
  }, items);
  return Response.json({ ok: true, orderId: order.id, total: order.total });
}
