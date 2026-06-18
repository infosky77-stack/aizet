import { getRobots } from '@/lib/db/robots';

export async function GET() {
  return Response.json({ robots: getRobots() });
}
