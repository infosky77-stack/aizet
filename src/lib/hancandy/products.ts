export interface KeyIngredient {
  name: string;
  priority?: string;   // '1순위', '2순위' 등
  role: string;        // 짧은 역할 레이블
  desc: string;        // 상세 설명
}

export interface Scenario {
  situation: string;
  icon: string;
  detail: string;
}

export interface CandyProduct {
  id: string;
  number: 1 | 2 | 3;
  name: string;        // '1호 그린'
  nameEn: string;      // 'Aqua & Vitality'
  slogan: string;      // '수분과 활력의 오아시스'
  concept: string;     // '침샘/구강정화'
  flavor: string;      // 호환용 (구강/수분 등 간략 표기)
  benefit: string;
  benefitTags: string[];
  description: string;
  longDescription: string;
  keyIngredients: KeyIngredient[];
  scenarios: Scenario[];
  price: number;
  originalPrice?: number;
  weight: string;
  image: string;       // 이모지
  // 테마 색상 (Tailwind 클래스)
  themeKey: 'green' | 'blue' | 'yellow';
  color: string;       // text-*
  bgColor: string;     // bg-* border-*
  headerBg: string;    // 카드 상단 배경
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
    concept: '침샘·구강정화',
    flavor: '구강 수분·정화',
    benefit: '침샘 활성화 · 구강 촉촉함',
    benefitTags: ['구강수분', '침샘활성', '점막보호', '무자극'],
    description: '인공 산미 없이 점막을 보호하며 자연스럽게 촉촉함을 채웁니다. 중요한 순간 전 목소리를 맑게.',
    longDescription: '일반 캔디의 인공 산미가 오히려 침샘을 자극해 점막을 손상시키는 것과 달리, 1호 그린은 맥문동·금은화로 점막을 보호하며 자연스럽게 구강 내 수분을 보충합니다. 무설탕·무자극 설계로 발표·미팅 전 목소리를 가다듬을 때, 장거리 이동 중 입이 마를 때, 노화로 구강이 메말라 불편할 때 도움이 될 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        priority: '1순위',
        role: '수분 공급',
        desc: '동의보감에 기재된 대표적인 자음(滋陰) 약재. 구강 점막에 수분을 공급하고 촉촉한 상태를 유지하는 데 도움을 줄 수 있습니다.',
      },
      {
        name: '금은화',
        priority: '2순위',
        role: '천연방어막 · 염증정화',
        desc: '인동덩굴의 꽃봉오리로, 구강 내 미세한 자극과 염증을 정화하고 천연 방어막 형성에 도움을 줄 수 있습니다.',
      },
    ],
    scenarios: [
      { situation: '중요 미팅·발표 전', icon: '🎤', detail: '목소리를 맑게, 긴장으로 인한 구강 건조 완화' },
      { situation: '산책·조깅 중', icon: '🏃', detail: '가벼운 유산소 운동 시 입 안 쾌적함 유지' },
      { situation: '등산·러닝', icon: '🏔️', detail: '격한 호흡으로 건조해진 구강 수분 보충' },
      { situation: '장거리 운전', icon: '🚗', detail: '에어컨·난방으로 메말라지는 차 안 구강 관리' },
      { situation: '노화로 메마른 구강', icon: '💧', detail: '나이가 들수록 줄어드는 침 분비, 자연스러운 수분 보충' },
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
    ingredients: ['맥문동추출물', '금은화추출물', '자일리톨', '스테비아잎추출물', '천연향료'],
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
    concept: '위장·점막 보호',
    flavor: '보호·진정',
    benefit: '식물성 점막 보호막 · 속 진정',
    benefitTags: ['점막보호', '속진정', '뮤신코팅', '식후케어'],
    description: '식후 속을 지키는 식물성 점막 보호막. 맵고 기름진 음식 후, 빈속 커피 후 속이 불편할 때.',
    longDescription: '매운 음식, 기름진 식사, 빈속 커피 후 위장 점막이 노출될 때 2호 블루가 도움이 될 수 있습니다. 마(산약)와 유근피의 천연 뮤신 성분이 위장 점막 위에 보호막을 형성하고, 맥문동이 수분을 공급하며, 금은화가 자극을 진정시킵니다. 기상 직후 공복 상태, 복압이 상승하는 등산·러닝 중에도 활용할 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        role: '수분 공급',
        desc: '위장 점막에 수분을 공급하여 보호막 형성의 기반을 만듭니다.',
      },
      {
        name: '금은화',
        role: '진정·염증 정화',
        desc: '매운 음식·자극 물질로 인한 위장 점막의 미세 염증을 진정시키는 데 도움을 줄 수 있습니다.',
      },
      {
        name: '마(산약)',
        role: '천연 점성 코팅',
        desc: '마 특유의 점액 다당류가 위장 점막 표면에 달라붙어 보호막 역할을 합니다.',
      },
      {
        name: '유근피',
        role: '뮤신 코팅 형성',
        desc: '느릅나무 뿌리껍질의 천연 뮤신 성분이 점막 보호막을 강화합니다.',
      },
    ],
    scenarios: [
      { situation: '기상 직후 공복', icon: '🌅', detail: '아무것도 먹지 않은 빈 위장 점막 보호' },
      { situation: '매운 음식·기름진 식사 후', icon: '🌶️', detail: '자극적인 식사 후 위장 진정 및 보호' },
      { situation: '커피 후', icon: '☕', detail: '빈속 커피로 인한 위산 자극 완충' },
      { situation: '등산·러닝(복압 상승)', icon: '⛰️', detail: '격한 운동 시 복압 상승으로 인한 역류 예방 지원' },
      { situation: '장거리 운전·사무직', icon: '💼', detail: '장시간 앉아 있을 때 위장 점막 컨디션 유지' },
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
    ingredients: ['맥문동추출물', '금은화추출물', '산약(마)추출물', '유근피추출물', '자일리톨', '스테비아잎추출물', '천연향료'],
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
    concept: '순환·배출',
    flavor: '순환·소화',
    benefit: '소화 순환 · 가스 배출 · 복부 가벼움',
    benefitTags: ['소화촉진', '가스배출', '순환', '식후가벼움'],
    description: '꽉 막힌 답답함을 뚫어주는 시원한 순환 에너지. 기름진 식사 후, 더부룩할 때.',
    longDescription: '기름진 식사 후 더부룩함, 복부 팽만, 가스 불편감을 느낄 때 3호 옐로우가 도움이 될 수 있습니다. 나복자·진피가 뭉친 가스를 소통시키고, 산사자·생강이 소화 분해와 따뜻한 온기를 더합니다. 맥문동이 전체 기반을 잡고 금은화가 정화합니다. 장시간 앉아 있는 생활로 장운동이 줄어든 경우에도 활용할 수 있습니다.',
    keyIngredients: [
      {
        name: '맥문동',
        role: '소화 기반 조성',
        desc: '순환·배출 작용의 토대가 되는 수분과 음기(陰氣)를 공급합니다.',
      },
      {
        name: '금은화',
        role: '소화관 정화',
        desc: '소화관 내 불필요한 열감과 미세 염증을 식혀 정화합니다.',
      },
      {
        name: '나복자',
        role: '가스 소통·배출',
        desc: '무씨(나복자)의 행기(行氣) 작용으로 꽉 막힌 가스를 소통시키고 배출을 돕습니다.',
      },
      {
        name: '진피',
        role: '기(氣) 순환 촉진',
        desc: '말린 귤껍질(진피)이 소화관의 기 흐름을 원활하게 하여 답답함을 해소합니다.',
      },
      {
        name: '산사자',
        role: '지방·육류 분해',
        desc: '기름지고 단백질 많은 식사 후 소화 효소 분비를 촉진하여 분해를 돕습니다.',
      },
      {
        name: '생강',
        role: '온기·소화 촉진',
        desc: '따뜻한 성질로 위장에 온기를 더해 소화를 활성화하고 냉한 복부를 개선합니다.',
      },
    ],
    scenarios: [
      { situation: '기름진 식사 직후', icon: '🍖', detail: '고기·튀김·기름진 음식 후 소화 지원' },
      { situation: '복부 팽만·가스', icon: '🎈', detail: '더부룩하고 꽉 찬 느낌, 가스 불편감 완화' },
      { situation: '컨디션 난조', icon: '😮‍💨', detail: '몸이 무겁고 소화가 안 되는 날' },
      { situation: '장시간 앉아있는 생활', icon: '🪑', detail: '사무직·수험생 등 장운동 부족 시 순환 지원' },
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
    ingredients: ['맥문동추출물', '금은화추출물', '나복자추출물', '진피추출물', '산사자추출물', '생강추출물', '자일리톨', '스테비아잎추출물', '천연향료'],
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
