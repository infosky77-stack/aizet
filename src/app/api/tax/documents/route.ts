import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { gemini } from '@/lib/ai/gemini';
import { listDocuments, createDocument, purgeExpiredDocuments } from '@/lib/db/tax-documents';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder, ensureSubfolder } from '@/lib/drive-folder';
import { uploadDocumentToDrive } from '@/lib/drive-upload';

export const dynamic    = 'force-dynamic';
export const runtime    = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
]);

const AI_PROMPT = `이 이미지는 한국 세무 관련 문서(영수증 또는 세금계산서)입니다.
아래 JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 출력.
{
  "date": "YYYY-MM-DD (날짜 없으면 null)",
  "amount": 정수 (원화 합계금액, 없으면 null),
  "vendor": "공급자 또는 상호명 (없으면 빈 문자열)",
  "category": "식비|교통비|숙박비|사무용품|통신비|광고비|임차료|공과금|세금|기타"
}`;

function parseAI(text: string): { date: string | null; amount: number | null; vendor: string; category: string } {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no json');
    const p = JSON.parse(m[0]);
    return {
      date:     typeof p.date   === 'string' ? p.date   : null,
      amount:   typeof p.amount === 'number' ? Math.round(p.amount) : null,
      vendor:   typeof p.vendor === 'string' ? p.vendor : '',
      category: typeof p.category === 'string' ? p.category : '기타',
    };
  } catch {
    return { date: null, amount: null, vendor: '', category: '기타' };
  }
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const { searchParams } = new URL(req.url);

  // 30일 경과 소프트 삭제 문서 자동 영구 삭제
  purgeExpiredDocuments(userId);

  const includeDeleted = searchParams.get('deleted') === '1';
  const clientId   = searchParams.get('client_id') || undefined;
  const category   = searchParams.get('category')  || undefined;
  const confirmedQ = searchParams.get('confirmed');
  const confirmed  = confirmedQ === '1' ? true : confirmedQ === '0' ? false : undefined;

  const documents = listDocuments(userId, { includeDeleted, clientId, category, confirmed });
  return Response.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';

  const formData = await req.formData();
  const file      = formData.get('file')      as File | null;
  const clientId  = formData.get('client_id') as string | null;

  if (!file)     return Response.json({ error: '파일을 선택해주세요.' },     { status: 400 });
  if (!clientId) return Response.json({ error: '거래처를 선택해주세요.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: '이미지(JPG·PNG·WebP·GIF) 또는 PDF만 업로드 가능합니다.' }, { status: 400 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeFilename = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;

  // ① 로컬 저장
  const saveDir  = path.join(process.cwd(), 'data', 'tax-docs', userId, clientId);
  if (!existsSync(saveDir)) await mkdir(saveDir, { recursive: true });
  const localPath = path.join('data', 'tax-docs', userId, clientId, safeFilename);
  await writeFile(path.join(process.cwd(), localPath), buffer);

  // ② Gemini AI 분석 (이미지만)
  let aiRaw = '';
  let aiResult = { date: null as string | null, amount: null as number | null, vendor: '', category: '기타' };
  if (file.type.startsWith('image/')) {
    try {
      const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const base64 = buffer.toString('base64');
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: file.type } },
        AI_PROMPT,
      ]);
      aiRaw    = result.response.text().trim();
      aiResult = parseAI(aiRaw);
    } catch (e) {
      console.warn('[Gemini] 분석 실패:', e instanceof Error ? e.message : e);
    }
  }

  // ③ Drive 업로드 (세션 & refreshToken 있을 때만)
  let driveFileId: string | undefined;
  let driveUrl:    string | undefined;
  if (session?.refreshToken) {
    try {
      const accessToken = await getValidAccessToken(session);
      const rootId      = await ensureAizetFolder(accessToken);
      const taxId       = await ensureSubfolder(accessToken, rootId, 'tax');

      // 거래처명 조회
      const { getClient } = await import('@/lib/db/tax-clients');
      const client = getClient(clientId, userId);
      const clientFolder = await ensureSubfolder(accessToken, taxId, client?.name ?? clientId);

      const driveFile = await uploadDocumentToDrive(accessToken, clientFolder, safeFilename, buffer, file.type);
      driveFileId = driveFile.id;
      driveUrl    = driveFile.webViewLink;
    } catch (e) {
      console.warn('[Drive] 업로드 실패 (skip):', e instanceof Error ? e.message : e);
    }
  }

  // ④ DB 저장
  const doc = createDocument(userId, {
    client_id:     clientId,
    filename:      file.name,
    mime_type:     file.type,
    file_size:     file.size,
    local_path:    localPath,
    drive_file_id: driveFileId,
    drive_url:     driveUrl,
    doc_date:      aiResult.date,
    amount:        aiResult.amount,
    vendor:        aiResult.vendor,
    category:      aiResult.category,
    ai_raw:        aiRaw,
  });

  return Response.json({ document: doc, ai: aiResult, aiAvailable: file.type.startsWith('image/') }, { status: 201 });
}
