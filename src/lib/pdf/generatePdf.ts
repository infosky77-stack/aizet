import puppeteer from 'puppeteer';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';

const execFileAsync = promisify(execFile);

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    // 구글 폰트 CDN이 완전히 로드된 뒤 PDF 생성 — setContent의 waitUntil 타입에서
    // networkidle이 빠져(puppeteer 24) 별도 waitForNetworkIdle로 동일 효과를 낸다
    await page.setContent(html);
    await page.waitForNetworkIdle();
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function compressPdf(inputBuffer: Buffer): Promise<Buffer> {
  const ts     = Date.now();
  const inPath = `/tmp/pdf-in-${ts}.pdf`;
  const outPath= `/tmp/pdf-out-${ts}.pdf`;

  try {
    await writeFile(inPath, inputBuffer);

    await execFileAsync('/usr/bin/gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      `-sOutputFile=${outPath}`,
      inPath,
    ]);

    const compressed = await readFile(outPath);

    // 압축 결과가 오히려 더 크면 원본 반환
    if (compressed.byteLength >= inputBuffer.byteLength) {
      console.log(`[PDF] compress skipped: ${inputBuffer.byteLength}B → ${compressed.byteLength}B (원본 반환)`);
      return inputBuffer;
    }

    console.log(`[PDF] compress OK: ${inputBuffer.byteLength}B → ${compressed.byteLength}B (${Math.round((1 - compressed.byteLength / inputBuffer.byteLength) * 100)}% 감소)`);
    return compressed;
  } catch (err) {
    // gs 실패 시 원본 폴백 (기능 중단 방지)
    console.error('[PDF] compress failed, falling back to original:', err);
    return inputBuffer;
  } finally {
    // 임시파일 정리 (실패해도 무시)
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}
