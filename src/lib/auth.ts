import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import type { SessionData, UserPlan } from '@/types/auth';

// In-memory session store (resets on restart; replace with Redis/DB in production)
const store = new Map<string, SessionData>();

export const COOKIE_NAME = 'aizet_session';
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_TTL_MS = COOKIE_MAX_AGE * 1000;

export function createSession(data: Omit<SessionData, 'id' | 'createdAt'>): string {
  const id = randomUUID();
  store.set(id, { ...data, id, createdAt: Date.now() });
  return id;
}

export function getSession(id: string): SessionData | null {
  const s = store.get(id);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) { store.delete(id); return null; }
  return s;
}

export function updateSession(id: string, patch: Partial<Pick<SessionData, 'plan' | 'industry' | 'accessToken'>>): void {
  const s = store.get(id);
  if (s) store.set(id, { ...s, ...patch });
}

export function deleteSession(id: string): void {
  store.delete(id);
}

export function getSessionFromRequest(req: NextRequest): SessionData | null {
  const id = req.cookies.get(COOKIE_NAME)?.value;
  return id ? getSession(id) : null;
}

// Re-export type so callers don't need to import from two places
export type { SessionData, UserPlan };
