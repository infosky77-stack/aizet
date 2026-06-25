const FOLDER_NAME = 'AIZET';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILES_API = 'https://www.googleapis.com/drive/v3/files';

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
