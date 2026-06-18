import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/db/print-files';

export async function GET() {
  return NextResponse.json({ clients: getClients() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.company || !body.country || !body.countryCode) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }
  const client = createClient({
    company: body.company,
    country: body.country,
    countryCode: body.countryCode,
    contactName: body.contactName,
    contactEmail: body.contactEmail,
  });
  return NextResponse.json({ client }, { status: 201 });
}
