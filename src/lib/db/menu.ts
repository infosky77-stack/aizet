import { MenuItem } from '@/types/menu';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-001',
    name: 'Signature Wagyu Burger',
    nameKo: '시그니처 와규 버거',
    description: '와규 패티, 트러플 마요네즈, 카라멜라이즈드 어니언',
    price: 24000,
    category: 'main',
    tags: ['popular', 'signature'],
    allergens: ['gluten', 'dairy', 'egg'],
    available: true,
    calories: 720,
  },
  {
    id: 'menu-002',
    name: 'Spicy Korean Fried Chicken',
    nameKo: '양념 치킨',
    description: '바삭한 치킨, 매콤달콤 양념 소스',
    price: 18000,
    category: 'main',
    tags: ['spicy', 'popular'],
    allergens: ['gluten'],
    available: true,
    calories: 580,
  },
  {
    id: 'menu-003',
    name: 'Caesar Salad',
    nameKo: '시저 샐러드',
    description: '로메인 상추, 파르메산, 크루통, 시저 드레싱',
    price: 12000,
    category: 'appetizer',
    tags: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'egg', 'fish'],
    available: true,
    calories: 320,
  },
  {
    id: 'menu-004',
    name: 'Tiramisu',
    nameKo: '티라미수',
    description: '에스프레소 레이어드 이탈리안 디저트',
    price: 9000,
    category: 'dessert',
    tags: ['popular'],
    allergens: ['gluten', 'dairy', 'egg'],
    available: true,
    calories: 280,
  },
  {
    id: 'menu-005',
    name: 'Craft Cola',
    nameKo: '수제 콜라',
    description: '당일 제조 수제 콜라',
    price: 5000,
    category: 'beverage',
    tags: [],
    allergens: [],
    available: true,
    calories: 120,
  },
  {
    id: 'menu-006',
    name: 'Chef\'s Set A',
    nameKo: '셰프 추천 세트 A',
    description: '시그니처 와규 버거 + 시저 샐러드 + 음료',
    price: 35000,
    category: 'set',
    tags: ['popular', 'best-value'],
    allergens: ['gluten', 'dairy', 'egg'],
    available: true,
  },
];

export function getMenuItems(): MenuItem[] {
  return MENU_ITEMS;
}

export function getMenuItemById(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function getMenuByCategory(category: string): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.category === category && item.available);
}
