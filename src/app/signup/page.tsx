'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed, Coffee, Scissors, HeartPulse, Dumbbell,
  Building2, ShoppingBag, GraduationCap, BedDouble, Car,
  PawPrint, Briefcase,
  Check, ChevronRight, Loader2, Wand2, Crown, HardDrive,
  Shield, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────── */
type Step = 1 | 2 | 3;
type PlanId = 'free' | 'pro' | 'business';

interface Industry {
  id: string;
  icon: React.ReactNode;
  name: string;
  sub: string;
  iconColor: string;
  iconBg: string;
  features: string[];
}

/* ─── Industry data ──────────────────────────────────────── */
const INDUSTRIES: Industry[] = [
  { id: 'restaurant', icon: <UtensilsCrossed size={20} />, name: '식당', sub: '한식·양식·중식·일식', iconColor: 'text-amber-700', iconBg: 'bg-amber-100', features: ['AI 메뉴 추천', '테이블 주문', '서빙 로봇 연동', '결제 시스템'] },
  { id: 'cafe', icon: <Coffee size={20} />, name: '카페·베이커리', sub: '커피·디저트·브런치', iconColor: 'text-orange-700', iconBg: 'bg-orange-100', features: ['메뉴 쇼케이스', '포인트 적립', '픽업 예약', '시즌 메뉴'] },
  { id: 'beauty', icon: <Scissors size={20} />, name: '미용실·헤어샵', sub: '헤어·네일·뷰티', iconColor: 'text-pink-700', iconBg: 'bg-pink-100', features: ['실시간 예약', '스타일 포트폴리오', '리마인더 알림', '리뷰 관리'] },
  { id: 'clinic', icon: <HeartPulse size={20} />, name: '병원·의원', sub: '내과·피부과·한의원', iconColor: 'text-red-700', iconBg: 'bg-red-100', features: ['진료 예약', '의료진 소개', '비급여 안내', '오시는 길'] },
  { id: 'fitness', icon: <Dumbbell size={20} />, name: '헬스·필라테스', sub: '헬스장·요가·PT', iconColor: 'text-violet-700', iconBg: 'bg-violet-100', features: ['수업 일정', '회원권 결제', '트레이너 소개', '출석 관리'] },
  { id: 'legal', icon: <Building2 size={20} />, name: '법무사·세무사', sub: '법무·세무·회계', iconColor: 'text-blue-700', iconBg: 'bg-blue-100', features: ['온라인 상담 예약', '서비스 안내', '사례 소개', '뉴스레터'] },
  { id: 'retail', icon: <ShoppingBag size={20} />, name: '소매·쇼핑몰', sub: '옷·잡화·선물', iconColor: 'text-emerald-700', iconBg: 'bg-emerald-100', features: ['상품 카탈로그', '장바구니', '프로모션', '재고 관리'] },
  { id: 'education', icon: <GraduationCap size={20} />, name: '교육·학원', sub: '학원·과외·온라인', iconColor: 'text-indigo-700', iconBg: 'bg-indigo-100', features: ['수업 일정', '강사 소개', '수강 신청', '학습 관리'] },
  { id: 'hotel', icon: <BedDouble size={20} />, name: '숙박·펜션', sub: '호텔·게스트하우스', iconColor: 'text-teal-700', iconBg: 'bg-teal-100', features: ['객실 예약', '요금 안내', '포토 갤러리', '리뷰'] },
  { id: 'auto', icon: <Car size={20} />, name: '자동차·정비', sub: '세차·정비·렌트', iconColor: 'text-slate-700', iconBg: 'bg-slate-100', features: ['정비 예약', '서비스 안내', '견적 문의', '위치 안내'] },
  { id: 'pet', icon: <PawPrint size={20} />, name: '반려동물', sub: '미용·동물병원·호텔', iconColor: 'text-yellow-700', iconBg: 'bg-yellow-100', features: ['예약 시스템', '반려동물 등록', '건강 기록', '포트폴리오'] },
  { id: 'consulting', icon: <Briefcase size={20} />, name: '컨설팅·전문직', sub: '경영·IT·마케팅', iconColor: 'text-stone-700', iconBg: 'bg-stone-100', features: ['서비스 소개', '포트폴리오', '상담 예약', '뉴스레터'] },
];

