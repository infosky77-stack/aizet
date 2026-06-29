import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/types/order';

export const DELIVERY_FEE = 3000;

const orders: Order[] = [];

// key: 'YYYY-MM-DD'
const closedDates = new Map<string, { closedAt: string }>();

export function getOrders(): Order[] {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | undefined {

  return orders.find((o) => o.id === id);
}

export function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const now = new Date().toISOString();
  const order: Order = { ...data, id: `order-${Date.now()}`, createdAt: now, updatedAt: now };
  orders.push(order);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {

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

  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.paymentStatus = paymentStatus;
  if (paymentMethod) order.paymentMethod = paymentMethod;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function updateOrderRobot(id: string, robotId: string | undefined): Order | null {

  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.robotId = robotId;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function refundOrder(
  id: string,
  refundType: 'full' | 'partial',
  refundAmount: number,
  refundReason: string
): Order | null {

  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  const now = new Date().toISOString();
  order.status = refundType === 'full' ? 'refunded' : 'partially_refunded';
  order.refundAmount = refundAmount;
  order.refundReason = refundReason;
  order.refundedAt = now;
  order.updatedAt = now;
  return order;
}

export function getOrdersByDate(date: string): Order[] {

  return orders.filter((o) => o.createdAt.slice(0, 10) === date);
}

export function getClosedDate(date: string): { closedAt: string } | undefined {
  return closedDates.get(date);
}

export function closeDate(date: string): { closedAt: string } {
  const record = { closedAt: new Date().toISOString() };
  closedDates.set(date, record);
  return record;
}

export function getStats() {

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
