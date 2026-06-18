import { PrintProduct, PrintOrder, PrintOrderStatus, QuoteOptions, PrintCategory } from '@/types/print';

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'bc-standard',
    category: 'business-card',
    name: '명함 (스탠다드)',
    description: '90×50mm 아트지 기본 명함. 선명한 컬러 인쇄.',
    basePrice: 22000,
    baseQuantity: 100,
    sizes: ['90×50mm', '86×54mm (신용카드형)'],
    popular: true,
    turnaround: '2–3일',
  },
  {
    id: 'bc-premium',
    category: 'business-card',
    name: '명함 (프리미엄)',
    description: '두꺼운 아트지 + UV 코팅으로 고급스러운 질감.',
    basePrice: 38000,
    baseQuantity: 100,
    sizes: ['90×50mm', '86×54mm (신용카드형)'],
    turnaround: '3–4일',
  },
  {
    id: 'flyer-a4',
    category: 'flyer',
    name: '전단 A4',
    description: '가장 일반적인 크기. 매장 홍보·이벤트 안내에 최적.',
    basePrice: 45000,
    baseQuantity: 500,
    sizes: ['A4 (210×297mm)', 'A5 (148×210mm)', 'A6 (105×148mm)'],
    popular: true,
    turnaround: '1–2일',
  },
  {
    id: 'flyer-dl',
    category: 'flyer',
    name: '전단 DL',
    description: '슬림한 3단 접지 전단. 팜플렛·메뉴판 용도.',
    basePrice: 55000,
    baseQuantity: 500,
    sizes: ['DL (99×210mm)', '3단 A4'],
    turnaround: '2–3일',
  },
  {
    id: 'booklet-saddle',
    category: 'booklet',
    name: '소책자 (중철)',
    description: '스테이플 제본. 카탈로그·매뉴얼·사보에 적합.',
    basePrice: 180000,
    baseQuantity: 100,
    sizes: ['A4 (210×297mm)', 'A5 (148×210mm)'],
    popular: true,
    turnaround: '3–5일',
  },
  {
    id: 'booklet-perfect',
    category: 'booklet',
    name: '소책자 (무선)',
    description: '풀 제본. 두꺼운 책자·보고서·포트폴리오.',
    basePrice: 250000,
    baseQuantity: 100,
    sizes: ['A4 (210×297mm)', 'A5 (148×210mm)', 'B5'],
    turnaround: '4–6일',
  },
  {
    id: 'banner-indoor',
    category: 'banner',
    name: '배너 (실내)',
    description: '가벼운 실내용. 행사·전시·매장 사인에 최적.',
    basePrice: 18000,
    baseQuantity: 1,
    sizes: ['60×160cm', '90×200cm', '100×200cm'],
    popular: true,
    turnaround: '1–2일',
  },
  {
    id: 'banner-outdoor',
    category: 'banner',
    name: '배너 (야외)',
    description: '방수·내구성 강화. 현수막·야외 광고용.',
    basePrice: 25000,
    baseQuantity: 1,
    sizes: ['60×160cm', '90×200cm', '100×200cm', '맞춤 제작'],
    turnaround: '2–3일',
  },
  {
    id: 'sticker-cut',
    category: 'sticker',
    name: '스티커 (컷팅)',
    description: '원하는 모양으로 재단. 브랜드 로고·포장 봉인용.',
    basePrice: 35000,
    baseQuantity: 100,
    sizes: ['A4 낱장', '원형 50mm', '사각형 50×50mm', '맞춤'],
    popular: true,
    turnaround: '2–3일',
  },
  {
    id: 'sticker-roll',
    category: 'sticker',
    name: '스티커 (롤)',
    description: '연속 롤 공급. 식품·제품 라벨링에 최적.',
    basePrice: 55000,
    baseQuantity: 500,
    sizes: ['30×30mm', '50×30mm', '70×40mm', '맞춤'],
    turnaround: '3–4일',
  },
  {
    id: 'pkg-box',
    category: 'package',
    name: '포장 박스',
    description: '브랜드 로고 인쇄 패키지 박스. 선물·제품 포장.',
    basePrice: 280000,
    baseQuantity: 50,
    sizes: ['소 (150×100×50mm)', '중 (200×150×80mm)', '대 (300×200×100mm)', '맞춤'],
    popular: true,
    turnaround: '5–7일',
  },
  {
    id: 'pkg-bag',
    category: 'package',
    name: '쇼핑백',
    description: '유광·무광 코팅 고급 쇼핑백. 브랜드 각인 가능.',
    basePrice: 220000,
    baseQuantity: 50,
    sizes: ['소 (160×60×200mm)', '중 (240×90×260mm)', '대 (320×100×330mm)'],
    turnaround: '5–7일',
  },
];

export const PAPER_OPTIONS = {
  art: { label: '아트지', description: '선명한 컬러, 광택감', multiplier: 1.0 },
  mojo: { label: '모조지', description: '무광, 자연스러운 느낌', multiplier: 0.9 },
  snow: { label: '스노우지', description: '부드러운 질감, 반무광', multiplier: 1.1 },
  kraft: { label: '크라프트지', description: '친환경, 자연 갈색', multiplier: 1.15 },
  'thick-art': { label: '두꺼운 아트지 (300g)', description: '고급 명함·카드용', multiplier: 1.3 },
};

