export interface RenderJobPayload {
  jobId:     string;
  orderId:   string;
  jobType:   'video' | 'print';
  snapshot:  Record<string, unknown>;
  title:     string;
}

export interface RenderResult {
  success:     boolean;
  outputPath?: string;
  errorMsg?:   string;
}

export interface IRenderWorker {
  readonly workerType: string;
  canAccept(): boolean;
  execute(payload: RenderJobPayload): Promise<RenderResult>;
}
