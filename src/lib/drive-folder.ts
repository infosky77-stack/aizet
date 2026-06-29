const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILES_API   = 'https://www.googleapis.com/drive/v3/files';

const FOLDER_NAME = 'AIZET';

export async function ensureAizetFolder(accessToken: string): Promise<string> {
  const q = `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`;
  const searchRes = await fetch(
    `${FILES_API}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const { files } = await searchRes.json() as { files?: { id: string }[] };
  if (files && files.length > 0) return files[0].id;

  const createRes = await fetch(`${FILES_API}?fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  });
  const folder = await createRes.json() as { id: string };
  return folder.id;
}

export interface DriveFileEntry {
  id:       string;
  name:     string;
  mimeType: string;
  size:     string;
}

const MEDIA_MIME_PREFIXES = ['image/', 'video/', 'audio/'];

/** AIZET 폴더 안의 미디어 파일(이미지/영상/오디오) 목록을 반환한다. */
export async function listDriveFiles(
  accessToken: string,
  folderId: string,
): Promise<DriveFileEntry[]> {
  const mimeQ = MEDIA_MIME_PREFIXES
    .map(p => `mimeType contains '${p}'`)
    .join(' or ');
  const q = `'${folderId}' in parents and (${mimeQ}) and trashed=false`;
  const res = await fetch(
    `${FILES_API}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size)&pageSize=100&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json() as { files?: DriveFileEntry[] };
  return data.files ?? [];
}

/** 지정한 부모 폴더 안에 이름으로 서브폴더를 찾거나 생성한다. */
export async function ensureSubfolder(
  accessToken: string,
  parentFolderId: string,
  name: string,
): Promise<string> {
  const q = `name='${name}' and mimeType='${FOLDER_MIME}' and '${parentFolderId}' in parents and trashed=false`;
  const searchRes = await fetch(
    `${FILES_API}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const { files } = await searchRes.json() as { files?: { id: string }[] };
  if (files && files.length > 0) return files[0].id;

  const createRes = await fetch(`${FILES_API}?fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentFolderId] }),
  });
  const folder = await createRes.json() as { id: string };
  return folder.id;
}
