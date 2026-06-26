import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { gemini } from '@/lib/ai/gemini';
import {
  listDocuments, createDocument, purgeExpiredDocuments,
  getClientAmountAvg, countUnconfirmedDocuments,
} from '@/lib/db/tax-documents';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder, ensureSubfolder } from '@/lib/drive-folder';
import { uploadDocumentToDrive } from '@/lib/drive-upload';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
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
      date:     typeof p.date     === 'string' ? p.date     : null,
      amount:   typeof p.amount   === 'number' ? Math.round(p.amount) : null,
      vendor:   typeof p.vendor   === 'string' ? p.vendor   : '',
      category: typeof p.category === 'string' ? p.category : '기타',
    };
  } catch {
    return { date: null, amount: null, vendor: '', category: '기타' };
  }
}

function detectAnomaly(
  aiAmount:   number | null,
  aiDate:     string | null,
  avgAmount:  number | null,
  avgCount:   number,
): { flag: number; note: string } {
  let flag = 0;
  const notes: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 금액 이상: 데이터 5건 이상 있을 때만 판단 (오탐 방지)
  if (aiAmount && avgAmount && avgCount >= 5) {
    const ratio = aiAmount / avgAmount;
    if (ratio >= 3) {
      flag |= 1;
      notes.push(`평균(${Math.round(avgAmount).toLocaleString()}원) 대비 ${ratio.toFixed(1)}배 초과`);
    }
  }

  // 날짜 이상: 미래 날짜
  if (aiDate && aiDate > today) {
    flag |= 2;
    notes.push('미래 날짜');
  }

  return { flag, note: notes.join(' · ') };
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const userId  = session?.sub ?? 'demo';
  const { searchParams } = new URL(req.url);

  purgeExpiredDocuments(userId);

  // 미검수 문서 수만 반환 (신고 완료 체크용)
  const clientIdForCount = searchParams.get('count_client');
  if (clientIdForCount) {
    const count = countUnconfirmedDocuments(userId, clientIdForCount);
    return Response.json({ count });
  }

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
  const file     = formData.get('file')      as File | null;
  const clientId = formData.get('client_id') as string | null;

  if (!file)     return Response.json({ error: '파일을 선택해주세요.' },   { status: 400 });
  if (!clientId) return Response.json({ error: '거래처를 선택해주세요.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: '이미지(JPG·PNG·WebP·GIF) 또는 PDF만 업로드 가능합니다.' }, { status: 400 });
  }

  const buffer       = Buffer.from(await file.arrayBuffer());
  const safeFilename = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;

  // ① 로컬 저장
  const saveDir   = path.join(process.cwd(), 'data', 'tax-docs', userId, clientId);
  if (!existsSync(saveDir)) await mkdir(saveDir, { recursive: true });
  const localPath = path.join('data', 'tax-docs', userId, clientId, safeFilename);
  await writeFile(path.join(process.cwd(), localPath), buffer);

  // ② Gemini AI 분석 (이미지만)
  let aiRaw    = '';
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

  // ③ 이상치 감지
  const { avg: avgAmount, count: avgCount } = getClientAmountAvg(userId, clientId);
  const { flag: anomalyFlag, note: anomalyNote } = detectAnomaly(
    aiResult.amount, aiResult.date, avgAmount, avgCount,
  );

  // ④ Drive 업로드 (세션 & refreshToken 있을 때만)
  let driveFileId: string | undefined;
  let driveUrl:    string | undefined;
  if (session?.refreshToken) {
    try {
      const accessToken  = await getValidAccessToken(session);
      const rootId       = await ensureAizetFolder(accessToken);
      const taxId        = await ensureSubfolder(accessToken, rootId, 'tax');
      const { getClient } = await import('@/lib/db/tax-clients');
      const client       = getClient(clientId, userId);
      const clientFolder = await ensureSubfolder(accessToken, taxId, client?.name ?? clientId);
      const driveFile    = await uploadDocumentToDrive(accessToken, clientFolder, safeFilename, buffer, file.type);
      driveFileId = driveFile.id;
      driveUrl    = driveFile.webViewLink;
    } catch (e) {
      console.warn('[Drive] 업로드 실패 (skip):', e instanceof Error ? e.message : e);
    }
  }

  // ⑤ DB 저장 (확정값 = AI 원본으로 초기화, AI 원본은 별도 보존)
  const doc = createDocument(userId, {
    client_id:     clientId,
    filename:      file.name,
    mime_type:     file.type,
    file_size:     file.size,
    local_path:    localPath,
    drive_file_id: driveFileId,
    drive_url:     driveUrl,
    // 확정값
    doc_date:      aiResult.date,
    amount:        aiResult.amount,
    vendor:        aiResult.vendor,
    category:      aiResult.category,
    // AI 원본 (이후 변경 안 됨)
    ai_date:       aiResult.date,
    ai_amount:     aiResult.amount,
    ai_vendor:     aiResult.vendor,
    ai_category:   aiResult.category,
    ai_raw:        aiRaw,
    // 이상치
    anomaly_flag:  anomalyFlag,
    anomaly_note:  anomalyNote,
  });

  return Response.json({
    document: doc,
    ai: aiResult,
    anomaly: { flag: anomalyFlag, note: anomalyNote },
    aiAvailable: file.type.startsWith('image/'),
  }, { status: 201 });
}
