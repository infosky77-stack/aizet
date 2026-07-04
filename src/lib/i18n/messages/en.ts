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

  'learn.series':       '3-Minute Korean',
  'learn.episodeLabel': 'Episode {n}',
  'learn.openEbook':    'Open e-book in new window',
  'learn.ebook':        'E-book',
  'learn.videoPending': 'The video is not ready yet',
  'learn.aboutTitle':   'What you learn in this episode',
  'learn.cardsHint':    'Tap a card to see it up close',
  'learn.guideTitle':   'How to study',
  'learn.guideStep1':   'Watch the video and repeat out loud',
  'learn.guideStep2':   'Open the e-book in a new window next to the video and review each letter',
  'learn.guideStep3':   'Tap the cards below to study them up close',
  'learn.backToLearn':  'Back to the lesson',
};
