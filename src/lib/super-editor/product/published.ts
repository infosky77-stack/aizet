// 게시(공개 사본) 상세페이지 데이터 계약 — 순수 타입·변환 (서버 모듈 import 없음).
//
// 편집 스냅샷(ProductDetailSnapshot)의 ledgerRef는 비공개 파일 원장 포인터라 구매자에게
// 그대로 내보낼 수 없다. 게시 시점에 이미지가 공개 사본 URL(src)로 치환된 이 형태로 변환돼
// data/shop-public/<uid>/detail-<productId>.json 으로 저장된다(게시 라우트가 저장 담당).
// 구매자 렌더러(ProductDetailSections)는 이 형태만 안다 — 원장의 존재를 모른다.
//
// 변환도 layout.ts와 같은 보고 계약을 따른다: 내용이 비어 내보낼 수 없는 섹션은
// 조용히 누락시키지 않고 skipped로 보고한다(호출부가 warnings/notices로 승격).

import type { ProductDetailSnapshot, ProductFeatureItem } from './types';
import { productSectionLabel } from './layout';

export interface PublishedDetailSection {
  id:   string;
  kind: 'headline' | 'image' | 'text' | 'features';
  /** image: 공개 사본 URL(에디터 미리보기에선 blob URL). 그 외 kind에선 null */
  src:  string | null;
  text:    string;
  subText: string;
  items:   ProductFeatureItem[];
}

export interface PublishedProductDetail {
  version: 1;
  title:      string;
  templateId: string;
  sections:   PublishedDetailSection[];
}

export interface PublishedSkip {
  sectionId: string;
  /** 사람이 읽는 섹션 표시(예: "특징 (3번째 섹션)") — layout.ts와 같은 라벨 규칙 */
  label:  string;
  reason: string;
}

export function isPublishedProductDetail(raw: unknown): raw is PublishedProductDetail {
  return typeof raw === 'object' && raw !== null
    && (raw as { version?: unknown }).version === 1
    && Array.isArray((raw as { sections?: unknown }).sections);
}

/**
 * 편집 스냅샷 → 게시 형태. srcBySection은 이미지 섹션 id → 공개 URL(또는 blob URL) 맵.
 * 이미지 해석 실패·빈 내용 섹션은 결과에서 빼고 skipped로 보고한다 — 공개 페이지에
 * 깨진 자리표시를 내보내지 않는다(JPEG의 자리표시 블록과 다른 정책: 게시본은 완성본).
 */
export function toPublishedDetail(
  snapshot: ProductDetailSnapshot,
  srcBySection: Record<string, string>,
): { detail: PublishedProductDetail; skipped: PublishedSkip[] } {
  const sections: PublishedDetailSection[] = [];
  const skipped:  PublishedSkip[] = [];

  snapshot.sections.forEach((section, idx) => {
    const label = productSectionLabel(section, idx);
    const base = {
      id: section.id, kind: section.kind, src: null as string | null,
      text: section.text, subText: section.subText, items: [] as ProductFeatureItem[],
    };

    if (section.kind === 'image') {
      const src = srcBySection[section.id];
      if (!src) {
        skipped.push({ sectionId: section.id, label, reason: '이미지를 확보하지 못해 게시본에서 제외했습니다' });
        return;
      }
      sections.push({ ...base, src });

    } else if (section.kind === 'features') {
      const items = section.items.filter((it) => it.title.trim() || it.body.trim());
      if (items.length === 0) {
        skipped.push({ sectionId: section.id, label, reason: '내용이 비어 있어 게시본에서 제외했습니다' });
        return;
      }
      sections.push({ ...base, items });

    } else {
      // headline/text — 본문이 비면 제외
      if (!section.text.trim()) {
        skipped.push({ sectionId: section.id, label, reason: '내용이 비어 있어 게시본에서 제외했습니다' });
        return;
      }
      sections.push(base);
    }
  });

  return {
    detail: { version: 1, title: snapshot.title, templateId: snapshot.templateId, sections },
    skipped,
  };
}
