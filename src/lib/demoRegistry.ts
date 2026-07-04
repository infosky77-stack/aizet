/**
 * 고정 데모 레지스트리
 *
 * 새 데모(법무사, 드론 등)를 추가할 때 이 배열에 항목 하나만 추가하면
 * 슈퍼관리자 화면에 자동으로 카드가 나타난다.
 *
 * adminPath 필드:
 *   - 전용 관리자 페이지가 있으면 해당 경로 (예: '/admin/tax')
 *   - 공용 관리자 페이지를 쓰면 그 경로 (예: '/admin/reservations')
 *   - 관리자 화면이 전혀 없으면 null → 카드에 "관리자 미구현" 표시
 *
 * adminKind:
 *   'dedicated' — 이 데모 전용 관리자 페이지
 *   'shared'    — 다른 데모와 공유하는 공용 관리자 페이지
 *   null        — 관리자 화면 없음 (공개 페이지로만 이동)
 */

export type AdminKind = 'dedicated' | 'shared' | null;

export interface DemoEntry {
  /** 라우트 슬러그 및 고유 키 */
  slug: string;
  /** 화면에 표시할 이름 */
  name: string;
  /** lucide 아이콘 이름 (슈퍼관리자 페이지에서 직접 import) */
  icon: string;
  /** 카드 배경·텍스트 색상 (tailwind 클래스) */
  color: string;
  /** 공개 데모 경로 */
  publicPath: string;
  /** 관리자 경로 (없으면 null) */
  adminPath: string | null;
  /** 관리자 종류 */
  adminKind: AdminKind;
}

export const DEMO_REGISTRY: DemoEntry[] = [
  {
    slug:      'tax',
    name:      '세무사',
    icon:      'Scale',
    color:     'bg-blue-100 text-blue-700',
    publicPath: '/tax',
    adminPath:  '/admin/tax',
    adminKind:  'dedicated',
  },
  {
    slug:      'clinic',
    name:      '한의원',
    icon:      'HeartPulse',
    color:     'bg-red-100 text-red-700',
    publicPath: '/clinic',
    adminPath:  '/admin/reservations',
    adminKind:  'shared',
  },
  {
    slug:      'salon',
    name:      '헤어샵',
    icon:      'Scissors',
    color:     'bg-pink-100 text-pink-700',
    publicPath: '/salon',
    adminPath:  '/admin/reservations',
    adminKind:  'shared',
  },
  {
    slug:      'fitness',
    name:      '필라테스',
    icon:      'Dumbbell',
    color:     'bg-violet-100 text-violet-700',
    publicPath: '/fitness',
    adminPath:  '/admin/reservations',
    adminKind:  'shared',
  },
  {
    slug:      'pension',
    name:      '펜션',
    icon:      'Home',
    color:     'bg-teal-100 text-teal-700',
    publicPath: '/pension',
    adminPath:  '/admin/reservations',
    adminKind:  'shared',
  },
  {
    slug:      'fashion',
    name:      '패션',
    icon:      'ShoppingBag',
    color:     'bg-orange-100 text-orange-700',
    publicPath: '/fashion',
    adminPath:  null,
    adminKind:  null,
  },
  {
    slug:      'demo',
    name:      '중화가정',
    icon:      'UtensilsCrossed',
    color:     'bg-amber-100 text-amber-700',
    publicPath: '/demo',
    adminPath:  '/admin/orders',
    adminKind:  'shared',
  },
  {
    slug:      'hancandy',
    name:      '한캔디',
    icon:      'Leaf',
    color:     'bg-green-100 text-green-700',
    publicPath: '/hancandy',
    adminPath:  '/admin/hancandy',
    adminKind:  'dedicated',
  },
  {
    slug:      'print',
    name:      '풀린키',
    icon:      'Printer',
    color:     'bg-indigo-100 text-indigo-700',
    publicPath: '/print',
    adminPath:  '/admin/print',
    adminKind:  'dedicated',
  },
  {
    slug:      'legal',
    name:      '법무사',
    icon:      'Landmark',
    color:     'bg-cyan-100 text-cyan-700',
    publicPath: '/legal',
    adminPath:  '/admin/legal',
    adminKind:  'dedicated',
  },
  {
    slug:      'catalog',
    name:      '도록·작품집',
    icon:      'BookOpen',
    color:     'bg-stone-100 text-stone-700',
    publicPath: '/catalog',
    adminPath:  '/admin/super-editor',
    adminKind:  'shared',
  },
  {
    slug:      'seokmodo',
    name:      '석모도 국제 재생의학·웰니스 허브',
    icon:      'Sparkles',
    color:     'bg-fuchsia-100 text-fuchsia-700',
    publicPath: '/seokmodo.html',
    adminPath:  null,
    adminKind:  null,
  },
];
