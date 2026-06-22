export type UserPlan = 'free' | 'pro' | 'business';

export interface SessionData {
  id: string;
  sub: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  plan: UserPlan;
  industry: string;
  createdAt: number;
}

export interface PublicSession {
  sub: string;
  email: string;
  name: string;
  picture: string;
  plan: UserPlan;
  industry: string;
  driveConnected: boolean;
}
