import { NextRequest, NextResponse } from 'next/server';

const AZOS_URL = process.env.AZOS_URL ?? 'http://localhost:8080';

export interface AzosTask {
  id: string;
  kind: string;
  status: 'pending' | 'assigned' | 'completed' | 'failed';
  payload: Record<string, unknown>;
  priority: number;
  created_at: string;
  assigned_at: string | null;
  finished_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${AZOS_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const task: AzosTask = await res.json();
  return NextResponse.json({ task }, { status: res.status });
}

export async function GET() {
  const res = await fetch(`${AZOS_URL}/tasks`);
  const data = await res.json();
  return NextResponse.json(data);
}
