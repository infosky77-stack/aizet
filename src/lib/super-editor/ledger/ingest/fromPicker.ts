// 넣기 어댑터 — 파일 선택 input(<input type="file">)
import { ingestFiles } from './shared';

export function ingestFromPicker(fileList: FileList | null | undefined): void {
  if (!fileList || fileList.length === 0) return;
  ingestFiles(Array.from(fileList));
}
