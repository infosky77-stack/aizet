'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed, Coffee, Scissors, HeartPulse, Dumbbell,
  Building2, ShoppingBag, GraduationCap, BedDouble, Car,
  PawPrint, Briefcase, Sparkles, Check, ArrowLeft,
  Eye, EyeOff, Loader2, Wand2, Bot, CreditCard,
  Calendar, Globe, BarChart3, ChevronRight, CheckCircle2, Crown, Cloud,
} from 'lucide-react';
import { clsx } from 'clsx';
import { connectDrive, getDriveState, DriveState } from '@/lib/google-drive';

/* ─── Types ───────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4;

interface Industry {
  id: string;
  icon: React.ReactNode;
  name: string;
  sub: string;
  iconColor: string;
  iconBg: string;
  headerGradient: string;
  accentColor: string;
  cta: string;
  features: string[];
}

/* ─── Data ────────────────────────────────────────────── */
const INDUSTRIES: Industry[] = [
  {
    id: 'restaurant', icon: <UtensilsCrossed size={22} />,
    name: '식당', sub: '한식·양식·중식·일식',
    iconColor: 'text-amber-700', iconBg: 'bg-amber-100',
    headerGradient: 'from-amber-600 to-amber-800',
    accentColor: 'amber', cta: '지금 주문',
    features: ['AI 메뉴 추천', '테이블 주문', '서빙 로봇 연동', '결제 시스템'],
  },
  {
    id: 'cafe', icon: <Coffee size={22} />,
    name: '카페·베이커리', sub: '커피·디저트·브런치',
    iconColor: 'text-orange-700', iconBg: 'bg-orange-100',
    headerGradient: 'from-orange-600 to-orange-800',
    accentColor: 'orange', cta: '메뉴 보기',
    features: ['메뉴 쇼케이스', '포인트 적립', '픽업 예약', '시즌 메뉴'],
  },
  {
    id: 'beauty', icon: <Scissors size={22} />,
    name: '미용실·헤어샵', sub: '헤어·네일·뷰티',
    iconColor: 'text-pink-700', iconBg: 'bg-pink-100',
    headerGradient: 'from-pink-600 to-rose-700',
    accentColor: 'pink', cta: '예약하기',
    features: ['실시간 예약', '스타일 포트폴리오', '리마인더 알림', '리뷰 관리'],
  },
  {
    id: 'clinic', icon: <HeartPulse size={22} />,
    name: '병원·의원', sub: '내과·피부과·한의원',
    iconColor: 'text-red-700', iconBg: 'bg-red-100',
    headerGradient: 'from-red-600 to-red-800',
    accentColor: 'red', cta: '진료 예약',
    features: ['진료 예약', '의료진 소개', '비급여 안내', '오시는 길'],
  },
  {
    id: 'fitness', icon: <Dumbbell size={22} />,
    name: '헬스·필라테스', sub: '헬스장·요가·PT',
    iconColor: 'text-violet-700', iconBg: 'bg-violet-100',
    headerGradient: 'from-violet-600 to-purple-800',
    accentColor: 'violet', cta: '등록하기',
    features: ['수업 일정', '회원권 결제', '트레이너 소개', '출석 관리'],
  },
  {
    id: 'legal', icon: <Building2 size={22} />,
    name: '법무사·세무사', sub: '법무·세무·회계',
    iconColor: 'text-blue-700', iconBg: 'bg-blue-100',
    headerGradient: 'from-blue-600 to-blue-900',
    accentColor: 'blue', cta: '상담 예약',
    features: ['온라인 상담 예약', '서비스 안내', '사례 소개', '뉴스레터'],
  },
  {
    id: 'accommodation', icon: <BedDouble size={22} />,
    name: '숙박·펜션', sub: '호텔·리조트·게스트하우스',
    iconColor: 'text-teal-700', iconBg: 'bg-teal-100',
    headerGradient: 'from-teal-600 to-teal-800',
    accentColor: 'teal', cta: '객실 예약',
    features: ['객실 예약·결제', '주변 관광지', '패키지 상품', '리뷰 시스템'],
  },
  {
    id: 'shopping', icon: <ShoppingBag size={22} />,
    name: '의류·쇼핑', sub: '패션·잡화·편집샵',
    iconColor: 'text-rose-700', iconBg: 'bg-rose-100',
    headerGradient: 'from-rose-500 to-rose-700',
    accentColor: 'rose', cta: '쇼핑하기',
    features: ['상품 진열', '장바구니·결제', '배송 추적', '회원 할인'],
  },
  {
    id: 'education', icon: <GraduationCap size={22} />,
    name: '학원·교육', sub: '어학원·보습·예체능',
    iconColor: 'text-indigo-700', iconBg: 'bg-indigo-100',
    headerGradient: 'from-indigo-600 to-indigo-800',
    accentColor: 'indigo', cta: '수강 신청',
    features: ['수강 신청', '시간표 관리', '학부모 알림', '성적 포털'],
  },
  {
    id: 'auto', icon: <Car size={22} />,
    name: '자동차·정비', sub: '카센터·세차·튜닝',
    iconColor: 'text-stone-700', iconBg: 'bg-stone-100',
    headerGradient: 'from-stone-700 to-stone-900',
    accentColor: 'stone', cta: '예약하기',
    features: ['정비 예약', '서비스 견적', '차량 관리 이력', '부품 안내'],
  },
  {
    id: 'pet', icon: <PawPrint size={22} />,
    name: '반려동물', sub: '펫샵·동물병원·미용',
    iconColor: 'text-emerald-700', iconBg: 'bg-emerald-100',
    headerGradient: 'from-emerald-600 to-emerald-800',
    accentColor: 'emerald', cta: '예약하기',
    features: ['미용·진료 예약', '반려동물 등록', '건강 기록', '용품 쇼핑'],
  },
  {
    id: 'other', icon: <Briefcase size={22} />,
    name: '그 외 업종', sub: '인테리어·컨설팅 외',
    iconColor: 'text-zinc-700', iconBg: 'bg-zinc-100',
    headerGradient: 'from-zinc-600 to-zinc-800',
    accentColor: 'zinc', cta: '더 알아보기',
    features: ['AI 맞춤 구성', '업종별 특화 기능', '자유로운 커스텀', '전담 온보딩'],
  },
];

