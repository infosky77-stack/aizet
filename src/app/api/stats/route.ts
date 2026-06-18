import { getStats } from '@/lib/db/orders';

export async function GET() {
  return Response.json(getStats());
}
