export interface CatalogStrength {
  title: string;
  desc: string;
  badge?: string;
}

export const CATALOG_STRENGTHS: CatalogStrength[] = [
  {
    title: 'AI 자동 고급 레이아웃',
    desc: '작품 이미지를 올리면 AI가 갤러리급 레이아웃으로 자동 편집합니다. 디자이너 없이도 전문 출판 수준의 결과물을 얻을 수 있습니다.',
  },
  {
    title: '전문 디자이너 비용 없이',
    desc: '일반 도록 제작 비용의 10분의 1 이하. 편집 디자인·인쇄를 한 번에 해결합니다. 작가가 직접 콘텐츠만 넣으면 됩니다.',
  },
  {
    title: '소량도 고급 인쇄',
    desc: '파주출판도시 전문 인쇄소와 제휴. 1권부터 주문 가능. 고급 아트지·광택·무광 마감을 선택할 수 있습니다.',
  },
  {
    title: '실사 미리보기',
    desc: '인쇄 전 PDF 다운로드 및 브라우저 미리보기로 최종 결과물을 확인합니다.',
    badge: '준비중',
  },
];

export interface SampleArtwork {
  src: string;
  title: string;
  medium: string;
  year: string;
}

export const SAMPLE_ARTWORKS: SampleArtwork[] = [
  { src: '/catalog/artwork-ink-landscape-1.jpg', title: '운무산수(雲霧山水)',   medium: '한지에 수묵',      year: '2024' },
  { src: '/catalog/artwork-ink-landscape-2.jpg', title: '청산귀래(靑山歸來)',   medium: '한지에 수묵담채',  year: '2023' },
  { src: '/catalog/artwork-abstract-1.jpg',      title: '고요(靜)',            medium: '캔버스에 유채',    year: '2024' },
  { src: '/catalog/artwork-abstract-2.jpg',      title: '파동(波動)',           medium: '캔버스에 아크릴',  year: '2023' },
  { src: '/catalog/artwork-stilllife-1.jpg',     title: '정물 — 꽃과 빛',     medium: '캔버스에 유채',    year: '2024' },
  { src: '/catalog/artwork-stilllife-2.jpg',     title: '오후의 사물들',        medium: '캔버스에 유채',    year: '2023' },
  { src: '/catalog/artwork-landscape-1.jpg',     title: '봄날의 기억',          medium: '캔버스에 유채',    year: '2024' },
  { src: '/catalog/artwork-landscape-2.jpg',     title: '빛의 들판',            medium: '캔버스에 아크릴',  year: '2023' },
];
