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
