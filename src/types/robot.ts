export type RobotStatus = 'idle' | 'dispatched' | 'delivering' | 'returning';

export interface Robot {
  id: string;
  name: string;
  status: RobotStatus;
  currentOrderId?: string;
  currentTable?: number;
  batteryLevel: number;
  updatedAt: string;
}
