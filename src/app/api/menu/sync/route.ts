import { NextRequest, NextResponse } from 'next/server';
import { syncMenuItems } from '@/lib/db/menu';
import { MenuItem } from '@/types/menu';

const AZOS_URL = process.env.AZOS_URL ?? 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const { items, restaurantName, style } = await req.json() as {
    items: MenuItem[];
    restaurantName?: string;
    style?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 });
  }

  // Write to live store (in-memory — survives until next server restart)
  syncMenuItems(items);

  // Submit deploy-homepage task to AZOS
  let azosTaskId: string | null = null;
  try {
    const taskRes = await fetch(`${AZOS_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'deploy-homepage',
        payload: {
          source: 'super-editor',
          restaurantName,
          style,
          itemCount: items.length,
          syncedAt: new Date().toISOString(),
        },
        priority: 180,
      }),
    });
    const taskData = await taskRes.json();
    azosTaskId = taskData.id ?? null;
  } catch {
    // AZOS 전송 실패는 메뉴 동기화와 무관하게 진행
  }

  return NextResponse.json({
    synced: items.length,
    azosTaskId,
    syncedAt: new Date().toISOString(),
  });
}
