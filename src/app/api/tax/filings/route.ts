import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listFilings, createFiling, FilingType } from '@/lib/db/tax-filings';

const VALID_TYPES: FilingType[] = ['vat', 'income', 'corp', 'withholding'];

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get('year')  ? Number(searchParams.get('year'))  : undefined;
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
  const filings = listFilings(userId, year, month);
  return Response.json({ filings });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const body    = await req.json();

  const { client_id, type, year, month, due_date, memo = '' } = body;
  if (!client_id) return Response.json({ error: '거래처를 선택해주세요.' }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return Response.json({ error: '신고 종류가 올바르지 않습니다.' }, { status: 400 });
  if (!year || !month) return Response.json({ error: '연도·월을 입력해주세요.' }, { status: 400 });
  if (!due_date) return Response.json({ error: '기한일을 입력해주세요.' }, { status: 400 });

  const filing = createFiling(userId, {
    client_id,
    type: type as FilingType,
    year:  Number(year),
    month: Number(month),
    due_date,
    memo: String(memo).trim(),
  });
  return Response.json({ filing }, { status: 201 });
}
