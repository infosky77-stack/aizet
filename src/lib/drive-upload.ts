const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * 버퍼를 Drive AIZET 폴더에 비공개로 업로드.
 * 공개 권한(permissions)은 설정하지 않으므로 파일 소유자만 접근 가능.
 */
export async function uploadSiteImageToDrive(
  accessToken: string,
  folderId: string,
  filename: string,
  buffer: Buffer,
): Promise<{ id: string; webViewLink: string }> {
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });
  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: 'application/json' }));
  body.append('file', new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }));

  const res = await fetch(`${UPLOAD_API}?uploadType=multipart&fields=id,webViewLink`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Drive upload failed: ${res.status} ${detail.slice(0, 200)}`);
  }

  return res.json() as Promise<{ id: string; webViewLink: string }>;
}
