export type MenuCategory =
  | 'appetizer'
  | 'main'
  | 'dessert'
  | 'beverage'
  | 'set';

export interface MenuItem {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  price: number;
  category: MenuCategory;
  tags: string[];        // e.g. ['spicy', 'vegetarian', 'popular']
  allergens: string[];   // e.g. ['gluten', 'dairy']
  imageUrl?: string;
  available: boolean;
  calories?: number;
}
