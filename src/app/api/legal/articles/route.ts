import { NextRequest } from 'next/server';
import { htmlToPdf, compressPdf } from '@/lib/pdf/generatePdf';
import { generateArticlesOfIncorporation, ArticlesOfIncorporationData } from '@/lib/legal/templates/articlesOfIncorporation';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, address, purposes, capital, parValue, totalShares, authorizedShares, ceoName, incorporationDate } = body;

    if (!companyName || !address || !purposes || !capital || !parValue || !totalShares || !ceoName || !incorporationDate) {
      return Response.json({ error: '필수 항목을 입력해 주세요.' }, { status: 400 });
    }

    const data: ArticlesOfIncorporationData = {
      companyName,
      address,
      purposes,
      capital,
      parValue,
      totalShares,
      authorizedShares: authorizedShares || '',
      ceoName,
      incorporationDate,
    };

    const html   = generateArticlesOfIncorporation(data);
    const rawPdf = await htmlToPdf(html);
    console.log(`[PDF] articles puppeteer: ${rawPdf.byteLength}B`);
    const pdf    = await compressPdf(rawPdf);
    console.log(`[PDF] articles final:     ${pdf.byteLength}B`);

    const safeName = companyName.replace(/[^가-힣a-zA-Z0-9]/g, '');
    const rawName  = `정관_${safeName}.pdf`;
    const filename = encodeURIComponent(rawName);

    return new Response(pdf, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Content-Length':      String(pdf.byteLength),
      },
    });
  } catch (err) {
    console.error('[PDF] articles error:', err);
    return Response.json({ error: 'PDF 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
