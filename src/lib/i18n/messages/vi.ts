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

  'learn.series':       'Tiếng Hàn 3 phút',
  'learn.episodeLabel': 'Bài {n}',
  'learn.openEbook':    'Mở sách điện tử trong cửa sổ mới',
  'learn.ebook':        'Sách điện tử',
  'learn.videoPending': 'Video chưa sẵn sàng',
  'learn.aboutTitle':   'Nội dung bài học này',
  'learn.cardsHint':    'Chạm vào thẻ để xem phóng to',
  'learn.guideTitle':   'Cách học',
  'learn.guideStep1':   'Xem video và đọc to theo',
  'learn.guideStep2':   'Mở sách điện tử trong cửa sổ mới, đặt cạnh video và ôn từng chữ cái',
  'learn.guideStep3':   'Chạm vào các thẻ bên dưới để xem phóng to và ghi nhớ',
  'learn.backToLearn':  'Về trang bài học',
};