/* ─── Plan data ──────────────────────────────────────────── */
interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  storage: string;
  storageNote: string;
  features: string[];
  highlight: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: '무료',
    price: '₩0',
    period: '영구 무료',
    storage: '구글 기본 15 GB',
    storageNote: '내 구글 계정 용량 그대로 사용',
    features: ['AI 홈페이지 1개', '예약·메뉴 기본 기능', '월 100건 예약', 'MySpace 개인 공간', '구글 드라이브 15 GB'],
    highlight: false,
  },
  {
    id: 'pro',
    name: '프로',
    price: '₩29,000',
    period: '/월',
    storage: '15 GB + 2 TB 안내',
    storageNote: 'Google One 2 TB 업그레이드 방법 제공',
    features: ['AI 홈페이지 3개', '고급 예약·결제 시스템', '월 1,000건 예약', '슈퍼에디터', 'AZOS 대시보드', 'Google One 2 TB 안내'],
    highlight: true,
    badge: '인기',
  },
  {
    id: 'business',
    name: '비즈니스',
    price: '₩79,000',
    period: '/월',
    storage: '2 TB (Google One Premium)',
    storageNote: 'Google One 2 TB 요금제 연동 안내 포함',
    features: ['무제한 홈페이지', '팀원 5명', 'AZOS 클러스터 관리', '전담 지원', '2 TB 드라이브 안내'],
    highlight: false,
    badge: '엔터프라이즈',
  },
];

/* ─── Google Icon ────────────────────────────────────────── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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

/* ─── StepIndicator ──────────────────────────────────────── */
const STEP_LABELS = ['업종 선택', '플랜 선택', 'Google 로그인'];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center w-full max-w-xs mx-auto mb-8">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                done ? 'bg-emerald-500 text-white' : active ? 'bg-amber-600 text-white ring-4 ring-amber-100' : 'bg-stone-100 text-stone-400'
              )}>
                {done ? <Check size={14} /> : stepNum}
              </div>
              <span className={clsx(
                'text-[10px] font-medium whitespace-nowrap',
                active ? 'text-amber-600' : done ? 'text-emerald-600' : 'text-stone-400'
              )}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-1 mb-4 rounded transition-colors duration-500', done ? 'bg-emerald-300' : 'bg-stone-100')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: 업종 선택 ──────────────────────────────────── */
