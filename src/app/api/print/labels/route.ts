import { NextRequest, NextResponse } from 'next/server';
import { getLabels, saveLabel } from '@/lib/db/print-files';
import { generateLabelSVG } from '@/lib/print/label-svg';
import { LabelData } from '@/types/print-files';

export async function GET() {
  return NextResponse.json({ labels: getLabels() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data: LabelData = body.data;

  if (!data?.productName || !data?.country) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const svgContent = generateLabelSVG(data);
  const label = saveLabel({
    clientId: body.clientId,
    product: body.product,
    data,
    svgContent,
  });
  return NextResponse.json({ label }, { status: 201 });
}
