// ── 법무사 서비스 항목 ──────────────────────────────────────────────
export interface LegalService {
  id: string;
  title: string;
  category: 'registration' | 'corporate' | 'inheritance' | 'auction' | 'bankruptcy' | 'preservation' | 'document';
  desc: string;
  detail: string;
  fee: string;
}

export const LEGAL_SERVICES: LegalService[] = [
  { id: 'ownership-transfer', title: '부동산 소유권 이전 등기', category: 'registration', desc: '매매·증여·상속에 따른 소유권 이전', detail: '아파트·토지·상가 등 부동산 매매, 증여, 상속 시 소유권 이전 등기를 신속하게 처리합니다. 취득세 신고부터 등기 완료까지 원스톱 서비스를 제공합니다.', fee: '등기비용 + 수수료 별도 안내' },
  { id: 'corp-establish', title: '법인 설립 / 변경 / 해산 등기', category: 'corporate', desc: '주식회사·유한회사·비영리법인 설립', detail: '주식회사, 유한회사, 비영리법인 등 각종 법인 설립 등기를 대리합니다. 임원 변경, 본점 이전, 목적 추가, 자본금 증감, 해산·청산 등기도 신속히 처리합니다.', fee: '법인 유형·자본금에 따라 상담 안내' },
  { id: 'inheritance', title: '상속 / 증여 등기', category: 'inheritance', desc: '상속재산 협의분할부터 등기까지', detail: '상속인 간 협의분할 및 법정상속 지분 등기를 처리합니다. 상속세·증여세 신고 연계, 상속포기·한정승인 서류 작성도 지원합니다.', fee: '재산 규모에 따라 상담 안내' },
  { id: 'auction', title: '부동산 경매 / 공매 대리', category: 'auction', desc: '경락잔금 대출 연계, 명도·인도까지', detail: '법원 경매 및 공매(온비드) 부동산 취득을 위한 권리분석, 입찰 대리, 소유권 이전 등기를 처리합니다. 선순위 권리 분석과 경락잔금 대출 연계 서비스를 함께 제공합니다.', fee: '낙찰가의 일정 비율·별도 안내' },
  { id: 'bankruptcy', title: '개인회생 / 파산 신청 서류 작성', category: 'bankruptcy', desc: '채무 해결을 위한 법률서류 작성 지원', detail: '과도한 채무로 어려움을 겪고 계신 분을 위해 개인회생·파산면책 신청 서류를 작성합니다. 재산목록, 채권자목록, 수지표 등 법원 제출 서류 일체를 준비합니다.', fee: '사건 복잡도에 따라 상담 안내' },
  { id: 'preservation', title: '가압류 / 가처분 등 보전처분', category: 'preservation', desc: '채권 보전을 위한 긴급 법률 조치', detail: '채무자의 재산 은닉·도피 방지를 위한 가압류(부동산·금전채권), 가처분(점유이전금지 등) 신청 서류를 신속히 작성합니다. 본안 소송 전 긴급 보전 조치를 지원합니다.', fee: '청구금액·사건 유형에 따라 안내' },
  { id: 'document', title: '내용증명 / 각종 법률서류 작성', category: 'document', desc: '계약 해제·이행 청구 등 내용증명', detail: '계약 해제 통보, 채무 이행 청구, 손해배상 청구 등 각종 내용증명을 작성합니다. 임대차 계약서, 금전소비대차계약서, 각서·확인서 등 법률문서도 작성·검토합니다.', fee: '건당 3만원~ (내용 복잡도에 따라 상이)' },
];

export const SERVICE_CATEGORY_LABELS: Record<LegalService['category'], { label: string; color: string; bg: string }> = {
  registration:  { label: '소유권 등기',  color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  corporate:     { label: '법인 등기',    color: 'text-indigo-700', bg: 'bg-indigo-100' },
  inheritance:   { label: '상속·증여',   color: 'text-teal-700',   bg: 'bg-teal-100' },
  auction:       { label: '경매·공매',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  bankruptcy:    { label: '회생·파산',   color: 'text-rose-700',   bg: 'bg-rose-100' },
  preservation:  { label: '보전처분',    color: 'text-violet-700', bg: 'bg-violet-100' },
  document:      { label: '법률서류',    color: 'text-slate-700',  bg: 'bg-slate-100' },
};

// ── 상담 예약 (in-memory) ──────────────────────────────────────────
export interface LegalReservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  topic: string;
  date: string;
  time: string;
  note: string;
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  createdAt: string;
}

const reservations: LegalReservation[] = [
  { id: 'LR-001', name: '홍길동', phone: '010-1111-2222', email: 'hong@example.com', serviceType: '소유권 이전', topic: '부동산 소유권 이전 등기', date: '2026-07-03', time: '10:00', note: '아파트 매매 완료 후 등기 의뢰', status: 'confirmed', createdAt: '2026-06-28' },
  { id: 'LR-002', name: '이미래', phone: '010-3333-4444', email: 'lee@example.com', serviceType: '법인 설립', topic: '법인 설립 / 변경 / 해산 등기', date: '2026-07-04', time: '14:00', note: '스타트업 법인 설립 문의', status: 'pending', createdAt: '2026-06-29' },
  { id: 'LR-003', name: '박상속', phone: '010-5555-6666', email: 'park@example.com', serviceType: '상속 등기', topic: '상속 / 증여 등기', date: '2026-07-05', time: '11:00', note: '부친 사망 후 부동산 상속 처리', status: 'pending', createdAt: '2026-06-30' },
];

let nextId = 4;

export function getLegalReservations() { return [...reservations]; }

export function createLegalReservation(data: Omit<LegalReservation, 'id' | 'status' | 'createdAt'>): LegalReservation {
  const rsv: LegalReservation = {
    ...data,
    id: `LR-${String(nextId++).padStart(3, '0')}`,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  reservations.push(rsv);
  return rsv;
}

export function updateLegalReservationStatus(id: string, status: LegalReservation['status']): LegalReservation | undefined {
  const rsv = reservations.find(r => r.id === id);
  if (rsv) rsv.status = status;
  return rsv;
}
