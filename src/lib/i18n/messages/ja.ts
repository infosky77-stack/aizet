// 일본어 UI 사전 — 키 집합은 ko.ts가 단일 소스(누락 키는 t()가 폴백).
import type { MessageKey } from './ko';

export const ja: Partial<Record<MessageKey, string>> = {
  'common.close':    '閉じる',
  'common.cancel':   'キャンセル',
  'common.save':     '保存',
  'common.confirm':  '確認',
  'common.delete':   '削除',
  'common.loading':  '読み込み中…',
  'common.language': '言語',

  'shop.cart':            'カート',
  'shop.buyNow':          '今すぐ購入',
  'shop.reviews':         'レビュー',
  'shop.cartEmpty':       'カートは空です。',
  'shop.orderPlaced':     'ご注文を受け付けました',
  'shop.orderFailed':     'ご注文の受付に失敗しました。しばらくしてから再度お試しください。',
  'shop.shippingInfo':    '配送情報',
  'shop.buyerName':       'お受取人氏名',
  'shop.buyerPhone':      '電話番号',
  'shop.address':         '配送先住所',
  'shop.requestOptional': 'ご要望（任意）',
  'shop.detailPreparing': '詳細画像は準備中です',
};
