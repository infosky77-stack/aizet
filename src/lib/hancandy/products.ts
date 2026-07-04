export interface KeyIngredient {
  name: string;
  nameDetail?: string;  // '麥門冬 · Lilyturf' 등 한자/영문 표기
  priority?: string;    // '1순위', '2순위' 등
  role: string;         // 짧은 역할 레이블
  desc: string;         // 상세 설명
  image?: string;       // '/hancandy/maekmundong_lilyturf.jpg'
}

export interface Scenario {
  situation: string;
  icon: string;
  detail: string;
  image?: string;       // '/hancandy/2ho_scenario_morning.jpg'
}

export interface CandyProduct {
  id: string;
  number: 1 | 2 | 3;
  name: string;         // '1호 그린'
  nameEn: string;       // 'Aqua & Vitality'
  slogan: string;       // '수분과 활력의 오아시스'
  headerQuote?: string; // 브랜드 카피 인용구
  concept: string;      // '침샘/구강정화'
  flavor: string;       // 호환용
  benefit: string;
  benefitTags: string[];
  description: string;
  longDescription: string;
  keyIngredients: KeyIngredient[];
  characteristics?: { label: string; desc: string }[];
  scenarios: Scenario[];
  price: number;
  originalPrice?: number;
  weight: string;
  image: string;        // 이모지 (레거시)
  themeKey: 'green' | 'blue' | 'yellow';
  color: string;
  bgColor: string;
  headerBg: string;
  badge?: string;
  available: boolean;
  ingredients: string[];
  nutrition: {
    servingSize: string;
    calories: number;
    sugar: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
  };
  category: 'oral' | 'protect' | 'digest';
}

