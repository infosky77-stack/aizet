import db from './db';
import type { UserPlan } from '@/types/auth';

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
  created_at: number;
  updated_at: number;
}

export interface MenuItem {
  id: number;
  user_id: string;
  name: string;
  price: number;
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

export function replaceMenuItems(userId: string, items: Array<{ name: string; price: number }>): void {
  const deleteStmt = db.prepare<[string]>('DELETE FROM menu_items WHERE user_id = ?');
  const insertStmt = db.prepare<{ user_id: string; name: string; price: number; sort_order: number }>(
    'INSERT INTO menu_items (user_id, name, price, sort_order) VALUES (@user_id, @name, @price, @sort_order)'
  );
  db.transaction(() => {
    deleteStmt.run(userId);
    items.forEach((item, i) => insertStmt.run({ user_id: userId, name: item.name, price: item.price, sort_order: i }));
  })();
}

/** slug 후보 생성: shop_name 영문/숫자만 남기고, 없으면 industry-{userId 앞 8자} */
export function generateSlug(shopName: string, industry: string, userId: string): string {
  const fromName = shopName
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return fromName || `${industry}-${userId.slice(0, 8)}`;
}
