export interface RenderJobPayload {
  jobId:     string;
  orderId:   string;
  userId:    string;
  jobType:   'video' | 'print';
  snapshot:  Record<string, unknown>;
  title:     string;
}

export interface RenderResult {
  success:      boolean;
  outputUuid?:  string;
  outputPath?:  string;
  outputType?:  'video' | 'pdf';
  errorMsg?:    string;
}

export interface IRenderWorker {
  readonly workerType: string;
  canAccept(): boolean;
  execute(payload: RenderJobPayload): Promise<RenderResult>;
}
