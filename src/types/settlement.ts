export interface MethodBreakdown {
  card: number;
  cash: number;
  kakao: number;
  naver: number;
  unknown: number;
}

export interface DailySummary {
  date: string;
  totalOrders: number;
  paidCount: number;
  totalRevenue: number;
  byMethod: MethodBreakdown;
  cancelledCount: number;
  cancelledAmount: number;
  refundedCount: number;
  refundedAmount: number;
  netRevenue: number;
  unpaidCount: number;
  pendingCount: number;
  isClosed: boolean;
  closedAt?: string;
}