const GENERATION_TASKS = [
  { label: '업종 분석 및 컨셉 설정', ms: 700 },
  { label: '브랜드 색상 & 폰트 선정', ms: 1200 },
  { label: '메뉴 / 서비스 목록 구성', ms: 1900 },
  { label: '예약 · 주문 시스템 연동', ms: 2700 },
  { label: '결제 모듈 초기화', ms: 3400 },
  { label: 'SEO 메타데이터 자동 생성', ms: 4000 },
  { label: '모바일 반응형 최적화', ms: 4600 },
  { label: '최종 검토 & 배포 준비 완료', ms: 5300 },
];

/* ─── StepIndicator ───────────────────────────────────── */
const STEP_LABELS = ['기본 정보', '업종 선택', 'AI 생성 중', '완성!'];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-xs mx-auto mb-8">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-amber-600 text-white ring-4 ring-amber-100' :
                  'bg-stone-100 text-stone-400'
                )}
              >
                {done ? <Check size={14} /> : stepNum}
              </div>
              <span className={clsx(
                'text-[10px] font-medium whitespace-nowrap',
                active ? 'text-amber-600' : done ? 'text-emerald-600' : 'text-stone-400'
              )}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={clsx(
                'flex-1 h-0.5 mx-1 mb-4 rounded transition-colors duration-500',
                done ? 'bg-emerald-300' : 'bg-stone-100'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: 기본 정보 ───────────────────────────────── */
interface FormData { bizName: string; email: string; password: string; agreed: boolean }
interface FormErrors { bizName?: string; email?: string; password?: string; agreed?: boolean }

function Step1Info({
  form, setForm, onNext,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.bizName.trim()) e.bizName = '업체명을 입력해 주세요';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = '올바른 이메일을 입력해 주세요';
    if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다';
    if (!form.agreed) e.agreed = true;
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">무료로 시작하기</h1>
        <p className="text-stone-500 text-sm mt-1">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-amber-600 font-semibold hover:underline">로그인</Link>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 업체명 */}
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1.5">업체명</label>
          <input
            type="text"
            placeholder="예) 맛있는 한식당"
            value={form.bizName}
            onChange={(e) => { setForm((f) => ({ ...f, bizName: e.target.value })); setErrors((r) => ({ ...r, bizName: undefined })); }}
            className={clsx(
              'w-full text-sm px-4 py-3 rounded-xl border-2 outline-none transition-colors',
              errors.bizName ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-amber-500'
            )}
          />
          {errors.bizName && <p className="text-red-500 text-xs mt-1">{errors.bizName}</p>}
        </div>

        {/* 이메일 */}
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1.5">이메일</label>
          <input
            type="email"
            placeholder="hello@mybiz.com"
            value={form.email}
            onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((r) => ({ ...r, email: undefined })); }}
            className={clsx(
              'w-full text-sm px-4 py-3 rounded-xl border-2 outline-none transition-colors',
              errors.email ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-amber-500'
            )}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1.5">비밀번호</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상 입력"
              value={form.password}
              onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((r) => ({ ...r, password: undefined })); }}
              className={clsx(
                'w-full text-sm px-4 py-3 pr-11 rounded-xl border-2 outline-none transition-colors',
                errors.password ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-amber-500'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* 동의 */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <div
            onClick={() => setForm((f) => ({ ...f, agreed: !f.agreed }))}
            className={clsx(
              'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer',
              form.agreed ? 'bg-amber-600 border-amber-600' : errors.agreed ? 'border-red-400' : 'border-stone-300'
            )}
          >
            {form.agreed && <Check size={12} className="text-white" />}
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            <Link href="#" className="text-amber-600 font-medium hover:underline">이용약관</Link>과{' '}
            <Link href="#" className="text-amber-600 font-medium hover:underline">개인정보처리방침</Link>에
            동의합니다.
          </p>
        </label>
        {errors.agreed && <p className="text-red-500 text-xs -mt-3">약관에 동의해 주세요</p>}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        다음 단계 — 업종 선택
        <ChevronRight size={16} />
      </button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-xs text-stone-400">또는</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      <button className="w-full py-3 border-2 border-stone-200 hover:border-stone-300 rounded-xl text-sm font-semibold text-stone-700 transition-colors flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 시작하기
      </button>
    </div>
  );
}

