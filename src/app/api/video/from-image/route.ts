import { NextRequest } from 'next/server';
import path from 'path';
import { imageToVideo } from '@/lib/video/imageToVideo';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const duration = Number(body.duration) || 5;
    const imageName = typeof body.image === 'string' ? body.image : 'legal-office.jpg';

    const imagePath = path.join(process.cwd(), 'public', 'legal', imageName);

    console.log(`[video] 생성 시작: ${imageName} → ${duration}초`);
    const buffer = await imageToVideo(imagePath, duration);
    console.log(`[video] 생성 완료: ${buffer.byteLength}B`);

    const filename = encodeURIComponent(`video_${imageName.replace(/\.[^.]+$/, '')}_${duration}s.mp4`);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'video/mp4',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Content-Length':      String(buffer.byteLength),
      },
    });
  } catch (err) {
    console.error('[video] error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
