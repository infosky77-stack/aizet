// AIZET Object Model — 타입 단일 소스.
//
// 문서(Document)는 구조화 콘텐츠의 컨테이너이고, 블록(Block)은 parent_id self-참조로
// 트리를 이루는 콘텐츠 단위다. 여기서는 "의미"만 정의한다 — 색/폰트/여백 같은 꾸밈은
// 이 모델에 넣지 않는다(렌더러가 표현을 담당). data는 DB에는 JSON 문자열로, 앱에서는
// 파싱된 객체로 다룬다.

/** 블록 종류 — 각 kind는 아래 BlockDataMap의 data 형태를 가진다 */
export type BlockKind = 'heading' | 'paragraph' | 'image' | 'list' | 'list_item';

/** kind별 data 형태(의미만, 꾸밈 없음) */
export interface HeadingData  { level: 1 | 2 | 3; text: string }
export interface ParagraphData { text: string }
export interface ImageData    { src: string; alt: string; caption: string }
export interface ListData     { ordered: boolean }
export interface ListItemData { text: string }

/** kind → data 매핑(파싱된 객체 기준) */
export interface BlockDataMap {
  heading:   HeadingData;
  paragraph: ParagraphData;
  image:     ImageData;
  list:      ListData;
  list_item: ListItemData;
}

/** 파싱된 블록 data의 합집합 */
export type BlockData = BlockDataMap[BlockKind];

/** documents 테이블 1행 그대로 */
export interface Document {
  id:         string;
  kind:       string;
  title:      string;
  lang:       string;
  status:     string;
  created_at: number;
  updated_at: number;
}

/** blocks 테이블 1행 그대로 — data는 DB 저장 형태(JSON 문자열) */
export interface Block {
  id:          string;
  document_id: string;
  parent_id:   string | null;
  kind:        string;
  position:    number;
  data:        string;
  created_at:  number;
  updated_at:  number;
}

/** 트리 노드 — Block에서 data는 파싱된 객체로, children은 재귀 자식으로 대체 */
export interface BlockNode extends Omit<Block, 'data'> {
  data:     BlockData;
  children: BlockNode[];
}

/** 모든 렌더러가 소비하는 표준 모델 — blocks는 parent_id null인 최상위들(재귀 children) */
export interface DocumentTree {
  document: Document;
  blocks:   BlockNode[];
}
