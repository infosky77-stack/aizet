/**
 * 한의원 이미지 베이스 — public/clinic 폴더 26장을 카테고리별로 정리
 * 회원마다 카테고리 안에서 이미지를 골라 쓸 수 있는 토대
 * (치환 로직은 다음 단계)
 */

/** 원장 프로필 (1장) */
export const CLINIC_DOCTOR_IMAGES = [
  '/clinic/clinic-doctor.jpg',  // 박영숙 원장 정면 프로필, 흰 가운·미소, 책장·한약재 배경 (세로 portrait)
] as const;

/** Hero·공간 배경 후보 (3장) — 넓은 공간감, 배경 이미지로 적합 */
export const CLINIC_HERO_IMAGES = [
  '/clinic/clinic-hero-traditional.jpg',      // 전통 한옥풍 원장실+치료공간 전경, 왼쪽 여백 넓음 → Hero 최적
  '/clinic/clinic-interior.jpg',              // 진료실 내부 전경, 문 밖에서 촬영, "박영숙 한의원 진료실" 간판
  '/clinic/clinic-treatment-traditional.jpg', // 한옥 치료실 전경, 한약재 서랍장+침대+선반
] as const;

/** 리셉션·대기실·상담 공간 (4장) */
export const CLINIC_RECEPTION_IMAGES = [
  '/clinic/clinic-reception-modern-1.jpg', // 현대적 대기실, 높은 천장·도시뷰·안내판
  '/clinic/clinic-reception-modern-2.jpg', // 현대적 대기실, 복도·유리 파티션
  '/clinic/clinic-consultation.jpg',        // 한복 원장+환자 1:1 상담, 한옥 스타일 진료실
  '/clinic/clinic-treatment-cupping.jpg',   // 빈 치료실, 부항컵 트레이 세팅 (치료 전 준비)
] as const;

/** 침 시술 (4장) */
export const CLINIC_ACUPUNCTURE_IMAGES = [
  '/clinic/clinic-acupuncture.jpg',   // 원장이 환자 등에 침 시술, 세로 portrait, 진료실 배경
  '/clinic/clinic-acupuncture-1.jpg', // 팔목 침 시술 클로즈업, 파란 유니폼
  '/clinic/clinic-acupuncture-2.jpg', // 손목 침 시술 클로즈업, 파란 유니폼 (다른 앵글)
  '/clinic/clinic-fatigue.jpg',       // 침 여러 개 꽂힌 채 편안히 누운 환자 — 만성피로 치료 장면
] as const;

/** 부항·약침·실침 특수 시술 (3장) */
export const CLINIC_CUPPING_IMAGES = [
  '/clinic/clinic-cupping.jpg',          // 원장이 환자 등에 부항 시술, 한방 서랍장 배경
  '/clinic/clinic-pharmacopuncture.jpg', // 원장이 환자 등에 약침 시술, 글러브+주사기형 도구
  '/clinic/clinic-thread.jpg',           // 원장이 환자 목·턱에 실침 시술, 글러브+스테인리스 트레이
] as const;

/** 추나·물리치료 공간·장비 (3장) */
export const CLINIC_CHUNA_IMAGES = [
  '/clinic/clinic-chuna.jpg',             // 원장이 환자 등에 추나 척추 교정, 동의보감 책장 배경
  '/clinic/clinic-equipment-chuna-1.jpg', // 추나 테이블(파란 쿠션)+약침 트레이, 도시뷰 창
  '/clinic/clinic-equipment-chuna-2.jpg', // 추나 베드 2개+물리치료 기기 카트, 모던+한방 혼합 공간
] as const;

/** 재활·물리치료 장비 (2장) */
export const CLINIC_EQUIPMENT_IMAGES = [
  '/clinic/clinic-equipment-physio.jpg', // 재활실 전경, 로봇 보행기·트레드밀·전기치료 동시 진행
  '/clinic/clinic-equipment-rehab.jpg',  // 재활기기 조작, 스태프+환자, 현대 재활실
] as const;

/** 한약재·처방 (3장) */
export const CLINIC_HERBAL_IMAGES = [
  '/clinic/clinic-herbal.jpg',  // 원장이 약재 저울 계량 중, 한약재 서랍장·약재 병들 배경
  '/clinic/clinic-herbs-1.jpg', // 한약재 플랫레이, 인삼·대추·황기 등, 밝은 나무 배경
  '/clinic/clinic-herbs-2.jpg', // 한약재 플랫레이, 어두운 도자기 그릇·약저울
] as const;