export const CANDY_PRODUCTS: CandyProduct[] = [
  {
    id: 'no1-green',
    number: 1,
    name: '1호 그린',
    nameEn: 'Aqua & Vitality',
    slogan: '수분과 활력의 오아시스',
    headerQuote: '마르지 않는 샘물처럼, 당신의 일상에 수분을 채웁니다.',
    concept: '침샘·구강정화',
    flavor: '구강 수분·정화',
    benefit: '침샘 활성화 · 구강 촉촉함',
    benefitTags: ['구강수분', '침샘활성', '점막보호', '무자극'],
    description: '인공 산미 없이 점막을 보호하며 자연스럽게 촉촉함을 채웁니다. 중요한 순간 전 목소리를 맑게.',
    longDescription: '일반 캔디의 인공 산미가 오히려 침샘을 자극해 점막을 손상시키는 것과 달리, 1호 그린은 맥문동·금은화로 점막을 보호하며 자연스럽게 구강 내 수분을 보충합니다. 무설탕·무자극 설계로 발표·미팅 전 목소리를 가다듬을 때, 장거리 이동 중 입이 마를 때, 노화로 구강이 메말라 불편할 때 도움이 될 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        nameDetail: '麥門冬 · Lilyturf',
        priority: '1순위',
        role: '진액의 중심',
        desc: '마른 입안에 진액을 생성해 구강 건조를 근본적으로 해결하는 핵심 엔진',
        image: '/hancandy/maekmundong_lilyturf.jpg',
      },
      {
        name: '금은화',
        nameDetail: '金銀花 · Honeysuckle',
        role: '천연 방어막',
        desc: '입안 염증을 다스리고 텁텁함을 정화, 인공 보존제 없이도 안정성 유지',
        image: '/hancandy/geumeunhwa_honeysuckle.jpg',
      },
      {
        name: '스테비아',
        role: '천연 감미 · 설탕 제로',
        desc: '칼로리·당 걱정 없는 깨끗한 단맛, 혈당 부담 없는 천연 감미료',
        image: '/hancandy/stevia.jpg',
      },
      {
        name: '나한과',
        role: '천연 감미 · 설탕 제로',
        desc: '스테비아와 함께 깨끗하고 자연스러운 단맛을 완성하는 무칼로리 과일 추출 감미료',
        image: '/hancandy/nahangwa_monkfruit.jpg',
      },
      {
        name: '오미자',
        nameDetail: '五味子 · Schisandra',
        role: '침샘 자극 및 활력',
        desc: '침샘을 자극해 진액을 생성하고 신진대사를 지원',
        image: '/hancandy/omija_schisandra.jpg',
      },
    ],
    characteristics: [
      { label: '무자극 설계', desc: '예민한 점막·치아 자극 없음' },
      { label: '자생적 촉촉함', desc: '원물 천연 성질로 스스로 진액 생성' },
    ],
    scenarios: [
      { situation: '장거리 운전·야간 주행', icon: '🚗', detail: '건조한 차내 공기에 입안이 텁텁할 때' },
      { situation: '노화로 메말라가는 입안', icon: '💧', detail: '치아와 점막 자극 없는 안심 케어' },
      { situation: '중요 미팅·발표 전', icon: '🎤', detail: '긴장으로 입이 타들어 가 목소리가 갈라질 때' },
      { situation: '산책·조깅', icon: '🏃', detail: '거친 숨소리에 목이 마르고 칼칼해질 때' },
      { situation: '러닝·등산', icon: '🏔️', detail: '갈증이 한계에 다다르는 순간' },
    ],
    price: 9900,
    weight: '50g (25개입)',
    image: '🍃',
    themeKey: 'green',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    headerBg: 'bg-gradient-to-br from-green-100 to-emerald-50',
    badge: '구강수분',
    available: true,
    ingredients: ['맥문동추출물', '금은화추출물', '자일리톨', '스테비아잎추출물', '나한과추출물', '오미자추출물', '천연향료'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0,
    },
    category: 'oral',
  },
  {
    id: 'no2-blue',
    number: 2,
    name: '2호 블루',
    nameEn: 'Protect & Calm',
    slogan: '보호와 진정의 쉼표',
    headerQuote: '지친 속을 부드럽게 감싸는 식물성 점막 보호막.',
    concept: '위장·점막 보호',
    flavor: '보호·진정',
    benefit: '식물성 점막 보호막 · 속 진정',
    benefitTags: ['점막보호', '속진정', '뮤신코팅', '식후케어'],
    description: '식후 속을 지키는 식물성 점막 보호막. 맵고 기름진 음식 후, 빈속 커피 후 속이 불편할 때.',
    longDescription: '식후 30분, 당신의 속을 지키는 가장 세련된 습관. 매운 음식, 기름진 식사, 빈속 커피 후 위장 점막이 노출될 때 2호 블루가 도움이 될 수 있습니다. 산약(마)과 유근피의 천연 뮤신 성분이 위장 점막 위에 보호막을 형성하고, 맥문동이 수분을 공급합니다. 기상 직후 공복 상태, 복압이 상승하는 등산·러닝 중에도 활용할 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        nameDetail: '麥門冬 · Lilyturf',
        priority: '1순위',
        role: '점막 수분 베이스',
        desc: '점막을 촉촉하게 적셔주는 1순위 베이스',
        image: '/hancandy/maekmundong_lilyturf.jpg',
      },
      {
        name: '산약+유근피',
        nameDetail: '山藥 · Yam',
        role: '천연 점성 코팅',
        desc: '통로 벽면에 층층이 머무는 물리적 보호막(뮤신 코팅) 형성, 위벽 보호 및 진정',
        image: '/hancandy/sanyak_yam.jpg',
      },
      {
        name: '스테비아',
        role: '천연 단맛',
        desc: '무설탕, 칼로리 걱정 없는 천연 감미',
        image: '/hancandy/stevia.jpg',
      },
      {
        name: '나한과',
        role: '천연 감미 · 무설탕',
        desc: '스테비아와 함께 깨끗하고 자연스러운 단맛을 완성',
        image: '/hancandy/nahangwa_monkfruit.jpg',
      },
    ],
    characteristics: [
      { label: '무자극 설계', desc: '예민해진 점막·치아·속을 모두 배려' },
    ],
    scenarios: [
      {
        situation: '아침 기상 직후',
        icon: '🌅',
        detail: '밤새 비어있던 속이 예민해진 아침, 물 한 잔보다 먼저 한캔디 2호를 머금으세요',
        image: '/hancandy/2ho_scenario_morning.jpg',
      },
      {
        situation: '식사 후 보호',
        icon: '🍽️',
        detail: '자극적인 매운 음식, 기름진 식사, 커피 후 치밀어 오르는 기운을 미리 방어',
        image: '/hancandy/2ho_scenario_meal.jpg',
      },
      {
        situation: '활동 중 복압 관리',
        icon: '🏃',
        detail: '등산/러닝 중 복압 상승, 장거리 운전·사무직 중 고정된 자세로 배가 눌릴 때',
        image: '/hancandy/2ho_scenario_activity.jpg',
      },
    ],
    price: 10900,
    weight: '50g (25개입)',
    image: '🫐',
    themeKey: 'blue',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    headerBg: 'bg-gradient-to-br from-blue-100 to-sky-50',
    badge: '점막보호',
    available: true,
    ingredients: ['맥문동추출물', '산약(마)추출물', '유근피추출물', '자일리톨', '스테비아잎추출물', '나한과추출물', '천연향료'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0,
    },
    category: 'protect',
  },
  {
    id: 'no3-yellow',
    number: 3,
    name: '3호 옐로우',
    nameEn: 'Empty & Light',
    slogan: '비움과 소화의 마침표',
    headerQuote: '꽉 막힌 답답함을 뚫어주는 시원한 자연의 에너지.',
    concept: '순환·배출',
    flavor: '순환·소화',
    benefit: '소화 순환 · 가스 배출 · 복부 가벼움',
    benefitTags: ['소화촉진', '가스배출', '순환', '식후가벼움'],
    description: '꽉 막힌 답답함을 뚫어주는 시원한 순환 에너지. 기름진 식사 후, 더부룩할 때.',
    longDescription: '기름진 식사 후 더부룩함, 복부 팽만, 가스 불편감을 느낄 때 3호 옐로우가 도움이 될 수 있습니다. 나복자·진피가 뭉친 가스를 소통시키고, 산사·생강이 소화 분해와 따뜻한 온기를 더합니다. 맥문동이 전체 기반을 잡아 부드럽게 작용합니다. 장시간 앉아 있는 생활로 장운동이 줄어든 경우에도 활용할 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        nameDetail: '麥門冬 · Lilyturf',
        role: '소화 기반 조성',
        desc: '정체된 속을 부드럽게 적셔주는 기본 토대',
        image: '/hancandy/maekmundong_lilyturf.jpg',
      },
      {
        name: '금은화',
        nameDetail: '金銀花 · Honeysuckle',
        role: '소화관 정화',
        desc: '속의 불쾌한 기운을 정화',
        image: '/hancandy/geumeunhwa_honeysuckle.jpg',
      },
      {
        name: '산사',
        nameDetail: '山査 · Hawthorn',
        role: '천연 분해 · 소화 촉진',
        desc: '기름진 음식물을 분해하고 소화 효소를 활성화',
        image: '/hancandy/sansa_hawthorn.jpg',
      },
      {
        name: '생강',
        nameDetail: '生薑 · Ginger',
        role: '온기 · 소화 활성',
        desc: '위장을 따뜻하게 하여 소화 효소를 활성화하고 냉한 복부를 개선',
        image: '/hancandy/saenggang_ginger.jpg',
      },
      {
        name: '나복자',
        nameDetail: '萊菔子 · Radish Seed',
        role: '소화 촉진 · 팽만감 해소',
        desc: '막힌 기운을 내리고 음식물 소화를 도움',
        image: '/hancandy/nabokja_radishseed.jpg',
      },
      {
        name: '진피',
        nameDetail: '陳皮 · Tangerine Peel',
        role: '복부 팽만감 해소',
        desc: '막힌 기운을 소통시켜 식후 답답함을 풀어줌',
        image: '/hancandy/jinpi_tangerinepeel.jpg',
      },
    ],
    scenarios: [
      {
        situation: '육류·기름진 식사 직후',
        icon: '🍖',
        detail: '무거운 음식의 분해와 배출을 돕는 천연 소화 엔진. 산사자와 나복자의 힘으로 시원하게 뚫어버리세요',
        image: '/hancandy/3ho_scenario_meat.jpg',
      },
      {
        situation: '아침 불편함·정체감',
        icon: '😮‍💨',
        detail: '아침에 눈 떴을 때의 불편함, 식사 후 찾아오는 묵직한 정체감',
      },
      {
        situation: '복부 팽만·가스 정체',
        icon: '🎈',
        detail: '배 속이 팽팽하게 부풀어 올라 불쾌할 때',
      },
      {
        situation: '장시간 앉아있는 생활',
        icon: '🪑',
        detail: '운전석이나 사무실, 움직임 부족해 속이 정체될 때',
      },
    ],
    price: 11900,
    weight: '50g (25개입)',
    image: '🌿',
    themeKey: 'yellow',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    headerBg: 'bg-gradient-to-br from-amber-100 to-yellow-50',
    badge: '소화순환',
    available: true,
    ingredients: ['맥문동추출물', '금은화추출물', '산사추출물', '생강추출물', '나복자추출물', '진피추출물', '자일리톨', '스테비아잎추출물', '나한과추출물', '천연향료'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0,
    },
    category: 'digest',
  },
];