export const COATING_OPTIONS = {
  none: { label: '코팅 없음', multiplier: 1.0 },
  gloss: { label: '유광 코팅', multiplier: 1.1 },
  matte: { label: '무광 코팅', multiplier: 1.1 },
  uv: { label: 'UV 스팟 코팅', multiplier: 1.25 },
  double: { label: '양면 코팅', multiplier: 1.2 },
};

export const BINDING_OPTIONS = {
  none: { label: '제본 없음', adder: 0 },
  saddle: { label: '중철 제본', adder: 5000 },
  perfect: { label: '무선 제본', adder: 12000 },
};

export const QUANTITY_BREAKS: Record<number, number> = {
  100: 1.0,
  200: 0.88,
  500: 0.72,
  1000: 0.58,
  2000: 0.47,
  5000: 0.36,
};

export function calculateQuote(opts: QuoteOptions): number {
  const product = PRINT_PRODUCTS.find(
    (p) => p.category === opts.category && p.sizes.includes(opts.size)
  ) ?? PRINT_PRODUCTS.find((p) => p.category === opts.category)!;

  const unitBase = (product.basePrice / product.baseQuantity) * opts.quantity;
  const quantityMultiplier = QUANTITY_BREAKS[opts.quantity] ?? 1.0;
  const paperMultiplier = PAPER_OPTIONS[opts.paper]?.multiplier ?? 1.0;
  const coatingMultiplier = COATING_OPTIONS[opts.coating]?.multiplier ?? 1.0;
  const sideMultiplier = opts.sides === 'double' ? 1.6 : 1.0;
  const bindingAdder = BINDING_OPTIONS[opts.binding]?.adder ?? 0;

  const subtotal = unitBase * quantityMultiplier * paperMultiplier * coatingMultiplier * sideMultiplier;
  return Math.round((subtotal + bindingAdder) / 100) * 100;
}

const DEMO_ORDERS: PrintOrder[] = [
  {
    id: 'PO-2026-001',
    customerName: '김민준',
    customerPhone: '010-1234-5678',
    category: 'business-card',
    productName: '명함 (프리미엄)',
    options: { category: 'business-card', size: '90×50mm', paper: 'thick-art', quantity: 500, binding: 'none', coating: 'uv', sides: 'double' },
    totalPrice: 92000,
    status: 'printing',
    fileUploaded: true,
    memo: '로고 좌측 상단 배치, 글씨 포인트 컬러 #1E40AF',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    estimatedDays: 3,
  },
  {
    id: 'PO-2026-002',
    customerName: '이서연',
    customerPhone: '010-9876-5432',
    category: 'flyer',
    productName: '전단 A4',
    options: { category: 'flyer', size: 'A4 (210×297mm)', paper: 'art', quantity: 1000, binding: 'none', coating: 'gloss', sides: 'single' },
    totalPrice: 58000,
    status: 'finishing',
    fileUploaded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    estimatedDays: 2,
  },
  {
    id: 'PO-2026-003',
    customerName: '박지훈',
    customerPhone: '010-5555-7777',
    category: 'booklet',
    productName: '소책자 (중철)',
    options: { category: 'booklet', size: 'A4 (210×297mm)', paper: 'art', quantity: 200, binding: 'saddle', coating: 'matte', sides: 'double' },
    totalPrice: 245000,
    status: 'inspection',
    fileUploaded: true,
    memo: '16p 구성, 표지 별도 후가공',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    estimatedDays: 5,
  },
  {
    id: 'PO-2026-004',
    customerName: '최수아',
    customerPhone: '010-2222-3333',
    category: 'banner',
    productName: '배너 (실내)',
    options: { category: 'banner', size: '60×160cm', paper: 'art', quantity: 3, binding: 'none', coating: 'none', sides: 'single' },
    totalPrice: 54000,
    status: 'shipping',
    fileUploaded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    estimatedDays: 1,
  },
  {
    id: 'PO-2026-005',
    customerName: '정다은',
    customerPhone: '010-8888-1111',
    category: 'sticker',
    productName: '스티커 (컷팅)',
    options: { category: 'sticker', size: '원형 50mm', paper: 'art', quantity: 500, binding: 'none', coating: 'gloss', sides: 'single' },
    totalPrice: 82000,
    status: 'received',
    fileUploaded: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    estimatedDays: 3,
  },
  {
    id: 'PO-2026-006',
    customerName: '강현우',
    customerPhone: '010-4444-6666',
    category: 'package',
    productName: '포장 박스',
    options: { category: 'package', size: '중 (200×150×80mm)', paper: 'art', quantity: 100, binding: 'none', coating: 'matte', sides: 'single' },
    totalPrice: 385000,
    status: 'delivered',
    fileUploaded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    estimatedDays: 7,
  },
];

let orders: PrintOrder[] = [...DEMO_ORDERS];

export function getPrintOrders(): PrintOrder[] {
  return [...orders];
}

export function getPrintOrder(id: string): PrintOrder | undefined {
  return orders.find((o) => o.id === id);
}

export function createPrintOrder(data: Omit<PrintOrder, 'id' | 'createdAt' | 'updatedAt'>): PrintOrder {
  const order: PrintOrder = {
    ...data,
    id: `PO-2026-${String(orders.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders = [...orders, order];
  return order;
}

export function updatePrintOrderStatus(id: string, status: PrintOrderStatus): PrintOrder | undefined {
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders = orders.map((o) =>
    o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
  );
  return orders[idx];
}

export function getPrintProducts(category?: PrintCategory): PrintProduct[] {
  if (!category) return PRINT_PRODUCTS;
  return PRINT_PRODUCTS.filter((p) => p.category === category);
}