/** 설진·체질·구강 진단·상담 (3장) */
export const CLINIC_DIAGNOSIS_IMAGES = [
  '/clinic/clinic-damjeok.jpg',      // 설진 장면, 원장이 환자 혀 관찰 — 담적 진단 대표 이미지
  '/clinic/clinic-oral.jpg',         // 원장이 구강 모형+태블릿으로 구강케어 설명, 데스크 상담
  '/clinic/clinic-constitution.jpg', // 원장이 태블릿으로 체질 분류 설명, 혈압계 착용 환자
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 회원별 이미지 선택 — seed → 각 카테고리에서 1장
// ─────────────────────────────────────────────────────────────────────────────

export interface ClinicImagePicks {
  /** Hero 원장 portrait */
  doctor:       string;
  /** Hero 배경 후보 (향후 섹션 활용) */
  hero:         string;
  /** 리셉션·상담 공간 (향후 섹션 활용) */
  reception:    string;
  /** 부항·약침·실침 (향후 섹션 활용) */
  cupping:      string;
  /** 추나 (향후 섹션 활용) */
  chuna:        string;
  /** 재활 장비 (향후 섹션 활용) */
  equipment:    string;
  /** 서비스 카드 — 담적 진단·치료 */
  damjeok:      string;
  /** 서비스 카드 — 구취·구강건조 케어 */
  oral:         string;
  /** 서비스 카드 — 침구치료 */
  acupuncture:  string;
  /** 서비스 카드 — 한약 처방 */
  herbal:       string;
  /** 서비스 카드 — 만성피로·소화불량 */
  fatigue:      string;
  /** 서비스 카드 — 체질 진단 상담 */
  constitution: string;
}

/** 문자열 seed → 32bit 양수 정수 (같은 seed는 항상 같은 값) */
function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h, 31) + seed.charCodeAt(i);
    h |= 0;
  }
  return h < 0 ? ~h : h;
}

/**
 * seed(가게명·회원ID 등)를 기반으로 각 카테고리에서 이미지 1장씩 선택.
 * - 같은 seed → 항상 같은 조합 (일관성)
 * - 다른 seed → 다른 조합 (다양성)
 * - 같은 카테고리 내 서비스끼리는 offset을 달리 해 이미지가 겹치지 않게
 */
export function pickClinicImages(seed: string): ClinicImagePicks {
  const h = seedHash(seed);
  const pick = <T extends readonly string[]>(arr: T, offset: number): string =>
    arr[(h + offset) % arr.length];

  return {
    // 원장 프로필 (1장 — 항상 동일)
    doctor:       pick(CLINIC_DOCTOR_IMAGES, 0),
    // 공간·배경 카테고리
    hero:         pick(CLINIC_HERO_IMAGES, 0),
    reception:    pick(CLINIC_RECEPTION_IMAGES, 0),
    cupping:      pick(CLINIC_CUPPING_IMAGES, 0),
    chuna:        pick(CLINIC_CHUNA_IMAGES, 0),
    equipment:    pick(CLINIC_EQUIPMENT_IMAGES, 0),
    // 서비스 카드 — 같은 카테고리라도 offset을 달리해 서비스끼리 다른 이미지 배정
    // CLINIC_DIAGNOSIS_IMAGES(3장): offset 0/1/2 → 항상 3가지 서로 다른 이미지
    damjeok:      pick(CLINIC_DIAGNOSIS_IMAGES, 0),
    oral:         pick(CLINIC_DIAGNOSIS_IMAGES, 1),
    constitution: pick(CLINIC_DIAGNOSIS_IMAGES, 2),
    // CLINIC_ACUPUNCTURE_IMAGES(4장): offset 0/2 → 항상 서로 다른 이미지
    acupuncture:  pick(CLINIC_ACUPUNCTURE_IMAGES, 0),
    fatigue:      pick(CLINIC_ACUPUNCTURE_IMAGES, 2),
    // CLINIC_HERBAL_IMAGES(3장)
    herbal:       pick(CLINIC_HERBAL_IMAGES, 0),
  };
}
