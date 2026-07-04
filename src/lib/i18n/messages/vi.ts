// 베트남어 UI 사전 — 키 집합은 ko.ts가 단일 소스(누락 키는 t()가 폴백).
import type { MessageKey } from './ko';

export const vi: Partial<Record<MessageKey, string>> = {
  'common.close':    'Đóng',
  'common.cancel':   'Hủy',
  'common.save':     'Lưu',
  'common.confirm':  'Xác nhận',
  'common.delete':   'Xóa',
  'common.loading':  'Đang tải…',
  'common.language': 'Ngôn ngữ',

  'shop.cart':            'Giỏ hàng',
  'shop.buyNow':          'Mua ngay',
  'shop.reviews':         'Đánh giá',
  'shop.cartEmpty':       'Giỏ hàng trống.',
  'shop.orderPlaced':     'Đơn hàng đã được tiếp nhận',
  'shop.orderFailed':     'Đặt hàng thất bại. Vui lòng thử lại sau.',
  'shop.shippingInfo':    'Thông tin giao hàng',
  'shop.buyerName':       'Tên người nhận',
  'shop.buyerPhone':      'Số điện thoại',
  'shop.address':         'Địa chỉ giao hàng',
  'shop.requestOptional': 'Yêu cầu (tùy chọn)',
  'shop.detailPreparing': 'Ảnh chi tiết đang được chuẩn bị',
};
