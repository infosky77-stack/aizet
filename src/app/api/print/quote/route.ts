import { NextRequest, NextResponse } from 'next/server';
import { calculateQuote } from '@/lib/db/print';
import { QuoteOptions } from '@/types/print';

export async function POST(req: NextRequest) {
  const opts = await req.json() as QuoteOptions;
  const price = calculateQuote(opts);
  return NextResponse.json({ price });
}
