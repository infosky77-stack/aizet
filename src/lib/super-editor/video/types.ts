// 영상 프로젝트 — 도메인 타입 단일 소스 (로직 없음, 서버 모듈 import 없음).
//
// 편집 모델은 "장면(scene)의 순서 있는 목록"이다. 구형 VideoSnapshot(canvas.blocks +
// duration_sec)의 자유 블록 나열을 대체하며, 이후 렌더 자동화(브라우저 WebCodecs /
// 서버 fallback)의 입력이 된다 — 잡지의 page_no+slot과 같은 역할의 구조화 스키마이므로
// 여기에 자유 텍스트 형식을 되살리지 말 것.

export type SceneKind       = 'clip' | 'image' | 'text';
export type SceneTransition = 'cut' | 'fade';

export interface VideoScene {
  id:   string;
  kind: SceneKind;
  /** clip/image: 원장 FileEntry.id 포인터(잡지 ledger_ref 관례와 동일). 원본 바이트는 서버에 안 실림 */
  ledgerRef: string | null;
  /** ledgerRef가 없을 때의 직접 URL 소스 — 구형 스냅샷 마이그레이션(서버 URL 블록)용 */
  srcUrl: string | null;
  /** text 장면의 문구 (clip/image에선 '') */
  text: string;
  /** 장면 길이(초). clip에서 null이면 원본 길이 그대로 */
  durationSec: number | null;
  /** 이 장면으로 들어올 때의 전환 */
  transition: SceneTransition;
}

export interface VideoProjectSnapshot {
  /** 스냅샷 형식 구분자 — 구형(canvas.blocks)에는 이 필드가 없다 */
  version: 2;
  title:   string;
  aspect:  '16:9' | '9:16';
  /** BGM 자산 라벨 — 자산 모듈이 아직 없어 'none' 외 값은 현재 무시된다 */
  bgm: string;
  scenes: VideoScene[];
}

export const DEFAULT_SCENE_DURATION_SEC = 3;

export function isVideoProjectSnapshot(raw: unknown): raw is VideoProjectSnapshot {
  return typeof raw === 'object' && raw !== null
    && (raw as { version?: unknown }).version === 2
    && Array.isArray((raw as { scenes?: unknown }).scenes);
}

export function emptyVideoProject(title: string): VideoProjectSnapshot {
  return { version: 2, title, aspect: '16:9', bgm: 'none', scenes: [] };
}

export function newScene(kind: SceneKind, over: Partial<VideoScene> = {}): VideoScene {
  return {
    id: `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    ledgerRef: null,
    srcUrl: null,
    text: '',
    durationSec: kind === 'clip' ? null : DEFAULT_SCENE_DURATION_SEC,
    transition: 'cut',
    ...over,
  };
}
