export interface CandyProduct {
  id: string;
  name: string;
  nameEn: string;
  flavor: string;
  benefit: string;
  benefitTags: string[];
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  weight: string;
  image: string;
  color: string;
  bgColor: string;
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
    xylitol?: number;
  };
  category: 'immunity' | 'energy' | 'relaxation' | 'beauty';
}

export const CANDY_PRODUCTS: CandyProduct[] = [
  {
    id: 'vita-citrus',
    name: '비타 시트러스',
    nameEn: 'Vita Citrus',
    flavor: '레몬·오렌지',
    benefit: '면역력 강화',
    benefitTags: ['비타민C', '항산화', '면역'],
    description: '상큼한 시트러스 향과 함께 비타민C를 쏙 – 무설탕으로 건강하게.',
    longDescription: '국내산 레몬과 제주 한라봉에서 추출한 천연 시트러스 성분에 고농도 비타민C를 더했습니다. 자일리톨 100%로 단맛을 구현해 충치 걱정 없이 즐기는 건강한 캔디입니다. 운동 전후 또는 피로 회복이 필요할 때 드세요.',
    price: 8900,
    originalPrice: 11000,
    weight: '60g (30개입)',
    image: '🍋',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    badge: '베스트셀러',
    available: true,
    ingredients: ['자일리톨', '비타민C(아스코르브산)', '레몬농축액', '한라봉농축액', '구연산', '천연향료(레몬)', '스테비아잎추출물'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0,
      xylitol: 1.8,
    },
    category: 'immunity',
  },
  {
    id: 'calm-mint',
    name: '캄 민트',
    nameEn: 'Calm Mint',
    flavor: '페퍼민트·캐모마일',
    benefit: '스트레스 완화',
    benefitTags: ['진정', '수면', 'GABA'],
    description: '바쁜 하루 끝, 마음을 가라앉혀 주는 페퍼민트 무설탕 캔디.',
    longDescription: '독일산 캐모마일과 청정 페퍼민트 오일, 그리고 뇌 신경 안정에 도움을 주는 GABA 성분을 배합했습니다. 취침 전 1~2정씩 섭취하면 긴장 완화에 도움이 됩니다. 당류 0g, 자일리톨로 달콤하게 만든 기능성 수면 지원 캔디입니다.',
    price: 9900,
    weight: '54g (27개입)',
    image: '🌿',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    badge: '신제품',
    available: true,
    ingredients: ['자일리톨', 'GABA(감마아미노부티르산)', '캐모마일추출물', '페퍼민트오일', '스테비아잎추출물', '산화마그네슘', '천연향료'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0,
      xylitol: 1.8,
    },
    category: 'relaxation',
  },
  {
    id: 'energy-berry',
    name: '에너지 베리',
    nameEn: 'Energy Berry',
    flavor: '블루베리·아사이',
    benefit: '피로 회복·에너지',
    benefitTags: ['비타민B', '항산화', '에너지'],
    description: '블루베리와 아사이베리의 강력한 항산화력 – 활력이 필요한 순간.',
    longDescription: '아마존산 아사이베리와 국내산 블루베리에서 추출한 폴리페놀과 안토시아닌, 그리고 비타민B 복합체를 담았습니다. 피로 회복과 집중력 향상에 도움을 주는 기능성 성분으로 구성되어 있습니다. 무설탕이지만 베리 특유의 진한 단맛이 일품입니다.',
    price: 10500,
    originalPrice: 12000,
    weight: '56g (28개입)',
    image: '🫐',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50 border-violet-200',
    badge: '인기',
    available: true,
    ingredients: ['자일리톨', '아사이베리추출물', '블루베리농축액', '비타민B1(티아민질산염)', '비타민B2(리보플라빈)', '비타민B6(피리독신염산염)', '나이아신아마이드', '스테비아잎추출물', '천연향료(베리)'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 6,
      sugar: 0,
      carbs: 2,
      protein: 0,
      fat: 0,
      fiber: 0.2,
      xylitol: 1.6,
    },
    category: 'energy',
  },
  {
    id: 'glow-peach',
    name: '글로우 피치',
    nameEn: 'Glow Peach',
    flavor: '복숭아·콜라겐',
    benefit: '피부 탄력·미용',
    benefitTags: ['콜라겐', '히알루론산', '미용'],
    description: '달콤한 복숭아 향에 콜라겐을 담아 – 피부가 빛나는 무설탕 캔디.',
    longDescription: '해양 유래 저분자 콜라겐 펩타이드와 히알루론산을 핵심 성분으로, 피부 수분과 탄력 유지에 도움을 줍니다. 국내산 황도복숭아 농축액으로 천연 달콤함을 구현했으며 하루 3~5정 섭취를 권장합니다. 무설탕·무색소·무방부제로 자연 그대로의 미용 케어를 지원합니다.',
    price: 12900,
    weight: '50g (25개입)',
    image: '🍑',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    available: true,
    ingredients: ['자일리톨', '저분자콜라겐펩타이드(해양유래)', '히알루론산나트륨', '복숭아농축액', '비타민C(아스코르브산)', '스테비아잎추출물', '천연향료(복숭아)'],
    nutrition: {
      servingSize: '1정(2g)',
      calories: 5,
      sugar: 0,
      carbs: 1.8,
      protein: 0.2,
      fat: 0,
      fiber: 0,
      xylitol: 1.5,
    },
    category: 'beauty',
  },
];

export function getProduct(id: string): CandyProduct | undefined {
  return CANDY_PRODUCTS.find(p => p.id === id);
}

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  all:        { label: '전체',      icon: '✨', color: 'bg-gray-100 text-gray-700' },
  immunity:   { label: '면역',      icon: '🛡️',  color: 'bg-yellow-100 text-yellow-700' },
  energy:     { label: '에너지',    icon: '⚡',  color: 'bg-violet-100 text-violet-700' },
  relaxation: { label: '진정·수면', icon: '🌙', color: 'bg-emerald-100 text-emerald-700' },
  beauty:     { label: '미용·피부', icon: '✨', color: 'bg-orange-100 text-orange-700' },
};
