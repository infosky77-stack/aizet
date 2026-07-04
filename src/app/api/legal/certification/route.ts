import { NextRequest } from 'next/server';
import { htmlToPdf, compressPdf } from '@/lib/pdf/generatePdf';
import { generateCertificationLetter, CertificationLetterData } from '@/lib/legal/templates/certificationLetter';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderName, senderAddress, recipientName, recipientAddress, subject, content, date } = body;

    if (!senderName || !recipientName || !subject || !content) {
      return Response.json({ error: '필수 항목을 입력해 주세요.' }, { status: 400 });
    }

    const data: CertificationLetterData = {
      senderName,
      senderAddress:    senderAddress    || '',
      recipientName,
      recipientAddress: recipientAddress || '',
      subject,
      content,
      date: date || new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    };

    const html        = generateCertificationLetter(data);
    const rawPdf      = await htmlToPdf(html);
    console.log(`[PDF] puppeteer: ${rawPdf.byteLength}B`);
    const pdf         = await compressPdf(rawPdf);
    console.log(`[PDF] final:     ${pdf.byteLength}B`);

    const safeDate   = (data.date).replace(/[^가-힣0-9]/g, '');
    const rawName    = `내용증명_${data.senderName}_${safeDate}.pdf`;
    const filename   = encodeURIComponent(rawName);

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Content-Length':      String(pdf.byteLength),
      },
    });
  } catch (err) {
    console.error('[PDF] certification error:', err);
    return Response.json({ error: 'PDF 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
