import { MenuItem, MenuCategory } from '@/types/menu';

export type TemplateStyle = 'classic' | 'modern' | 'premium';

const CATEGORY_LABELS: Record<MenuCategory, string> = {
  appetizer: '전채 요리',
  main: '메인 요리',
  dessert: '디저트',
  beverage: '음료',
  set: '세트 메뉴',
};

export interface Template {
  name: string;
  desc: string;
  bg: string;
  headerBg: string;
  headerText: string;
  primary: string;
  secondary: string;
  accent: string;
  catLabel: string;
}

export const TEMPLATES: Record<TemplateStyle, Template> = {
  classic: {
    name: '클래식',
    desc: '따뜻하고 정감 있는 스타일',
    bg: '#FFF8EE',
    headerBg: '#3D2B1F',
    headerText: '#FFF8EE',
    primary: '#3D2B1F',
    secondary: '#8B6B55',
    accent: '#C87941',
    catLabel: '#C87941',
  },
  modern: {
    name: '모던',
    desc: '깔끔하고 세련된 스타일',
    bg: '#FFFFFF',
    headerBg: '#0F172A',
    headerText: '#FFFFFF',
    primary: '#0F172A',
    secondary: '#64748B',
    accent: '#2563EB',
    catLabel: '#2563EB',
  },
  premium: {
    name: '프리미엄',
    desc: '고급스럽고 우아한 스타일',
    bg: '#1C1C1E',
    headerBg: '#0A0A0A',
    headerText: '#FFFFFF',
    primary: '#F5F5F5',
    secondary: '#A0A0A0',
    accent: '#C0963C',
    catLabel: '#C0963C',
  },
};

export const TEMPLATE_STYLES: TemplateStyle[] = ['classic', 'modern', 'premium'];

const CAT_ORDER: MenuCategory[] = ['appetizer', 'main', 'dessert', 'beverage', 'set'];

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function generateMenuSVG(
  items: MenuItem[],
  restaurantName: string,
  style: TemplateStyle = 'classic',
  overrides?: Partial<Template>
): string {
  const t = { ...TEMPLATES[style], ...overrides };
  const W = 480;
  const H = 700;

  const available = items.filter(i => i.available);
  const groups = CAT_ORDER
    .map(cat => ({ cat, label: CATEGORY_LABELS[cat], items: available.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0);

  let y = 110;
  let content = '';

  for (const g of groups) {
    if (y > H - 80) break;

    // Category heading
    content += `<text x="30" y="${y}" fill="${t.catLabel}" font-family="Arial,sans-serif" font-size="10" font-weight="800" letter-spacing="3">${esc(g.label.toUpperCase())}</text>`;
    content += `<line x1="30" y1="${y + 5}" x2="${W - 30}" y2="${y + 5}" stroke="${t.accent}" stroke-width="0.8" opacity="0.5"/>`;
    y += 28;

    for (const item of g.items.slice(0, 4)) {
      if (y > H - 80) break;

      const isBest = item.tags.includes('popular') || item.tags.includes('best-value');
      const displayName = esc(trunc(item.nameKo || item.name, 16)) + (isBest ? ' ★' : '');
      const price = `${item.price.toLocaleString()}원`;

      // Item name
      content += `<text x="35" y="${y}" fill="${t.primary}" font-family="Arial,sans-serif" font-size="13" font-weight="600">${displayName}</text>`;
      // Price
      content += `<text x="${W - 35}" y="${y}" fill="${t.primary}" font-family="Arial,sans-serif" font-size="13" font-weight="700" text-anchor="end">${esc(price)}</text>`;
      // Dotted leader
      content += `<line x1="180" y1="${y - 3}" x2="${W - 35 - price.length * 7 - 8}" y2="${y - 3}" stroke="${t.secondary}" stroke-width="0.8" stroke-dasharray="2,4" opacity="0.35"/>`;

      if (item.description) {
        y += 16;
        content += `<text x="35" y="${y}" fill="${t.secondary}" font-family="Arial,sans-serif" font-size="9.5">${esc(trunc(item.description, 40))}</text>`;
      }
      y += 30;
    }
    y += 8;
  }

  const mid = W / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect width="${W}" height="90" fill="${t.headerBg}"/>
  <text x="${mid}" y="40" fill="${t.headerText}" font-family="Georgia,Times,serif" font-size="26" font-weight="bold" text-anchor="middle">${esc(restaurantName)}</text>
  <line x1="60" y1="54" x2="${W - 60}" y2="54" stroke="${t.accent}" stroke-width="1.2"/>
  <text x="${mid}" y="73" fill="${t.accent}" font-family="Arial,sans-serif" font-size="10" text-anchor="middle" letter-spacing="8">M E N U</text>
  ${content}
  <rect x="0" y="${H - 48}" width="${W}" height="48" fill="${t.headerBg}"/>
  <text x="${mid}" y="${H - 27}" fill="${t.headerText}" font-family="Arial,sans-serif" font-size="9.5" text-anchor="middle" opacity="0.65">가격에는 부가세가 포함되어 있으며, 메뉴는 예고 없이 변경될 수 있습니다</text>
  <text x="${mid}" y="${H - 10}" fill="${t.accent}" font-family="Arial,sans-serif" font-size="8" text-anchor="middle" opacity="0.8">Designed by AIZET Print</text>
</svg>`;
}
