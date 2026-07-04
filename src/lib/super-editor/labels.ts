import type { MediaOrderType } from '@/lib/db/media-orders';

export const ORDER_TYPE_LABELS: Record<MediaOrderType, string> = {
  video:    '영상',
  print:    '인쇄',
  catalog:  '도록',
  magazine: '잡지',
  product:  '제품상세',
  education: '한국어교육',
};

export function getOrderTypeLabel(type: string): string {
  return ORDER_TYPE_LABELS[type as MediaOrderType] ?? type;
}
