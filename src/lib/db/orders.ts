import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/types/order';

export const DELIVERY_FEE = 3000;

const orders: Order[] = [];
let seeded = false;

function seedOrders() {
  if (seeded) return;
  seeded = true;
  const now = Date.now();
  const seed: Omit<Order, 'id'>[] = [
    {
      orderType: 'dine-in',
      tableNumber: 3,
      items: [
        { menuItemId: 'menu-001', name: '시그니처 와규 버거', price: 24000, quantity: 2 },
        { menuItemId: 'menu-005', name: '수제 콜라', price: 5000, quantity: 2 },
      ],
      status: 'preparing',
      totalAmount: 58000,
      paymentStatus: 'unpaid',
      createdAt: new Date(now - 12 * 60000).toISOString(),
      updatedAt: new Date(now - 10 * 60000).toISOString(),
    },
    {
      orderType: 'dine-in',
      tableNumber: 7,
      items: [
        { menuItemId: 'menu-006', name: '셰프 추천 세트 A', price: 35000, quantity: 1 },
      ],
      status: 'confirmed',
      totalAmount: 35000,
      paymentStatus: 'unpaid',
      createdAt: new Date(now - 5 * 60000).toISOString(),
      updatedAt: new Date(now - 5 * 60000).toISOString(),
    },
    {
      orderType: 'dine-in',
      tableNumber: 1,
      items: [
        { menuItemId: 'menu-002', name: '양념 치킨', price: 18000, quantity: 1 },
        { menuItemId: 'menu-003', name: '시저 샐러드', price: 12000, quantity: 1 },
      ],
      status: 'ready',
      totalAmount: 30000,
      paymentStatus: 'unpaid',
      createdAt: new Date(now - 20 * 60000).toISOString(),
      updatedAt: new Date(now - 3 * 60000).toISOString(),
    },
    {
      orderType: 'delivery',
      deliveryAddress: '서울시 마포구 와우산로 17길 5, 201호',
      items: [
        { menuItemId: 'menu-004', name: '티라미수', price: 9000, quantity: 2 },
        { menuItemId: 'menu-005', name: '수제 콜라', price: 5000, quantity: 1 },
      ],
      status: 'delivered',
      totalAmount: 26000,
      deliveryFee: DELIVERY_FEE,
      estimatedDeliveryMinutes: 30,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      createdAt: new Date(now - 45 * 60000).toISOString(),
      updatedAt: new Date(now - 30 * 60000).toISOString(),
    },
    {
      orderType: 'dine-in',
      tableNumber: 2,
      items: [
        { menuItemId: 'menu-001', name: '시그니처 와규 버거', price: 24000, quantity: 1 },
      ],
      status: 'pending',
      totalAmount: 24000,
      paymentStatus: 'unpaid',
      createdAt: new Date(now - 1 * 60000).toISOString(),
      updatedAt: new Date(now - 1 * 60000).toISOString(),
    },
    {
      orderType: 'delivery',
      deliveryAddress: '서울시 서대문구 신촌로 22, 301호',
      items: [
        { menuItemId: 'menu-001', name: '시그니처 와규 버거', price: 24000, quantity: 2 },
        { menuItemId: 'menu-003', name: '시저 샐러드', price: 12000, quantity: 1 },
      ],
      status: 'preparing',
      totalAmount: 63000,
      deliveryFee: DELIVERY_FEE,
      estimatedDeliveryMinutes: 35,
      paymentStatus: 'paid',
      paymentMethod: 'kakao',
      createdAt: new Date(now - 8 * 60000).toISOString(),
      updatedAt: new Date(now - 6 * 60000).toISOString(),
    },
  ];

  seed.forEach((data, i) => {
    orders.push({ ...data, id: `order-seed-${i + 1}` });
  });
}

export function getOrders(): Order[] {
  seedOrders();
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | undefined {
  seedOrders();
  return orders.find((o) => o.id === id);
}

export function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const now = new Date().toISOString();
  const order: Order = { ...data, id: `order-${Date.now()}`, createdAt: now, updatedAt: now };
  orders.push(order);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  seedOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function updateOrderPayment(
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: PaymentMethod
): Order | null {
  seedOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.paymentStatus = paymentStatus;
  if (paymentMethod) order.paymentMethod = paymentMethod;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function updateOrderRobot(id: string, robotId: string | undefined): Order | null {
  seedOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.robotId = robotId;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function getStats() {
  seedOrders();
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + o.totalAmount, 0);
  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  ).length;
  const totalOrders = orders.length;
  const popularItems = Object.entries(
    orders
      .flatMap((o) => o.items)
      .reduce<Record<string, { name: string; count: number }>>((acc, item) => {
        acc[item.menuItemId] = acc[item.menuItemId] ?? { name: item.name, count: 0 };
        acc[item.menuItemId].count += item.quantity;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([, v]) => v);

  return { todayRevenue, activeOrders, totalOrders, popularItems };
}
