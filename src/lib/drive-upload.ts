const UPLOAD_API  = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';

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

/** 임의 MIME 타입 파일을 Drive 폴더에 비공개로 업로드한다. */
export async function uploadDocumentToDrive(
  accessToken: string,
  folderId:    string,
  filename:    string,
  buffer:      Buffer,
  mimeType:    string,
): Promise<{ id: string; webViewLink: string }> {
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });
  const body = new FormData();
  body.append('metadata', new Blob([metadata], { type: 'application/json' }));
  body.append('file',     new Blob([new Uint8Array(buffer)], { type: mimeType }));

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

/** Drive 파일을 영구 삭제한다. */
export async function deleteFromDrive(accessToken: string, fileId: string): Promise<void> {
  await fetch(`${DRIVE_FILES}/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
