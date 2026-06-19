// ── 세금 신고 기한 캘린더 ──────────────────────────────────────────
export interface TaxDeadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'vat' | 'income' | 'corporate' | 'withholding' | 'other';
  period: string;
  target: string;
  penalty: string;
  color: string;
  bg: string;
}

export const TAX_DEADLINES: TaxDeadline[] = [
  // 부가세
  { id: 'vat-2026-1', title: '부가가치세 1기 확정신고', date: '2026-07-25', type: 'vat', period: '2026년 1월~6월', target: '일반과세자', penalty: '무신고 20% 가산세', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'vat-2025-2', title: '부가가치세 2기 확정신고', date: '2026-01-25', type: 'vat', period: '2025년 7월~12월', target: '일반과세자', penalty: '무신고 20% 가산세', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'vat-2026-1p', title: '부가가치세 1기 예정신고', date: '2026-04-25', type: 'vat', period: '2026년 1월~3월', target: '일반과세자(법인)', penalty: '무신고 20% 가산세', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'vat-2026-2p', title: '부가가치세 2기 예정신고', date: '2026-10-25', type: 'vat', period: '2026년 7월~9월', target: '일반과세자(법인)', penalty: '무신고 20% 가산세', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  // 소득세
  { id: 'income-2025', title: '종합소득세 신고·납부', date: '2026-05-31', type: 'income', period: '2025년 귀속', target: '사업소득자·프리랜서 등', penalty: '무신고 20%, 납부불성실 하루 0.022%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'income-2025-ext', title: '종합소득세 성실신고 확인서 제출', date: '2026-06-30', type: 'income', period: '2025년 귀속 (성실신고대상)', target: '성실신고확인 대상자', penalty: '확인서 미제출 시 5% 가산세', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  // 법인세
  { id: 'corp-2025-12', title: '법인세 신고·납부 (12월 결산)', date: '2026-03-31', type: 'corporate', period: '2025년 사업연도', target: '12월 결산 법인', penalty: '무신고 20% 가산세', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  { id: 'corp-2025-mid', title: '법인세 중간예납', date: '2026-08-31', type: 'corporate', period: '2026년 상반기', target: '사업연도 6개월 초과 법인', penalty: '미납부 시 연 8.03% 납부불성실가산세', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  // 원천징수
  { id: 'with-2026-1h', title: '원천징수 반기납부 (상반기)', date: '2026-07-10', type: 'withholding', period: '2026년 1월~6월', target: '반기납부 승인 사업자', penalty: '지연납부 시 가산세', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { id: 'with-2026-2h', title: '원천징수 반기납부 (하반기)', date: '2027-01-10', type: 'withholding', period: '2026년 7월~12월', target: '반기납부 승인 사업자', penalty: '지연납부 시 가산세', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
];

export const DEADLINE_TYPE_LABELS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  vat:         { label: '부가세',   color: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  income:      { label: '소득세',   color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  corporate:   { label: '법인세',   color: 'text-violet-700',  bg: 'bg-violet-100',  dot: 'bg-violet-500' },
  withholding: { label: '원천세',   color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  other:       { label: '기타',     color: 'text-gray-700',    bg: 'bg-gray-100',    dot: 'bg-gray-400' },
};

// ── 소득세 세율 구간 (2024년 기준) ─────────────────────────────────
export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}

export const INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0,         max: 14000000,   rate: 0.06, deduction: 0 },
  { min: 14000000,  max: 50000000,   rate: 0.15, deduction: 1260000 },
  { min: 50000000,  max: 88000000,   rate: 0.24, deduction: 5760000 },
  { min: 88000000,  max: 150000000,  rate: 0.35, deduction: 15440000 },
  { min: 150000000, max: 300000000,  rate: 0.38, deduction: 19940000 },
  { min: 300000000, max: 500000000,  rate: 0.40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, deduction: 35940000 },
  { min: 1000000000, max: null,      rate: 0.45, deduction: 65940000 },
];

export function calcIncomeTax(taxableIncome: number): {
  tax: number; rate: number; bracket: TaxBracket; effectiveRate: number;
} {
  const bracket = INCOME_TAX_BRACKETS.findLast(b => taxableIncome >= b.min)
    ?? INCOME_TAX_BRACKETS[0];
  const tax = Math.max(0, Math.floor(taxableIncome * bracket.rate - bracket.deduction));
  const localTax = Math.floor(tax * 0.1);
  return { tax: tax + localTax, rate: bracket.rate, bracket, effectiveRate: taxableIncome > 0 ? (tax + localTax) / taxableIncome : 0 };
}

// ── 상담 예약 (in-memory) ──────────────────────────────────────────
export interface TaxReservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  topic: string;
  date: string;
  time: string;
  note: string;
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  createdAt: string;
}

const reservations: TaxReservation[] = [
  { id: 'TR-001', name: '김철수', phone: '010-1234-5678', email: 'kim@example.com', businessType: '개인사업자', topic: '종합소득세', date: '2026-06-23', time: '10:00', note: '처음 신고합니다', status: 'confirmed', createdAt: '2026-06-18' },
  { id: 'TR-002', name: '이영희', phone: '010-9876-5432', email: 'lee@example.com', businessType: '법인', topic: '법인세', date: '2026-06-24', time: '14:00', note: '', status: 'pending', createdAt: '2026-06-19' },
  { id: 'TR-003', name: '박민준', phone: '010-5555-7777', email: 'park@example.com', businessType: '프리랜서', topic: '부가세·소득세 절세', date: '2026-06-25', time: '11:00', note: '절세 방법 궁금합니다', status: 'pending', createdAt: '2026-06-19' },
];

let nextId = 4;

export function getTaxReservations() { return [...reservations]; }

export function createTaxReservation(data: Omit<TaxReservation, 'id' | 'status' | 'createdAt'>): TaxReservation {
  const rsv: TaxReservation = {
    ...data,
    id: `TR-${String(nextId++).padStart(3, '0')}`,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  reservations.push(rsv);
  return rsv;
}

export function updateTaxReservationStatus(id: string, status: TaxReservation['status']) {
  const r = reservations.find(r => r.id === id);
  if (r) r.status = status;
  return r;
}
