// 판매자 상품 단건 API — 조회/수정/삭제. 소유자 검증은 db 계층의 user_id 조건이 담당.

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getProduct, updateProduct, deleteProduct } from '@/lib/db/products';
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/lib/shop/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product || product.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({ product });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.status !== undefined && !(body.status in PRODUCT_STATUS_LABELS)) {
    return Response.json({ error: 'invalid status' }, { status: 400 });
  }
  const patch = {
    name: body.name, description: body.description,
    price: body.price, original_price: body.original_price,
    category: body.category, status: body.status as ProductStatus | undefined,
    thumbnail_ref: body.thumbnail_ref, sort_order: body.sort_order,
  };
  const product = updateProduct(productId, session.sub, patch);
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ product });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await params;
  const ok = deleteProduct(productId, session.sub);
  return ok ? Response.json({ ok: true }) : Response.json({ error: 'Not found' }, { status: 404 });
}
