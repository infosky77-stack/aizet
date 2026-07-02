// 브라우저 Canvas로 이미지를 "화면·다운로드용" 해상도로 리사이즈 + JPEG 압축.
// 인쇄용 원본 해상도가 아니라 미리보기/다운로드 PDF 전용 — 목표는 51MB급 PDF를 수 MB로 줄이는 것.

export interface ResizedImage {
  bytes:  Uint8Array;
  width:  number;
  height: number;
}

const DEFAULT_MAX_EDGE = 1800;
const DEFAULT_QUALITY  = 0.85;

export async function resizeImageToJpeg(
  blob: Blob,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = DEFAULT_QUALITY,
): Promise<ResizedImage> {
  // imageOrientation: 'from-image' — 폰 카메라 사진의 EXIF 회전 태그를 자동 반영(캔버스는 기본적으로 무시함)
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width  = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); throw new Error('canvas 2d context 생성 실패'); }

  // JPEG는 알파 채널이 없으므로 투명 배경(PNG 원본 등)이 검게 나오지 않도록 흰 배경을 먼저 깐다.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('JPEG 인코딩 실패'))),
      'image/jpeg',
      quality,
    );
  });

  const bytes = new Uint8Array(await outBlob.arrayBuffer());
  return { bytes, width, height };
}
