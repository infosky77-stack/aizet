/**
 * 한의원 업종 텍스트 베이스
 *
 * [가게별 가변]  DEMO_SHOP_INFO · DEMO_HOURS · DEMO_REVIEWS
 *               실제 가게 연결 시 이 값들을 DB / site-ai 생성값으로 교체
 *
 * [업종 공통]    CLINIC_HERO · DAMJEOK_EXPLANATION · PHILOSOPHY_CARDS
 *               CLINIC_BASE_SERVICES · PRICE_COVERED · PRICE_NON_COVERED
 *               PRICING_NOTE · RESERVATION_TOPICS · AI_SAMPLE_QUESTIONS
 *               DISCLAIMER
 *               모든 한의원이 공유하는 구조·문구 (개별 수정 가능한 기본값)
 */

import {
  Search, Smile, Zap, FlaskConical, Activity, Users,
  ShieldCheck, CheckCircle, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { pickClinicImages, type ClinicImagePicks } from './clinicImages';

// ── 타입 정의 ──────────────────────────────────────────────────────────────────

export interface ClinicShopInfo {
  shopName:        string;  // 상호명 (예: '자연한의원')
  doctorName:      string;  // 원장명 (예: '박영숙 원장')
  doctorCareer:    string;  // 학력·경력 한 줄 (예: '경희대 한의과 졸업 · 경력 20년')
  phone:           string;  // 대표 전화 (예: '02-1234-5678')
  address:         string;  // 전체 주소
  subwayInfo:      string;  // 지하철 안내
  parkingInfo:     string;  // 주차 안내
  specialization:  string;  // 특화진료 뱃지 문구 (예: '담적·구강케어 전문')
  heroDescription: string;  // Hero 소개문 — site-ai로 가게마다 생성
  adminHref:       string;  // 관리자 버튼 href
}

export interface ClinicServiceItem {
  icon:      LucideIcon;
  title:     string;
  desc:      string;    // 짧은 부제
  detail:    string;    // 상세 설명
  img:       string;    // 이미지 경로 (다음 단계: 가게별 생성 이미지로 교체)
  covered:   boolean;   // 건강보험 여부
  color:     string;    // 카드 배경+테두리 클래스
  iconColor: string;    // 아이콘 색상 클래스
}

export interface PriceItem {
  name:  string;
  price: string;
  note:  string;
}

export interface HoursItem {
  day:  string;
  time: string;
  note: string;
}

export interface ReviewItem {
  name:  string;
  text:  string;
  stars: number;
}

export interface PhilosophyCard {
  icon:  LucideIcon;
  title: string;
  desc:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 가게별 가변 필드 — 데모 기본값
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SHOP_INFO: ClinicShopInfo = {
  shopName:        '자연한의원',
  doctorName:      '박영숙 원장',
  doctorCareer:    '경희대 한의과 졸업 · 경력 20년',
  phone:           '02-1234-5678',
  address:         '서울시 강남구 역삼동 123-45 자연빌딩 3층',
  subwayInfo:      '지하철 2호선 역삼역 3번 출구에서 도보 5분',
  parkingInfo:     '건물 지하 주차장 이용 가능 (30분 무료)',
  specialization:  '담적·구강케어 전문',
  heroDescription: '20년 임상 경험의 박영숙 원장이 직접 진료합니다. 복진·설진으로 담적을 정확히 진단하고, 소화기-구강 연결 케어로 만성 증상의 근본 원인을 해결합니다.',
  adminHref:       '/admin',
};

export const DEMO_HOURS: HoursItem[] = [
  { day: '월·화·목·금', time: '09:00 – 18:30', note: '' },
  { day: '수요일',      time: '09:00 – 13:00', note: '오후 휴진' },
  { day: '토요일',      time: '09:00 – 13:00', note: '' },
  { day: '일·공휴일',   time: '휴진',           note: '' },
];

export const DEMO_REVIEWS: ReviewItem[] = [
  {
    name:  '김○○',
    text:  '3년 넘게 이유 없이 피곤하고 입냄새가 심했는데, 담적 진단 후 한약 2개월 만에 확연히 좋아졌습니다. 이런 개념이 있는지도 몰랐어요.',
    stars: 5,
  },
  {
    name:  '이○○',
    text:  '구강건조와 더부룩함이 함께 있었는데 소화기와 연결된 거라는 설명을 듣고 치료를 시작했습니다. 두 가지가 같이 나아져서 신기했어요.',
    stars: 5,
  },
  {
    name:  '박○○',
    text:  '체질 상담부터 담적 치료까지 원장님이 꼼꼼하게 설명해 주셔서 믿음이 갔습니다. 만성 두통도 많이 줄었습니다.',
    stars: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 업종 공통 베이스 — 한의원 (담적 전문형)
// ─────────────────────────────────────────────────────────────────────────────

export const CLINIC_HERO = {
  title:       '원인 모를 만성피로,',
  titleLine2:  '두통, 입냄새 —',
  titleAccent: '담적이 원인일 수 있습니다',
};

export const DAMJEOK_EXPLANATION =
  '담적은 소화 기능 저하로 위장 점막에 탁한 노폐물(담)이 굳어 쌓이는 상태입니다. 혈액순환을 방해해 만성피로·두통·구취·소화불량이 동시에 나타나는 것이 특징입니다. 내시경·혈액검사에서 이상이 없어도 담적이 원인일 수 있습니다.';

export const PHILOSOPHY_CARDS: PhilosophyCard[] = [
  {
    icon:  ShieldCheck,
    title: '담적 전문 진단',
    desc:  '복진·설진으로 담적 유무와 정도를 평가합니다. 검사 이상 없어도 담적이 원인일 수 있습니다.',
  },
  {
    icon:  CheckCircle,
    title: '소화기-구강 통합 케어',
    desc:  '입냄새·구강건조는 소화기 이상과 연결됩니다. 원인인 담적부터 치료해 구강 증상을 해결합니다.',
  },
  {
    icon:  Star,
    title: '체질 맞춤 한약',
    desc:  '같은 담적도 체질에 따라 처방이 다릅니다. 체질 감별 후 가장 잘 맞는 탕약을 처방합니다.',
  },
];

// 서비스 텍스트·스타일 템플릿 (이미지 제외) — buildClinicServices에서 picks와 조립
type ServiceTemplate = Omit<ClinicServiceItem, 'img'>;
const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    icon:      Search,
    title:     '담적 진단·치료',
    desc:      '복진·설진으로 담적 확인, 한약으로 근본 치료',
    detail:    '소화기에 쌓인 담적(痰積)은 만성피로·두통·구취의 숨은 원인입니다. 복진과 설진으로 담적 유무를 진단하고, 개인 맞춤 한약 처방으로 담적을 녹여 냅니다.',
    covered:   false,
    color:     'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    icon:      Smile,
    title:     '구취·구강건조 케어',
    desc:      '소화기-구강 연결 통합 치료',
    detail:    '구취와 구강건조는 단순 구강 문제가 아닌 소화기 이상 신호입니다. 담적 치료와 병행해 위장 환경을 바로잡으면 구강 증상이 근본부터 개선됩니다.',
    covered:   false,
    color:     'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600 bg-sky-100',
  },
  {
    icon:      Zap,
    title:     '침구치료',
    desc:      '소화기·통증 완화 경혈 자극. 건강보험 적용 가능',
    detail:    '경혈 자극으로 기혈 순환을 개선하고 소화기 기능을 회복합니다. 담적으로 인한 복부 냉증·더부룩함·두통에 특히 효과적이며 건강보험이 적용됩니다.',
    covered:   true,
    color:     'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    icon:      FlaskConical,
    title:     '한약 처방',
    desc:      '담적 해소 중심 체질 맞춤 탕약',
    detail:    '담적 치료의 핵심은 한약입니다. 사상체질 분류 후 담을 녹이고 소화기를 회복시키는 맞춤 처방을 진행합니다. 보약·갱년기·면역력 저하에도 폭넓게 적용됩니다.',
    covered:   false,
    color:     'bg-green-50 border-green-200',
    iconColor: 'text-green-600 bg-green-100',
  },
  {
    icon:      Activity,
    title:     '만성피로·소화불량',
    desc:      '검사상 이상 없는 만성 증상의 한방 관리',
    detail:    '검사 결과 이상 없는 만성피로·두통·더부룩함은 담적과 연관된 경우가 많습니다. 소화기 기능 회복에 집중한 한방 통합 치료로 원인부터 해결합니다.',
    covered:   false,
    color:     'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    icon:      Users,
    title:     '체질 진단 상담',
    desc:      '사상체질 감별 후 1:1 맞춤 치료 계획',
    detail:    '태양·태음·소양·소음 체질에 따라 담적 발생 패턴과 치료 반응이 다릅니다. 체질 감별을 먼저 진행하고 최적화된 치료 계획을 수립합니다.',
    covered:   false,
    color:     'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600 bg-rose-100',
  },
];

/**
 * picks(pickClinicImages 결과)와 SERVICE_TEMPLATES를 조립해 ClinicServiceItem[] 반환.
 * 실제 회원 페이지에서는 회원 seed로 생성한 picks를 전달.
 */
export function buildClinicServices(picks: ClinicImagePicks): ClinicServiceItem[] {
  return [
    { ...SERVICE_TEMPLATES[0], img: picks.damjeok },
    { ...SERVICE_TEMPLATES[1], img: picks.oral },
    { ...SERVICE_TEMPLATES[2], img: picks.acupuncture },
    { ...SERVICE_TEMPLATES[3], img: picks.herbal },
    { ...SERVICE_TEMPLATES[4], img: picks.fatigue },
    { ...SERVICE_TEMPLATES[5], img: picks.constitution },
  ];
}

// 데모용 — DEMO_SHOP_INFO.shopName을 seed로 고정 선택
export const DEMO_CLINIC_PICKS = pickClinicImages(DEMO_SHOP_INFO.shopName);
export const CLINIC_DOCTOR_IMAGE  = DEMO_CLINIC_PICKS.doctor;
export const CLINIC_BASE_SERVICES = buildClinicServices(DEMO_CLINIC_PICKS);

export const PRICE_COVERED: PriceItem[] = [
  { name: '초진 진찰료',  price: '본인부담 약 5,000원', note: '건강보험 적용' },
  { name: '재진 진찰료',  price: '본인부담 약 3,500원', note: '건강보험 적용' },
  { name: '침술 (1부위)', price: '본인부담 약 4,500원', note: '건강보험 적용' },
];

export const PRICE_NON_COVERED: PriceItem[] = [
  { name: '담적 정밀 진단',           price: '30,000원',             note: '복진·설진 포함 집중 진단' },
  { name: '담적 탕약 (10첩)',          price: '120,000 ~ 180,000원',  note: '증상·체질에 따라 상이' },
  { name: '구취·구강케어 한약 (1개월)', price: '80,000 ~ 150,000원',   note: '담적 동반 시 병행 처방' },
  { name: '체질 진단 상담',            price: '20,000원',             note: '사상체질 감별 + 치료 계획 수립' },
  { name: '보약·일반 탕약 (10첩)',      price: '80,000원 ~',           note: '처방 복잡도에 따라 상이' },
  { name: '첩약 건강보험 시범 (탕약)',  price: '본인부담 30%',          note: '요양병원 협약 시범사업 대상자' },
];

export const PRICING_NOTE =
  '실제 납부금액은 보험 종류·개인 부담률·처방 내용에 따라 다를 수 있습니다. 진료 전 상담 시 안내드립니다.';

export const RESERVATION_TOPICS = [
  '담적 진단', '구취·구강케어', '침구치료', '한약 상담', '체질 진단',
];

export const AI_SAMPLE_QUESTIONS = [
  '"이유 없이 항상 피곤해요"',
  '"입냄새가 심해요"',
  '"속이 자주 더부룩해요"',
  '"만성 두통이 있어요"',
];

export const DISCLAIMER =
  '본 페이지는 AIZET의 한의원 플랫폼 데모입니다. 표시된 의료 정보와 가격은 기획안 기반 예시이며 실제 진료가 이루어지지 않습니다. 의료적 결정은 반드시 자격을 갖춘 의료인과 상담 후 진행하세요.';
