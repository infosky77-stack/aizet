import { NextRequest, NextResponse } from 'next/server';
import { searchFiles, getClients } from '@/lib/db/print-files';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const country = searchParams.get('country') ?? undefined;

  if (!q && !country) {
    return NextResponse.json({ clients: getClients(), files: [] });
  }

  const results = searchFiles(q, country);
  return NextResponse.json(results);
}
