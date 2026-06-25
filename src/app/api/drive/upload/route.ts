import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/drive-auth';
import { ensureAizetFolder } from '@/lib/drive-folder';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session);
  } catch {
    return NextResponse.json({ error: 'token_refresh_failed' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string | null) || file?.name || 'upload';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // AIZET 폴더 생성 또는 조회
  let folderId: string;
  try {
    folderId = await ensureAizetFolder(accessToken);
  } catch {
    return NextResponse.json({ error: 'folder_create_failed' }, { status: 502 });
  }

  // 멀티파트 업로드 (폴더 지정)
  const metadata = JSON.stringify({ name, parents: [folderId] });
  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: 'application/json' }));
  body.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    },
  );

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    return NextResponse.json({ error: 'Upload failed', detail }, { status: uploadRes.status });
  }

  const driveFile = await uploadRes.json() as { id: string; name: string; webViewLink: string };
  const fileId = driveFile.id;

  // 공개 읽기 권한 부여 (메뉴사진·로고 등 웹 표시용)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
  return NextResponse.json({ file: { ...driveFile, publicUrl } }, { status: 201 });
}
