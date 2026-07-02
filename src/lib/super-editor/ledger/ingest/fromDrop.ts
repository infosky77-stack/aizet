// 넣기 어댑터 — 드래그앤드롭(DataTransfer). 파일 탭 내부 드롭존과 전체화면 드롭존이 공유.
import { ingestFiles } from './shared';

export function ingestFromDrop(dataTransfer: DataTransfer | null | undefined): void {
  const files = dataTransfer?.files;
  if (!files || files.length === 0) return;
  ingestFiles(Array.from(files));
}
