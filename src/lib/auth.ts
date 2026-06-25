import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import db from './db';
import type { SessionData, UserPlan } from '@/types/auth';

export const COOKIE_NAME = 'aizet_session';
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_TTL_MS = COOKIE_MAX_AGE * 1000;

type SessionRow = {
  id: string; sub: string; email: string; name: string; picture: string;
  accessToken: string; refreshToken: string | null; expiresAt: number;
  plan: string; industry: string; createdAt: number;
};

function rowToSession(row: SessionRow): SessionData {
  return {
    id: row.id, sub: row.sub, email: row.email, name: row.name,
    picture: row.picture, accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? undefined,
    expiresAt: row.expiresAt, plan: row.plan as UserPlan,
    industry: row.industry, createdAt: row.createdAt,
  };
}

export function createSession(data: Omit<SessionData, 'id' | 'createdAt'>): string {
  const id = randomUUID();
  const createdAt = Date.now();
  db.prepare<SessionRow>(`
    INSERT INTO sessions (id, sub, email, name, picture, accessToken, refreshToken, expiresAt, plan, industry, createdAt)
    VALUES (@id, @sub, @email, @name, @picture, @accessToken, @refreshToken, @expiresAt, @plan, @industry, @createdAt)
  `).run({ ...data, id, createdAt, refreshToken: data.refreshToken ?? null });
  return id;
}

export function getSession(id: string): SessionData | null {
  const row = db.prepare<[string], SessionRow>('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!row) return null;
  if (Date.now() - row.createdAt > SESSION_TTL_MS) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return null;
  }
  return rowToSession(row);
}

export function updateSession(id: string, patch: Partial<Pick<SessionData, 'plan' | 'industry' | 'accessToken' | 'expiresAt'>>): void {
  const fields = Object.keys(patch).map(k => `${k} = @${k}`).join(', ');
  if (!fields) return;
  db.prepare(`UPDATE sessions SET ${fields} WHERE id = @id`).run({ ...patch, id });
}

export function deleteSession(id: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function getSessionFromRequest(req: NextRequest): SessionData | null {
  const id = req.cookies.get(COOKIE_NAME)?.value;
  return id ? getSession(id) : null;
}

// Re-export type so callers don't need to import from two places
export type { SessionData, UserPlan };
