// AIZET Object Model — 렌더러(프린터 드라이버) 표준 계약.
//
// 모든 렌더러(웹 HTML, Press PDF, 영상 …)는 DocumentTree 하나를 입력받아 각 매체의 산출물로
// 변환한다. 산출 형태는 매체마다 다르다(HTML=문자열, PDF/영상=바이너리). 그래서 반환 타입을
// 제네릭으로 열고, 비동기(폰트 로드·이미지 임베드가 Promise) 반환도 허용한다. 이 타입으로 계약을
// 고정해, 이후 추가되는 렌더러가 동일 시그니처를 따르도록 강제한다.

import type { DocumentTree } from '../types';

/** 제네릭 렌더러 계약 — 트리를 T(동기 또는 비동기)로 변환 */
export type RendererOf<T> = (tree: DocumentTree) => T | Promise<T>;

/**
 * 문자열 렌더러(웹 HTML 등) — 기존 renderHtml이 그대로 만족하도록 "동기 문자열" 계약을 유지한다.
 * (RendererOf<string>으로 두면 반환이 string|Promise<string>로 넓어져 기존 문자열 호출부가 깨지므로,
 *  하위호환을 위해 여기서는 동기 문자열로 고정한다. 비동기·바이너리는 아래 BinaryRenderer가 담당.)
 */
export type Renderer = (tree: DocumentTree) => string;

/** 바이너리 렌더러(Press PDF·영상 등) — 폰트 로드·이미지 임베드가 비동기라 Promise 반환 허용 */
export type BinaryRenderer = RendererOf<Uint8Array>;
