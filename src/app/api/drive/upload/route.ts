import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string | null) || file?.name || 'upload';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const metadata = JSON.stringify({ name });
  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: 'application/json' }));
  body.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body,
    }
  );

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    return NextResponse.json({ error: 'Upload failed', detail }, { status: uploadRes.status });
  }

  const driveFile = await uploadRes.json();
  return NextResponse.json({ file: driveFile }, { status: 201 });
}
