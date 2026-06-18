export type DriveStorageTier = 'basic' | 'premium';
export type UserPlan = 'free' | 'pro' | 'business';
export type StorageDestination = 'local' | 'drive-basic' | 'drive-premium';

export interface DriveState {
  connected: boolean;
  email: string;
  tier: DriveStorageTier;
  usedBytes: number;
  totalBytes: number;
  connectedAt: string;
}

const STORAGE_BYTES: Record<DriveStorageTier, number> = {
  basic: 15 * 1024 * 1024 * 1024,
  premium: 2 * 1024 * 1024 * 1024 * 1024,
};

const DRIVE_KEY = 'aizet_gdrive';
const PLAN_KEY = 'aizet_user_plan';

export function getDriveState(): DriveState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRIVE_KEY);
    return raw ? (JSON.parse(raw) as DriveState) : null;
  } catch {
    return null;
  }
}

export function connectDrive(email: string, tier: DriveStorageTier): DriveState {
  const existing = getDriveState();
  const state: DriveState = {
    connected: true,
    email,
    tier,
    usedBytes: existing?.usedBytes ?? Math.floor(Math.random() * 2 * 1024 * 1024 * 1024),
    totalBytes: STORAGE_BYTES[tier],
    connectedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRIVE_KEY, JSON.stringify(state));
  return state;
}

export function disconnectDrive(): void {
  localStorage.removeItem(DRIVE_KEY);
}

export function upgradeToPremium(): DriveState | null {
  const state = getDriveState();
  if (!state) return null;
  const updated: DriveState = {
    ...state,
    tier: 'premium',
    totalBytes: STORAGE_BYTES.premium,
  };
  localStorage.setItem(DRIVE_KEY, JSON.stringify(updated));
  return updated;
}

export function addUsedBytes(bytes: number): void {
  const state = getDriveState();
  if (!state) return;
  const updated = { ...state, usedBytes: Math.min(state.usedBytes + bytes, state.totalBytes) };
  localStorage.setItem(DRIVE_KEY, JSON.stringify(updated));
}

export function getUserPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  return (localStorage.getItem(PLAN_KEY) as UserPlan) ?? 'free';
}

export function setUserPlan(plan: UserPlan): void {
  localStorage.setItem(PLAN_KEY, plan);
}

export function isPremiumPlan(): boolean {
  const plan = getUserPlan();
  return plan === 'pro' || plan === 'business';
}

export function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024 / 1024).toFixed(1)} TB`;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function getStorageLabel(dest: StorageDestination): string {
  if (dest === 'local') return 'AIZET 서버';
  if (dest === 'drive-basic') return '구글 드라이브 (15 GB)';
  return 'Google One 프리미엄 (2 TB)';
}