/** 캔디별 대표 이미지(public 자산) — 홈/챗의 "담기"가 장바구니 썸네일로 쓴다 */
export const CANDY_THUMBNAILS: Record<string, string> = {
  'no1-green':  '/hancandy/maekmundong_lilyturf.jpg',
  'no2-blue':   '/hancandy/2ho_scenario_morning.jpg',
  'no3-yellow': '/hancandy/3ho_scenario_meat.jpg',
};

/**
 * 범용 장바구니(store/shopCart) 항목으로 변환.
 * productId 규칙 `hancandy-{candy.id}`는 seed(scripts/seed-hancandy.ts)가 만든
 * products.id와 일치해야 주문 API의 서버 검증을 통과한다 — 한쪽만 바꾸지 말 것.
 */
export function candyToCartItem(p: CandyProduct) {
  return {
    productId:     `hancandy-${p.id}`,
    name:          p.name,
    price:         p.price,
    thumbnailPath: CANDY_THUMBNAILS[p.id] ?? null,
  };
}

export function getProduct(id: string): CandyProduct | undefined {
  return CANDY_PRODUCTS.find(p => p.id === id);
}

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  all:     { label: '전체',       icon: '🌿', color: 'bg-gray-100 text-gray-700' },
  oral:    { label: '구강·수분',  icon: '💧', color: 'bg-green-100 text-green-700' },
  protect: { label: '보호·진정',  icon: '🛡️', color: 'bg-blue-100 text-blue-700' },
  digest:  { label: '순환·배출',  icon: '✨', color: 'bg-amber-100 text-amber-700' },
};

// 테마별 Tailwind 색상 매핑
export const THEME_COLORS = {
  green: {
    bg: 'bg-green-600',
    bgLight: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    textDark: 'text-green-800',
    ring: 'ring-green-400',
    badge: 'bg-green-100 text-green-700',
    button: 'bg-green-600 hover:bg-green-700',
    gradient: 'from-green-500 to-emerald-600',
    gradientLight: 'from-green-50 to-emerald-50',
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    textDark: 'text-blue-800',
    ring: 'ring-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    gradient: 'from-blue-500 to-sky-600',
    gradientLight: 'from-blue-50 to-sky-50',
  },
  yellow: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    textDark: 'text-amber-800',
    ring: 'ring-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600',
    gradient: 'from-amber-400 to-yellow-500',
    gradientLight: 'from-amber-50 to-yellow-50',
  },
} as const;
