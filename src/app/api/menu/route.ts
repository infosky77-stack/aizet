import { getMenuItems } from '@/lib/db/menu';

export async function GET() {
  const items = getMenuItems();
  return Response.json({ items });
}
