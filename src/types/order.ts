export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid';
export type PaymentMethod = 'card' | 'cash' | 'kakao' | 'naver' | 'toss';
export type OrderType = 'dine-in' | 'delivery';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest?: string;
}

export interface Order {
  id: string;
  orderType: OrderType;
  tableNumber?: number;
  deliveryAddress?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryFee?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  robotId?: string;
  estimatedDeliveryMinutes?: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}
