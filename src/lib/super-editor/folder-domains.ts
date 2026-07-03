// 폴더 탐색기 팝업의 도메인별 구성 — 단일 소스.
//
// 폴더 팝업(/admin/super-editor/folders)은 ?domain= 파라미터 하나로 잡지/영상 어느 쪽으로도
// 동작한다. 이 모듈이 "어떤 도메인이 팝업을 가질 수 있고, 각각 어떤 텍스트/주문타입을 쓰는지"의
// 유일한 정의처다 — 새 도메인(명함 등)을 추가할 때 여기 항목 하나만 늘리면 된다.
//
// lib/db/order-folders.ts의 FolderDomain과 값이 겹치지만 의도적으로 별도 선언한다 —
// lib/db/*는 서버 전용 db 싱글턴을 물고 있어 클라이언트 번들에 딸려 들어가면 안 되기 때문
// (placements/types.ts와 같은 관례).

export type PopupFolderDomain = 'magazine' | 'video';

export interface FolderPopupConfig {
  domain:    PopupFolderDomain;
  /** 이 팝업에서 "콘텐츠 만들기"가 생성하는 media_orders.order_type */
  orderType: 'magazine' | 'video';
  /** 팝업 헤더 제목 */
  title: string;
  /** 팝업 헤더 설명 */
  description: string;
  /** 콘텐츠 생성 입력 placeholder */
  contentPlaceholder: string;
}

export const FOLDER_POPUP_CONFIGS: Record<PopupFolderDomain, FolderPopupConfig> = {
  magazine: {
    domain: 'magazine',
    orderType: 'magazine',
    title: '잡지 폴더',
    description: '폴더 안에 폴더를 만들어 잡지를 원하는 만큼 깊게 구성하세요.',
    contentPlaceholder: '콘텐츠 제목 (예: 11월호 표지)',
  },
  video: {
    domain: 'video',
    orderType: 'video',
    title: '영상 폴더',
    description: '폴더 안에 폴더를 만들어 영상 프로젝트를 원하는 만큼 깊게 구성하세요.',
    contentPlaceholder: '영상 제목 (예: 매장 홍보 영상)',
  },
};

/** URL 파라미터 → 구성. 모르는 값/누락은 magazine(기존 URL·즐겨찾기 호환). */
export function getFolderPopupConfig(raw: string | null): FolderPopupConfig {
  if (raw && raw in FOLDER_POPUP_CONFIGS) return FOLDER_POPUP_CONFIGS[raw as PopupFolderDomain];
  return FOLDER_POPUP_CONFIGS.magazine;
}
