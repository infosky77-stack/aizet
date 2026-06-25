import { getMenuItems } from '@/lib/db/menu';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = getMenuItems();
  return Response.json({ items });
}
