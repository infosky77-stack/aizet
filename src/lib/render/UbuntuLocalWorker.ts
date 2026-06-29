import type { IRenderWorker, RenderJobPayload, RenderResult } from './IRenderWorker';

export class UbuntuLocalWorker implements IRenderWorker {
  readonly workerType = 'ubuntu_local';

  canAccept(): boolean {
    return true;
  }

  async execute(payload: RenderJobPayload): Promise<RenderResult> {
    // 1단계 더미 처리 — 실제 렌더링 로직은 2단계에서 구체화
    await new Promise(r => setTimeout(r, 2000));

    const outputDir = payload.jobType === 'video' ? 'video' : 'print';
    return {
      success:    true,
      outputPath: `/outputs/${outputDir}/${payload.jobId}`,
    };
  }
}
