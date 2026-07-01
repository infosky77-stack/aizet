import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

// ffmpeg-static은 바이너리 경로 문자열을 반환
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require('ffmpeg-static');

export async function imageToVideo(imagePath: string, durationSec: number): Promise<Buffer> {
  const outPath = `/tmp/video-${Date.now()}.mp4`;

  try {
    const args = [
      '-loop', '1',
      '-i', path.resolve(imagePath),
      '-c:v', 'libx264',
      '-t', String(durationSec),
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
      '-y',
      outPath,
    ];

    const { stderr } = await execFileAsync(ffmpegPath, args, { timeout: 60_000 });
    if (stderr) console.log('[video] ffmpeg stderr:', stderr.slice(-500));

    const buffer = await readFile(outPath);
    return buffer;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[imageToVideo] ffmpeg 실행 실패: ${msg}`);
  } finally {
    await unlink(outPath).catch(() => {});
  }
}
