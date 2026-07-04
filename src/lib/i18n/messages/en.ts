// 영어 UI 사전 — 키 집합은 ko.ts가 단일 소스(누락 키는 t()가 폴백).
import type { MessageKey } from './ko';

export const en: Partial<Record<MessageKey, string>> = {
  'common.close':    'Close',
  'common.cancel':   'Cancel',
  'common.save':     'Save',
  'common.confirm':  'OK',
  'common.delete':   'Delete',
  'common.loading':  'Loading…',
  'common.language': 'Language',

  'shop.cart':            'Cart',
  'shop.buyNow':          'Buy Now',
  'shop.reviews':         'Reviews',
  'shop.cartEmpty':       'Your cart is empty.',
  'shop.orderPlaced':     'Your order has been placed',
  'shop.orderFailed':     'Failed to place your order. Please try again shortly.',
  'shop.shippingInfo':    'Shipping Information',
  'shop.buyerName':       'Recipient Name',
  'shop.buyerPhone':      'Phone Number',
  'shop.address':         'Shipping Address',
  'shop.requestOptional': 'Special Requests (optional)',
  'shop.detailPreparing': 'Detail images coming soon',
};
