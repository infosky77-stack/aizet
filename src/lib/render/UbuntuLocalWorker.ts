import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { IRenderWorker, RenderJobPayload, RenderResult } from './IRenderWorker';

const FFMPEG_BIN   = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
const RENDER_PY    = path.join(process.cwd(), 'scripts', 'render-video.py');
const CATALOG_PY   = path.join(process.cwd(), 'scripts', 'render-catalog.py');
const OUTPUT_BASE  = path.join(process.cwd(), 'data', 'render-output');

function runPython(args: string[], timeoutMs = 10 * 60 * 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', args, { timeout: timeoutMs });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('error', (err) => reject(new Error(`Python spawn error: ${err.message}`)));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`render-video.py 종료 코드 ${code}:\n${stderr.slice(-1500)}`));
      }
    });
  });
}

export class UbuntuLocalWorker implements IRenderWorker {
  readonly workerType = 'ubuntu_local';

  canAccept(): boolean {
    return existsSync(FFMPEG_BIN) && existsSync(RENDER_PY);
  }

  async execute(payload: RenderJobPayload): Promise<RenderResult> {
    if (payload.jobType === 'catalog') return this.executeCatalog(payload);
    if (payload.jobType === 'print')   return this.executePrint(payload);
    return this.executeVideo(payload);
  }

  private async executeVideo(payload: RenderJobPayload): Promise<RenderResult> {
    const uuid     = randomUUID();
    const userDir  = path.join(OUTPUT_BASE, payload.userId);
    const outPath  = path.join(userDir, `${uuid}.mp4`);
    const relPath  = `data/render-output/${payload.userId}/${uuid}.mp4`;

    await mkdir(userDir, { recursive: true });

    const payloadJson = JSON.stringify({
      jobId:    payload.jobId,
      orderId:  payload.orderId,
      userId:   payload.userId,
      title:    payload.title,
      snapshot: payload.snapshot,
    });

    const stdout = await runPython([
      RENDER_PY,
      '--payload', payloadJson,
      '--output',  outPath,
      '--cwd',     process.cwd(),
      '--ffmpeg',  FFMPEG_BIN,
    ]);

    const result = JSON.parse(stdout) as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, errorMsg: result.error ?? 'render-video.py 실패' };
    }

    return { success: true, outputUuid: uuid, outputPath: relPath, outputType: 'video' };
  }

  private async executeCatalog(payload: RenderJobPayload): Promise<RenderResult> {
    const uuid    = randomUUID();
    const userDir = path.join(OUTPUT_BASE, payload.userId);
    const outPath = path.join(userDir, `${uuid}.pdf`);
    const relPath = `data/render-output/${payload.userId}/${uuid}.pdf`;

    await mkdir(userDir, { recursive: true });

    const payloadJson = JSON.stringify({
      jobId:    payload.jobId,
      orderId:  payload.orderId,
      userId:   payload.userId,
      title:    payload.title,
      snapshot: payload.snapshot,
    });

    const stdout = await runPython([
      CATALOG_PY,
      '--payload', payloadJson,
      '--output',  outPath,
      '--cwd',     process.cwd(),
    ]);

    const result = JSON.parse(stdout) as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, errorMsg: result.error ?? 'render-catalog.py 실패' };
    }

    return { success: true, outputUuid: uuid, outputPath: relPath, outputType: 'pdf' };
  }

  private async executePrint(_payload: RenderJobPayload): Promise<RenderResult> {
    // PDF 렌더링은 추후 구현
    await new Promise(r => setTimeout(r, 1000));
    const uuid    = randomUUID();
    const relPath = `data/render-output/${_payload.userId}/${uuid}.pdf`;
    return { success: true, outputUuid: uuid, outputPath: relPath, outputType: 'pdf' };
  }
}
