import { NextRequest } from 'next/server';
import { recommendMenuItems } from '@/lib/ai/menu-recommender';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { preferences, allergies, budget } = body;

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
    // Fallback: return popular items without AI when no API key
    const { getMenuItems } = await import('@/lib/db/menu');
    const items = getMenuItems()
      .filter((i) => i.tags.includes('popular') && i.available)
      .slice(0, 3);
    return Response.json({ items, fallback: true });
  }

  const items = await recommendMenuItems({ preferences, allergies, budget });
  return Response.json({ items });
}
