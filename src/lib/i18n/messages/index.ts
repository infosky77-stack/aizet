// UI 문자열 조회의 단일 진입점 — t(locale, key). 폴백: 요청 언어 → en → ko.
// ko가 키의 단일 소스이므로 t()는 어떤 (locale, key)에도 항상 문자열을 돌려준다.
// 서버 컴포넌트/클라이언트 어디서든 import 가능(순수 데이터 + 조회 함수뿐).

import { ko, type MessageKey } from './ko';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { vi } from './vi';
import type { Locale } from '../types';

const DICTS: Record<Locale, Partial<Record<MessageKey, string>>> = { ko, en, zh, ja, vi };

export type { MessageKey };

export function t(locale: Locale, key: MessageKey): string {
  return DICTS[locale][key] ?? en[key] ?? ko[key];
}
