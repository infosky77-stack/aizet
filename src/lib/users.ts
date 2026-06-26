import db from './db';
import type { UserPlan } from '@/types/auth';
import type { SiteConfig } from './siteConfig';

export type { SiteConfig } from './siteConfig';
export { parseSiteConfig } from './siteConfig';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  picture: string;
  plan: UserPlan;
  industry: string;
  shop_name: string;
  phone: string;
  address: string;
  business_hours: string;
  slug: string | null;
  site_config: string;
  drive_folder_id: string | null;
  regen_count: number;
  created_at: number;
  updated_at: number;
}

export interface MenuItem {
  id: number;
  user_id: string;
  name: string;
  price: number;
  description: string;
  sort_order: number;
}

// Insert on first login; on subsequent logins update profile fields only.
// plan/industry are managed by the app and not overwritten here.
export function upsertUser(data: {
  id: string;
  email: string;
  name: string;
  picture: string;
  plan: UserPlan;
  industry: string;
}): UserRecord {
  const now = Date.now();
  db.prepare<{
    id: string; email: string; name: string; picture: string;
    plan: string; industry: string; now: number;
  }>(`
    INSERT INTO users (id, email, name, picture, plan, industry, created_at, updated_at)
    VALUES (@id, @email, @name, @picture, @plan, @industry, @now, @now)
    ON CONFLICT(id) DO UPDATE SET
      email      = excluded.email,
      name       = excluded.name,
      picture    = excluded.picture,
      updated_at = @now
  `).run({ ...data, now });

  return db.prepare<[string]>('SELECT * FROM users WHERE id = ?').get(data.id) as UserRecord;
}

export function getUser(id: string): UserRecord | null {
  return db.prepare<[string]>('SELECT * FROM users WHERE id = ?').get(id) as UserRecord | null;
}

export function getUserBySlug(slug: string): UserRecord | null {
  return db.prepare<[string]>('SELECT * FROM users WHERE slug = ?').get(slug) as UserRecord | null;
}

export interface ProfileUpdate {
  shop_name: string;
  phone: string;
  address: string;
  business_hours: string;
  slug: string;
}

export function updateProfile(id: string, data: ProfileUpdate): UserRecord {
  const now = Date.now();
  db.prepare<ProfileUpdate & { id: string; now: number }>(`
    UPDATE users SET
      shop_name      = @shop_name,
      phone          = @phone,
      address        = @address,
      business_hours = @business_hours,
      slug           = @slug,
      updated_at     = @now
    WHERE id = @id
  `).run({ ...data, id, now });
  return db.prepare<[string]>('SELECT * FROM users WHERE id = ?').get(id) as UserRecord;
}

export function getMenuItems(userId: string): MenuItem[] {
  return db.prepare<[string]>('SELECT * FROM menu_items WHERE user_id = ? ORDER BY sort_order, id').all(userId) as MenuItem[];
}

export function replaceMenuItems(userId: string, items: Array<{ name: string; price: number; description?: string }>): void {
  const deleteStmt = db.prepare<[string]>('DELETE FROM menu_items WHERE user_id = ?');
  const insertStmt = db.prepare<{ user_id: string; name: string; price: number; description: string; sort_order: number }>(
    'INSERT INTO menu_items (user_id, name, price, description, sort_order) VALUES (@user_id, @name, @price, @description, @sort_order)'
  );
  db.transaction(() => {
    deleteStmt.run(userId);
    items.forEach((item, i) => insertStmt.run({ user_id: userId, name: item.name, price: item.price, description: item.description ?? '', sort_order: i }));
  })();
}

export function getRegenCount(userId: string): number {
  const row = db.prepare<[string]>('SELECT regen_count FROM users WHERE id = ?').get(userId) as { regen_count: number } | null;
  return row?.regen_count ?? 0;
}

export function incrementRegenCount(userId: string): number {
  db.prepare<[string]>('UPDATE users SET regen_count = regen_count + 1 WHERE id = ?').run(userId);
  return getRegenCount(userId);
}

export function getSiteConfig(userId: string): SiteConfig {
  const row = db.prepare<[string]>('SELECT site_config FROM users WHERE id = ?').get(userId) as { site_config: string } | null;
  try { return row?.site_config ? JSON.parse(row.site_config) : {}; } catch { return {}; }
}

export function updateSiteConfig(userId: string, config: SiteConfig): void {
  const now = Date.now();
  db.prepare<{ config: string; id: string; now: number }>(
    'UPDATE users SET site_config = @config, updated_at = @now WHERE id = @id'
  ).run({ config: JSON.stringify(config), id: userId, now });
}

export function getDriveFolderId(userId: string): string | null {
  const row = db.prepare<[string]>('SELECT drive_folder_id FROM users WHERE id = ?').get(userId) as { drive_folder_id: string | null } | null;
  return row?.drive_folder_id ?? null;
}

export function updateDriveFolderId(userId: string, folderId: string): void {
  db.prepare<{ folderId: string; id: string }>(
    'UPDATE users SET drive_folder_id = @folderId WHERE id = @id'
  ).run({ folderId, id: userId });
}

/** slug 후보 생성: 영문·숫자만 남기고, 없으면 industry-{userId 앞 8자} */
export function generateSlug(shopName: string, industry: string, userId: string): string {
  const fromName = shopName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // 한글·특수문자 전부 하이픈 (URL-safe)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return fromName || `${industry || 'store'}-${userId.slice(0, 8)}`;
}