/* ─── Step 2: 업종 선택 ───────────────────────────────── */
function Step2Industry({
  selected, onSelect, onNext, onBack,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const industry = INDUSTRIES.find((i) => i.id === selected);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-stone-900">어떤 업종인가요?</h2>
          <p className="text-sm text-stone-500">업종에 맞게 AI가 기능과 디자인을 자동 구성합니다</p>
        </div>
      </div>

      {/* Industry grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            onClick={() => onSelect(ind.id)}
            className={clsx(
              'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center',
              selected === ind.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-stone-100 hover:border-stone-200 bg-white'
            )}
          >
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', ind.iconBg, ind.iconColor)}>
              {ind.icon}
            </div>
            <div>
              <p className={clsx('text-xs font-semibold leading-tight', selected === ind.id ? 'text-amber-700' : 'text-stone-700')}>
                {ind.name}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5 hidden sm:block">{ind.sub}</p>
            </div>
            {selected === ind.id && (
              <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Check size={9} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected preview */}
      {industry && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">포함되는 기능</p>
          <div className="grid grid-cols-2 gap-2">
            {industry.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-stone-700">
                <Check size={12} className="text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!selected}
        className={clsx(
          'w-full py-3.5 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2',
          selected
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
        )}
      >
        {selected
          ? `${INDUSTRIES.find(i => i.id === selected)?.name} 홈페이지 AI 생성 시작`
          : '업종을 선택해 주세요'}
        {selected && <Wand2 size={15} />}
      </button>
    </div>
  );
}

/* ─── Step 3: AI 생성 중 ──────────────────────────────── */
function Step3Generating({
  industry, bizName, onDone,
}: {
  industry: Industry;
  bizName: string;
  onDone: () => void;
}) {
  const [doneCount, setDoneCount] = useState(-1);

  const proceed = useCallback(() => onDone(), [onDone]);

  useEffect(() => {
    const timers = GENERATION_TASKS.map((task, i) =>
      window.setTimeout(() => {
        setDoneCount(i);
        if (i === GENERATION_TASKS.length - 1) {
          window.setTimeout(proceed, 900);
        }
      }, task.ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [proceed]);

  const progress = Math.round(((doneCount + 1) / GENERATION_TASKS.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center pt-2">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200">
            <Wand2 size={28} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <Loader2 size={13} className="text-white animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">AI가 홈페이지를 만들고 있어요</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            <span className="font-semibold text-amber-700">{bizName || '내 업체'}</span>에 맞게 자동 구성 중입니다
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-stone-500">
          <span>진행률</span>
          <span className="font-bold text-amber-600">{progress}%</span>
        </div>
        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {GENERATION_TASKS.map((task, i) => {
          const done = i <= doneCount;
          const active = i === doneCount + 1;
          return (
            <div
              key={task.label}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300',
                done ? 'bg-emerald-50' : active ? 'bg-amber-50' : 'bg-stone-50'
              )}
            >
              <div className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                done ? 'bg-emerald-500' : active ? 'bg-amber-200' : 'bg-stone-100'
              )}>
                {done
                  ? <Check size={11} className="text-white" />
                  : active
                  ? <Loader2 size={11} className="text-amber-600 animate-spin" />
                  : null}
              </div>
              <span className={clsx(
                'text-sm transition-colors',
                done ? 'text-emerald-700 font-medium' : active ? 'text-amber-700 font-semibold' : 'text-stone-400'
              )}>
                {task.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Domain preview */}
      <div className="bg-stone-900 text-stone-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-mono">
        <Globe size={12} className="text-emerald-400 shrink-0" />
        <span>{bizName ? bizName.replace(/\s/g, '').toLowerCase() : 'mybiz'}.aizet.co.kr</span>
        <span className="ml-auto text-emerald-400 font-sans font-semibold">생성 중...</span>
      </div>
    </div>
  );
}

// ── Google Drive SVG (inline, no file import) ───────────────────────────────
function DriveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

// ── Google Drive Connect Card (shown in Step 4) ───────────────────────────────
function GoogleDriveConnectCard({ email }: { email: string }) {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'done'>('idle');
  const [driveState, setDriveState] = useState<DriveState | null>(null);

  // Auto-trigger connection after a short delay to simulate default 15GB
  useEffect(() => {
    const existing = getDriveState();
    if (existing?.connected) { setDriveState(existing); setPhase('done'); return; }
    const t = setTimeout(() => {
      setPhase('connecting');
      setTimeout(() => {
        const state = connectDrive(email || 'user@gmail.com', 'basic');
        setDriveState(state);
        setPhase('done');
      }, 2000);
    }, 800);
    return () => clearTimeout(t);
  }, [email]);

  if (phase === 'idle') return null;

  if (phase === 'connecting') {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
          <DriveIcon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-stone-800">구글 드라이브 연동 중...</p>
          <p className="text-xs text-stone-400 mt-0.5">15 GB 무료 저장공간 연결 중입니다</p>
        </div>
        <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <DriveIcon size={18} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={10} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-stone-800">구글 드라이브 연동 완료</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">15 GB 무료</span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">{driveState?.email}</p>
          <p className="text-[10px] text-stone-500 mt-1.5 flex items-center gap-1">
            <Cloud size={9} />
            파일 관리 페이지에서 저장 위치를 선택할 수 있습니다
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
        <p className="text-[10px] text-stone-400 flex items-center gap-1">
          <Crown size={9} className="text-amber-500" />
          프로/비즈니스 플랜에서 Google One 2 TB 업그레이드 가능
        </p>
        <span className="text-[10px] text-emerald-600 font-semibold">연동됨 ✓</span>
      </div>
    </div>
  );
}

/* ─── Step 4: 완성 ────────────────────────────────────── */
function Step4Done({ industry, bizName, email }: { industry: Industry; bizName: string; email: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const slug = bizName.replace(/\s/g, '').toLowerCase() || 'mybiz';

  return (
    <div className={clsx('flex flex-col gap-6 transition-all duration-500', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
      {/* Success badge */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
          <Check size={30} className="text-white" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">홈페이지 완성!</h2>
          <p className="text-stone-500 text-sm mt-1">
            <span className="font-semibold text-stone-800">{bizName || '내 업체'}</span>의 스마트 홈페이지가 준비됐습니다
          </p>
        </div>
      </div>

      {/* Browser mockup */}
      <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-md">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 border-b border-stone-100">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 bg-white rounded px-2.5 py-1 text-[11px] text-stone-500 border border-stone-200 mx-2 font-mono">
            {slug}.aizet.co.kr
          </div>
        </div>

        {/* Site header */}
        <div className={clsx('p-5 bg-gradient-to-r', industry.headerGradient)}>
          <div className="flex items-center gap-2 mb-3">
            <div className={clsx('w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center', industry.iconColor)}>
              <div className="text-white">{industry.icon}</div>
            </div>
            <span className="text-white font-bold text-sm">{bizName || '내 업체'}</span>
          </div>
          <h3 className="text-white font-bold text-base mb-0.5">
            {bizName ? `${bizName}에 오신 것을 환영합니다` : '홈페이지 제목'}
          </h3>
          <p className="text-white/70 text-xs mb-3">{industry.name} · AI로 완성된 홈페이지</p>
          <div className="flex gap-2">
            <span className="bg-white text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg">{industry.cta}</span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">더 알아보기</span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="p-4 bg-white flex flex-wrap gap-2">
          {[
            { icon: <Calendar size={11} />, label: '예약' },
            { icon: <CreditCard size={11} />, label: '결제' },
            { icon: <Bot size={11} />, label: 'AI 어시스턴트' },
            { icon: <BarChart3 size={11} />, label: '매출 분석' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1 bg-stone-50 border border-stone-100 text-stone-600 text-[11px] px-2 py-1 rounded-lg font-medium">
              {icon}{label}
            </span>
          ))}
        </div>
      </div>

      {/* Google Drive connect (auto-triggered) */}
      <GoogleDriveConnectCard email={email} />

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push('/demo')}
          className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          내 홈페이지 바로가기
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => router.push('/admin')}
          className="w-full py-3 border-2 border-stone-200 hover:border-stone-300 text-stone-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <BarChart3 size={15} className="text-amber-600" />
          관리자 대시보드 열기
        </button>
      </div>

      {/* Share url */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-2 text-xs">
        <Globe size={13} className="text-stone-400 shrink-0" />
        <span className="text-stone-500 font-mono flex-1 truncate">{slug}.aizet.co.kr</span>
        <button className="text-amber-600 font-semibold hover:underline shrink-0">복사</button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({ bizName: '', email: '', password: '', agreed: false });
  const [industryId, setIndustryId] = useState('');

  const industry = INDUSTRIES.find((i) => i.id === industryId) ?? INDUSTRIES[0];

  const cardWidth = step === 2 ? 'max-w-xl' : 'max-w-md';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex flex-col">
      {/* Top nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={13} className="text-white" />
          </div>
          <span className="font-bold text-stone-900 text-base tracking-tight">AIZET</span>
        </Link>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
          ← 홈으로
        </Link>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={clsx('w-full bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 transition-all duration-300', cardWidth)}>
          {step < 4 && <StepIndicator current={step} />}

          {step === 1 && (
            <Step1Info form={form} setForm={setForm} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2Industry
              selected={industryId}
              onSelect={setIndustryId}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Generating
              industry={industry}
              bizName={form.bizName}
              onDone={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4Done industry={industry} bizName={form.bizName} email={form.email} />
          )}
        </div>
      </div>
    </div>
  );
}
