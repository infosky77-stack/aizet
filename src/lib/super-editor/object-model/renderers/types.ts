// AIZET Object Model — 렌더러(프린터 드라이버) 표준 계약.
//
// 모든 렌더러(웹 HTML, Press PDF, 영상 …)는 DocumentTree 하나를 입력받아 각 매체의 산출
// 문자열을 반환하는 순수 함수다(DB·IO 의존 없음). 이 타입으로 계약을 고정해, 이후 추가되는
// 렌더러가 동일 시그니처를 따르도록 강제한다.

import type { DocumentTree } from '../types';

/** 표준 렌더러 계약 — 트리를 매체별 문자열로 변환하는 순수 함수 */
export type Renderer = (tree: DocumentTree) => string;
