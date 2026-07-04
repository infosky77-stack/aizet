'use client';

// 상품 편집 페이지 — 얇은 래퍼(본체는 ProductEditForm).

import { useParams } from 'next/navigation';
import { ProductEditForm } from '@/components/shop/ProductEditForm';

export default function ProductEditPage() {
  const { productId } = useParams<{ productId: string }>();
  return <ProductEditForm productId={productId} />;
}