function StepIndustry({ selected, onSelect, onNext }: {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const industry = INDUSTRIES.find(i => i.id === selected);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">업종을 선택하세요</h1>
        <p className="text-stone-500 text-sm mt-1">업종에 맞는 AI 홈페이지를 자동으로 구성합니다</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {INDUSTRIES.map(ind => (
          <button
            key={ind.id}
            onClick={() => onSelect(ind.id)}
            className={clsx(
              'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center',
              selected === ind.id
                ? 'border-amber-500 bg-amber-50 shadow-sm shadow-amber-100'
                : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50'
            )}
          >
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', ind.iconBg, ind.iconColor)}>
              {ind.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800 leading-tight">{ind.name}</p>
              <p className="text-[10px] text-stone-400 leading-tight mt-0.5">{ind.sub}</p>
            </div>
            {selected === ind.id && (
              <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Check size={9} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {industry && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">포함 기능</p>
          <div className="grid grid-cols-2 gap-1.5">
            {industry.features.map(f => (
              <div key={f} className="flex items-center gap-1.5 text-sm text-stone-700">
                <Check size={12} className="text-emerald-500 shrink-0" />{f}
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
          selected ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
        )}
      >
        {selected ? `${INDUSTRIES.find(i => i.id === selected)?.name} 선택 완료` : '업종을 선택해 주세요'}
        {selected && <ChevronRight size={16} />}
      </button>
    </div>
  );
}

/* ─── Step 2: 플랜 선택 ──────────────────────────────────── */
function StepPlan({ selected, onSelect, onNext, onBack }: {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">플랜을 선택하세요</h1>
        <p className="text-stone-500 text-sm mt-1">구글 드라이브 저장 용량은 플랜에 따라 안내가 달라집니다</p>
      </div>

      <div className="flex flex-col gap-3">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={clsx(
              'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
              selected === plan.id
                ? plan.highlight
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-stone-400 bg-stone-50'
                : 'border-stone-200 hover:border-stone-300'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  plan.id === 'free' ? 'bg-stone-100' : plan.id === 'pro' ? 'bg-amber-100' : 'bg-violet-100'
                )}>
                  {plan.id === 'free' ? <Shield size={15} className="text-stone-600" /> :
                   plan.id === 'pro' ? <Zap size={15} className="text-amber-600" /> :
                   <Crown size={15} className="text-violet-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-stone-900">{plan.name}</p>
                    {plan.badge && (
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        plan.id === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                      )}>{plan.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">{plan.period}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-stone-900">{plan.price}</p>
              </div>
            </div>

            {/* Drive storage */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
              <DriveIcon size={14} />
              <div>
                <p className="text-xs font-bold text-blue-800">{plan.storage}</p>
                <p className="text-[10px] text-blue-500">{plan.storageNote}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {plan.features.slice(0, 4).map(f => (
                <div key={f} className="flex items-center gap-1 text-[11px] text-stone-600">
                  <Check size={10} className="text-emerald-500 shrink-0" />{f}
                </div>
              ))}
            </div>

            {selected === plan.id && (
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                <Check size={11} /> 선택됨
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="px-4 py-3 rounded-xl border-2 border-stone-200 text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors">
          이전
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {PLANS.find(p => p.id === selected)?.name} 플랜으로 계속
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Google 로그인 ──────────────────────────────── */
function StepGoogle({ industryId, plan, onBack }: {
  industryId: string;
  plan: PlanId;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const planInfo = PLANS.find(p => p.id === plan)!;
  const industryInfo = INDUSTRIES.find(i => i.id === industryId);

  function handleLogin() {
    setLoading(true);
    const params = new URLSearchParams({
      industry: industryId,
      plan,
      callbackUrl: '/admin',
    });
    window.location.href = `/api/auth/google?${params}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">구글 계정으로 시작하기</h1>
        <p className="text-stone-500 text-sm mt-1">
          회원가입과 로그인이 동시에 진행됩니다
        </p>
      </div>

      {/* Summary */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">선택 요약</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">업종</span>
          <span className="font-semibold text-stone-800">{industryInfo?.name ?? industryId}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">플랜</span>
          <span className="font-semibold text-stone-800">{planInfo.name} ({planInfo.price}{planInfo.period !== '영구 무료' ? planInfo.period : ''})</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">드라이브</span>
          <div className="flex items-center gap-1">
            <DriveIcon size={12} />
            <span className="font-semibold text-stone-800">{planInfo.storage}</span>
          </div>
        </div>
      </div>

      {/* Drive permission notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <DriveIcon size={20} />
        <div>
          <p className="text-sm font-bold text-blue-900">구글 드라이브 권한 요청</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            동의 화면에서 <strong>Google Drive 파일 접근</strong> 권한을 함께 요청합니다.
            이 앱이 만든 파일에만 접근하며, 기존 파일은 볼 수 없습니다.
          </p>
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-4 bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60 rounded-2xl font-bold text-stone-800 transition-colors flex items-center justify-center gap-3 shadow-sm"
      >
        {loading
          ? <><Loader2 size={20} className="animate-spin text-stone-400" /> 구글로 이동 중...</>
          : <><GoogleIcon size={20} /> Google 계정으로 계속하기</>
        }
      </button>

      <p className="text-center text-xs text-stone-400 leading-relaxed">
        계속하면 AIZET{' '}
        <Link href="#" className="text-amber-600 hover:underline">이용약관</Link>과{' '}
        <Link href="#" className="text-amber-600 hover:underline">개인정보처리방침</Link>에 동의한 것으로 간주됩니다.
      </p>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border-2 border-stone-200 text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors">
          이전 — 플랜 변경
        </button>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-xs text-stone-400">이미 계정이 있으신가요?</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>
      <Link
        href="/login"
        className="w-full py-3 text-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
      >
        로그인
      </Link>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [industryId, setIndustryId] = useState('');
  const [plan, setPlan] = useState<PlanId>('free');

  const isWide = step === 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={13} className="text-white" />
          </div>
          <span className="font-bold text-stone-900 text-base tracking-tight">AIZET</span>
        </Link>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">← 홈으로</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={clsx(
          'w-full bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 transition-all duration-300',
          isWide ? 'max-w-xl' : 'max-w-md'
        )}>
          <StepIndicator current={step} />

          {step === 1 && (
            <StepIndustry
              selected={industryId}
              onSelect={setIndustryId}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepPlan
              selected={plan}
              onSelect={setPlan}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepGoogle
              industryId={industryId}
              plan={plan}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
