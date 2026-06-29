import { randomUUID } from 'crypto';
import type { IRenderWorker, RenderJobPayload, RenderResult } from './IRenderWorker';

export class UbuntuLocalWorker implements IRenderWorker {
  readonly workerType = 'ubuntu_local';

  canAccept(): boolean {
    return true;
  }

  async execute(payload: RenderJobPayload): Promise<RenderResult> {
    // 1단계 더미 처리 — 실제 FFmpeg/PDF 로직은 2단계에서 채움
    await new Promise(r => setTimeout(r, 2000));

    const uuid       = randomUUID();
    const ext        = payload.jobType === 'video' ? 'mp4' : 'pdf';
    const outputType = payload.jobType === 'video' ? 'video' : 'pdf';
    // 실제 파일은 생성하지 않음 — 경로만 확정해서 DB에 기록
    const outputPath = `data/render-output/${payload.userId}/${uuid}.${ext}`;

    return { success: true, outputUuid: uuid, outputPath, outputType };
  }
}
