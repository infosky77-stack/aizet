// 사이트 UI 문자열 사전 — 한국어 원문이자 키의 단일 소스.
//
// 키 추가/삭제는 이 파일에서만 한다. 다른 언어 사전은 이 키 집합의 Partial이며,
// 누락 키는 t()가 en → ko 순으로 폴백한다(messages/index.ts). 회원이 쓴 콘텐츠
// (상품 설명 등)는 여기 두지 않는다 — 그건 섹션 스냅샷의 i18n 필드(2단계) 몫이다.
// 키는 '영역.이름' 평면 규칙: common(공통 버튼/상태), shop(쇼핑몰 구매자 화면).

export const ko = {
  // ── 공통 ──────────────────────────────────────────────────────────────
  'common.close':    '닫기',
  'common.cancel':   '취소',
  'common.save':     '저장',
  'common.confirm':  '확인',
  'common.delete':   '삭제',
  'common.loading':  '불러오는 중…',
  'common.language': '언어',

  // ── 쇼핑몰 구매자 화면 ────────────────────────────────────────────────
  'shop.cart':            '장바구니',
  'shop.buyNow':          '바로구매',
  'shop.reviews':         '상품평',
  'shop.cartEmpty':       '장바구니가 비어 있습니다.',
  'shop.orderPlaced':     '주문이 접수되었습니다',
  'shop.orderFailed':     '주문 접수에 실패했습니다. 잠시 후 다시 시도해주세요.',
  'shop.shippingInfo':    '배송 정보',
  'shop.buyerName':       '받는 분 이름',
  'shop.buyerPhone':      '휴대폰 번호',
  'shop.address':         '배송 주소',
  'shop.requestOptional': '요청사항 (선택)',
  'shop.detailPreparing': '상세 이미지가 준비 중입니다',

  // ── 학습 화면(공개) ───────────────────────────────────────────────────
  'learn.series':       '3분 한국어',
  'learn.episodeLabel': '제{n}편',
  'learn.openEbook':    '이북 새창으로 보기',
  'learn.ebook':        '이북',
  'learn.videoPending': '영상이 아직 준비되지 않았습니다',
  'learn.aboutTitle':   '이번 편에서 배우기',
  'learn.cardsHint':    '카드를 누르면 크게 볼 수 있어요',
  'learn.guideTitle':   '이렇게 공부하세요',
  'learn.guideStep1':   '영상을 보며 소리 내어 따라 읽어요',
  'learn.guideStep2':   '이북을 새창에 띄워 영상과 나란히 놓고 한 글자씩 복습해요',
  'learn.guideStep3':   '아래 카드를 눌러 크게 보며 눈에 익혀요',
  'learn.backToLearn':  '학습 화면으로',
} as const;

export type MessageKey = keyof typeof ko;
