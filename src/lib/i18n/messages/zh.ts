// 중국어(간체) UI 사전 — 키 집합은 ko.ts가 단일 소스(누락 키는 t()가 폴백).
import type { MessageKey } from './ko';

export const zh: Partial<Record<MessageKey, string>> = {
  'common.close':    '关闭',
  'common.cancel':   '取消',
  'common.save':     '保存',
  'common.confirm':  '确认',
  'common.delete':   '删除',
  'common.loading':  '加载中…',
  'common.language': '语言',

  'shop.cart':            '购物车',
  'shop.buyNow':          '立即购买',
  'shop.reviews':         '商品评价',
  'shop.cartEmpty':       '购物车是空的。',
  'shop.orderPlaced':     '订单已提交',
  'shop.orderFailed':     '订单提交失败，请稍后重试。',
  'shop.shippingInfo':    '配送信息',
  'shop.buyerName':       '收件人姓名',
  'shop.buyerPhone':      '手机号码',
  'shop.address':         '配送地址',
  'shop.requestOptional': '备注（可选）',
  'shop.detailPreparing': '详情图片准备中',

  'learn.series':       '3分钟韩语',
  'learn.episodeLabel': '第{n}课',
  'learn.openEbook':    '在新窗口打开电子书',
  'learn.ebook':        '电子书',
  'learn.videoPending': '视频尚未准备好',
  'learn.aboutTitle':   '本课学习内容',
  'learn.cardsHint':    '点击卡片可放大查看',
  'learn.guideTitle':   '学习方法',
  'learn.guideStep1':   '边看视频边大声跟读',
  'learn.guideStep2':   '在新窗口打开电子书，与视频并排逐字复习',
  'learn.guideStep3':   '点击下方卡片放大记忆',
  'learn.backToLearn':  '返回学习页面',
};
