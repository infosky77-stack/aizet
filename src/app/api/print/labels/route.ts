import { NextRequest, NextResponse } from 'next/server';
import { getLabels, saveLabel, getClient, getFilesByClient, addClientFile } from '@/lib/db/print-files';
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

  const svgContent: string = body.svgContent ?? generateLabelSVG(data);
  const label = saveLabel({
    clientId: body.clientId,
    product: body.product,
    data,
    svgContent,
  });

  // 거래처 ID와 제품명이 있으면 ClientFile로도 저장 → /print/files에 표시
  let clientFile = null;
  if (body.clientId && body.product) {
    const client = getClient(body.clientId);
    if (client) {
      const existing = getFilesByClient(body.clientId).filter(f => f.product === body.product);
      const nextVersion = existing.length > 0 ? Math.max(...existing.map(f => f.version)) + 1 : 1;
      const filename = `label-${data.productName}-${data.country}-v${nextVersion}.svg`;
      clientFile = addClientFile({
        clientId: body.clientId,
        product: body.product,
        filename,
        fileType: '.svg',
        version: nextVersion,
        isLatest: true,
        sizeBytes: svgContent.length,
        tags: ['수출라벨', data.country],
      });
    }
  }

  return NextResponse.json({ label, clientFile }, { status: 201 });
}
