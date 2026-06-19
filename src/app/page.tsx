'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Zap,
  Globe,
  Smartphone,
  BarChart3,
  Calendar,
  CreditCard,
  Bot,
  Star,
  UtensilsCrossed,
  Scissors,
  HeartPulse,
  Dumbbell,
  Building2,
  ShoppingBag,
  Menu,
  X,
  Wand2,
  Sparkles,
  ChevronRight,
  Play,
  Package,
  BookOpen,
  Copy,
  LayoutDashboard,
  Printer,
  Server,
  Cpu,
  BatteryFull,
  Thermometer,
  Shield,
  Leaf,
} from 'lucide-react';

/* ─── Industry types & data ───────────────────────────── */
interface IndustryItem {
  icon: React.ReactNode;
  name: string;
  color: string;
  sub: string;
  gradient: string;
  mockupTitle: string;
  mockupSub: string;
  cta: string;
  features: string[];
  href?: string;
}

const INDUSTRIES_LIST: IndustryItem[] = [
  {
    icon: <UtensilsCrossed size={22} />,
    name: '식당·카페',
    color: 'bg-amber-100 text-amber-700',
    sub: '메뉴·예약·주문·로봇 서빙',
    gradient: 'from-amber-600 to-amber-800',
    mockupTitle: '맛있는 한식당',
    mockupSub: '서울 마포구 · 매일 11:00–22:00',
    cta: '지금 주문',
    features: ['AI 메뉴 추천', '테이블 QR 주문', '서빙 로봇 연동', '간편 결제', '예약 관리', '실시간 매출'],
  },
  {
    icon: <Scissors size={22} />,
    name: '미용실·헤어샵',
    color: 'bg-pink-100 text-pink-700',
    sub: '예약·포트폴리오·리뷰',
    gradient: 'from-pink-600 to-rose-700',
    mockupTitle: 'Style One 헤어샵',
    mockupSub: '강남구 논현동 · 10:00–20:00',
    cta: '예약하기',
    features: ['실시간 예약', '스타일 포트폴리오', '리마인더 알림', '리뷰 관리', '직원별 일정', 'SNS 연동'],
  },
  {
    icon: <HeartPulse size={22} />,
    name: '병원·한의원',
    color: 'bg-red-100 text-red-700',
    sub: '진료 예약·상담·안내',
    gradient: 'from-red-600 to-red-800',
    mockupTitle: '건강 내과의원',
    mockupSub: '종로구 · 평일 09:00–18:00',
    cta: '진료 예약',
    features: ['진료 예약', '의료진 소개', '비급여 안내', '오시는 길', '온라인 상담', '진료 과목'],
  },
  {
    icon: <Building2 size={22} />,
    name: '법무사·세무사',
    color: 'bg-blue-100 text-blue-700',
    sub: '상담 예약·서비스 안내',
    gradient: 'from-blue-600 to-blue-900',
    mockupTitle: '김민준 법무사 사무소',
    mockupSub: '서초구 · 평일 09:00–18:00',
    cta: '상담 예약',
    features: ['온라인 상담 예약', '서비스 안내', '사례 소개', '자료 다운로드', '뉴스레터', '카카오 상담'],
  },
  {
    icon: <Dumbbell size={22} />,
    name: '헬스·필라테스',
    color: 'bg-violet-100 text-violet-700',
    sub: '수업 등록·스케줄·결제',
    gradient: 'from-violet-600 to-purple-800',
    mockupTitle: 'FitCore 필라테스',
    mockupSub: '해운대구 · 06:00–22:00',
    cta: '등록하기',
    features: ['수업 일정 관리', '회원권 결제', '트레이너 소개', '출석 체크', '온라인 예약', '프로그램 안내'],
  },
  {
    icon: <Package size={22} />,
    name: '숙박·펜션',
    color: 'bg-teal-100 text-teal-700',
    sub: '객실 예약·가격·후기',
    gradient: 'from-teal-600 to-teal-800',
    mockupTitle: '하늘정원 펜션',
    mockupSub: '강원도 춘천시 · 체크인 15:00',
    cta: '객실 예약',
    features: ['실시간 객실 예약', '가격 달력', '주변 관광지', '패키지 상품', '후기 시스템', '결제 연동'],
  },
  {
    icon: <ShoppingBag size={22} />,
    name: '의류·쇼핑',
    color: 'bg-orange-100 text-orange-700',
    sub: '상품 진열·결제·배송',
    gradient: 'from-orange-500 to-orange-700',
    mockupTitle: 'Mode Fashion',
    mockupSub: '홍대입구 · 패션·잡화 편집샵',
    cta: '쇼핑하기',
    features: ['상품 진열 관리', '장바구니·결제', '배송 추적', '회원 할인', '재고 관리', '쿠폰 발급'],
  },
  {
    icon: <Printer size={22} />,
    name: '인쇄·출력',
    color: 'bg-blue-100 text-blue-700',
    sub: '견적·파일업로드·제작현황',
    gradient: 'from-blue-600 to-indigo-800',
    mockupTitle: 'AIZET 인쇄소',
    mockupSub: '명함·전단·책자·배너·스티커·패키지',
    cta: '견적 받기',
    features: ['상품 카탈로그', '실시간 견적 계산기', '파일 업로드·검수', 'AI 인쇄 상담', '제작 단계 추적', '관리자 대시보드'],
  },
  {
    icon: <BookOpen size={22} />,
    name: '한국어 교육',
    color: 'bg-indigo-100 text-indigo-700',
    sub: '레벨테스트·학습·AI 회화',
    gradient: 'from-indigo-600 to-violet-700',
    mockupTitle: '한국어 배우기',
    mockupSub: '영어·중국어·일본어·베트남어 지원',
    cta: '학습 시작',
    features: ['AI 레벨 진단', '4개국어 학습 콘텐츠', 'AI 회화 챗봇', '발음·문법 피드백', '학습자 진도 대시보드', '관리자 통계'],
  },
  {
    icon: <Leaf size={22} />,
    name: '건강식품 쇼핑몰',
    color: 'bg-green-100 text-green-700',
    sub: '제품 카탈로그·AI 상담·결제',
    gradient: 'from-green-600 to-emerald-700',
    mockupTitle: 'HanCandy 한캔디',
    mockupSub: '무설탕 건강기능성 캔디 브랜드',
    cta: '쇼핑하기',
    features: ['제품 카탈로그', '영양 정보 상세페이지', '장바구니·결제', 'AI 상담 챗봇', '효능별 필터', '관리자 대시보드'],
    href: '/hancandy',
  },
  {
    icon: <Globe size={22} />,
    name: '그 외 100+ 업종',
    color: 'bg-stone-100 text-stone-600',
    sub: '모든 업종 지원',
    gradient: 'from-stone-600 to-stone-800',
    mockupTitle: '내 업체 홈페이지',
    mockupSub: 'AI가 업종에 맞게 자동 구성',
    cta: '알아보기',
    features: ['AI 맞춤 구성', '업종별 특화 기능', '자유로운 커스텀', '전담 온보딩', '24/7 지원', '무제한 수정'],
  },
];

/* ─── Industry Modal ──────────────────────────────────── */
function IndustryModal({ industry, onClose }: { industry: IndustryItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header / mockup preview */}
        <div className={`bg-gradient-to-r ${industry.gradient} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                {industry.icon}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{industry.mockupTitle}</p>
                <p className="text-white/60 text-[11px] mt-0.5">{industry.mockupSub}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Mock browser bar */}
          <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
            </div>
            <span className="text-white/50 text-[10px] font-mono ml-1">mybiz.aizet.co.kr</span>
          </div>

          <div className="flex gap-2">
            <span className="bg-white text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg">
              {industry.cta}
            </span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              더 알아보기
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <div className={`inline-flex items-center gap-1.5 ${industry.color} text-xs font-semibold px-2.5 py-1 rounded-full mb-2`}>
              {industry.name}
            </div>
            <p className="text-stone-500 text-sm leading-relaxed">
              {industry.sub} 기능이 포함된 스마트 홈페이지를 AI가 자동으로 만들어 드립니다.
            </p>
          </div>

          {/* Features grid */}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">포함 기능</p>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
              {industry.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-stone-700">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/signup"
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            이 업종으로 무료 시작
            <ArrowRight size={15} />
          </Link>
          <p className="text-center text-xs text-stone-400 -mt-2">신용카드 불필요 · 5분 완성</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={15} className="text-white" />
          </div>
          <span className="font-bold text-stone-900 text-lg tracking-tight">AIZET</span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-500">
          <a href="#features" className="hover:text-stone-900 transition-colors">기능</a>
          <a href="#industries" className="hover:text-stone-900 transition-colors">업종</a>
          <a href="#pricing" className="hover:text-stone-900 transition-colors">요금제</a>
          <a href="#demo" className="hover:text-stone-900 transition-colors">데모</a>
          <Link href="/prompts" className="flex items-center gap-1.5 hover:text-amber-600 transition-colors">
            <BookOpen size={14} />
            프롬프트
          </Link>
          <Link href="/admin" className="flex items-center gap-1.5 hover:text-amber-600 transition-colors">
            <LayoutDashboard size={14} />
            대시보드
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-3 py-1.5"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            무료 시작
          </Link>
        </div>

        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 flex flex-col gap-3">
          {['기능', '업종', '요금제', '데모'].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-stone-600 py-2"
            >
              {item}
            </a>
          ))}
          <Link
            href="/prompts"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm font-medium text-amber-600 py-2"
          >
            <BookOpen size={14} />
            프롬프트 라이브러리
          </Link>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm font-medium text-stone-600 py-2"
          >
            <LayoutDashboard size={14} />
            AZOS 대시보드
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-stone-600 py-2"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-1 text-sm font-semibold bg-amber-600 text-white px-4 py-3 rounded-lg text-center"
          >
            무료로 시작하기
          </Link>
        </div>
      )}
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-amber-50/60 via-white to-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Text */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full self-center lg:self-start border border-amber-200">
              <Sparkles size={12} />
              AI 홈페이지 자동 생성 플랫폼
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight tracking-tight">
              내 가게 홈페이지,
              <br />
              <span className="text-amber-600">AI가 5분 만에</span> 완성
            </h1>

            <p className="text-stone-500 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              업종만 선택하면 예약·주문·결제까지 갖춘
              스마트 홈페이지를 자동으로 만들어 드립니다.
              코딩 지식 없이도 바로 오픈.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-amber-200"
              >
                무료로 시작하기
                <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="flex items-center justify-center gap-2 border border-stone-200 text-stone-700 hover:border-stone-400 font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
              >
                <Play size={14} className="text-amber-600" />
                라이브 데모 보기
              </a>
            </div>

            <div className="flex items-center gap-5 justify-center lg:justify-start text-xs text-stone-400">
              {['신용카드 불필요', '5분 내 완성', '언제든 취소 가능'].map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mock browser window */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-400/10 rounded-3xl blur-2xl" />

              <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-stone-400 border border-stone-200 ml-2">
                    my-restaurant.aizet.co.kr
                  </div>
                </div>

                <div className="bg-gradient-to-b from-amber-600 to-amber-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed size={13} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">맛있는 한식당</span>
                  </div>
                  <h2 className="text-white text-lg font-bold mb-1">정성 가득한 한식</h2>
                  <p className="text-amber-200 text-xs mb-4">서울 마포구 · 매일 11:00–22:00</p>
                  <div className="flex gap-2">
                    <div className="bg-white text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg">메뉴 보기</div>
                    <div className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg">예약하기</div>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    {[
                      { name: '갈비탕', price: '₩14,000', tag: '인기' },
                      { name: '비빔밥', price: '₩11,000', tag: 'NEW' },
                    ].map((item) => (
                      <div key={item.name} className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <div className="w-full h-14 bg-stone-200 rounded-lg mb-2" />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-stone-800">{item.name}</p>
                            <p className="text-xs text-amber-700 font-bold">{item.price}</p>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <Bot size={14} className="text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">AI 주문 도우미 · 서빙 로봇 연동</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 top-16 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 flex items-center gap-2">
                <Zap size={13} className="text-amber-500" />
                <span className="text-xs font-semibold text-stone-700">AI 생성 완료</span>
              </div>
              <div className="absolute -left-3 bottom-16 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 flex items-center gap-2">
                <BarChart3 size={13} className="text-emerald-500" />
                <span className="text-xs font-semibold text-stone-700">오늘 매출 +23%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ───────────────────────────────────────────── */
function Stats() {
  const items = [
    { value: '2,400+', label: '사용 중인 업체' },
    { value: '5분', label: '평균 사이트 완성 시간' },
    { value: '98%', label: '고객 만족도' },
    { value: '0원', label: '초기 비용' },
  ];
  return (
    <section className="py-12 border-y border-stone-100 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-amber-600">{value}</p>
              <p className="text-sm text-stone-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <Sparkles size={22} className="text-amber-600" />,
      title: '회원가입 (30초)',
      desc: '이메일 하나로 시작합니다. 신용카드 없이도 무료로 바로 사용할 수 있습니다.',
    },
    {
      num: '02',
      icon: <Building2 size={22} className="text-blue-600" />,
      title: '업종 선택',
      desc: '식당, 카페, 미용실, 병원 등 100개 이상 업종 중 내 업체에 맞는 유형을 선택합니다.',
    },
    {
      num: '03',
      icon: <Wand2 size={22} className="text-emerald-600" />,
      title: 'AI 자동 완성',
      desc: '디자인, 메뉴/서비스, 예약, 결제까지 AI가 자동으로 완성된 홈페이지를 만들어 드립니다.',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-stone-900">단 세 단계로 완성</h2>
          <p className="text-stone-500 mt-3 max-w-md mx-auto">복잡한 설정 없이 누구나 5분 안에 완성도 높은 홈페이지를 오픈할 수 있습니다.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-2xl p-7 shadow-sm border border-stone-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-stone-100">{step.num}</span>
              </div>
              <h3 className="font-bold text-stone-900 text-lg">{step.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
              {i < 2 && (
                <ChevronRight
                  size={20}
                  className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-300"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Industries ──────────────────────────────────────── */
function Industries() {
  const [selected, setSelected] = useState<IndustryItem | null>(null);

  return (
    <section id="industries" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Industries</p>
          <h2 className="text-3xl font-bold text-stone-900">어떤 업종이든 바로 시작</h2>
          <p className="text-stone-500 mt-3 max-w-md mx-auto">
            각 업종에 특화된 기능과 디자인이 자동으로 적용됩니다.{' '}
            <span className="text-amber-600 font-medium">카드를 클릭하면 미리보기를 확인할 수 있어요.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {INDUSTRIES_LIST.map((ind) => {
            const cardClass = "group bg-white border border-stone-100 rounded-2xl p-5 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer flex flex-col gap-3 text-left";
            const inner = (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ind.color}`}>
                  {ind.icon}
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{ind.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{ind.sub}</p>
                </div>
                <ChevronRight size={14} className="text-stone-300 group-hover:text-amber-500 transition-colors" />
              </>
            );
            return ind.href ? (
              <Link key={ind.name} href={ind.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <button key={ind.name} onClick={() => setSelected(ind)} className={cardClass}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {selected && <IndustryModal industry={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

/* ─── Features ────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: <Calendar size={20} className="text-amber-600" />,
      title: 'AI 예약 시스템',
      desc: '고객이 24시간 직접 예약. 자동 알림·리마인더 발송으로 노쇼를 줄입니다.',
      bg: 'bg-amber-50',
    },
    {
      icon: <CreditCard size={20} className="text-blue-600" />,
      title: '간편 결제',
      desc: '카드·카카오페이·네이버페이를 한 번에. 정산은 익일 자동 입금됩니다.',
      bg: 'bg-blue-50',
    },
    {
      icon: <Bot size={20} className="text-emerald-600" />,
      title: 'AI 주문·서빙 로봇',
      desc: 'AI 챗봇이 주문을 받고 서빙 로봇이 음식을 전달합니다. 완전한 자동화.',
      bg: 'bg-emerald-50',
    },
    {
      icon: <Smartphone size={20} className="text-violet-600" />,
      title: '모바일 완벽 대응',
      desc: '스마트폰으로 봐도 PC로 봐도 완벽한 화면. 별도 앱 개발 불필요.',
      bg: 'bg-violet-50',
    },
    {
      icon: <BarChart3 size={20} className="text-rose-600" />,
      title: '실시간 매출 분석',
      desc: '방문자, 예약, 매출 통계를 한눈에. AI가 인기 메뉴와 피크 타임을 알려드립니다.',
      bg: 'bg-rose-50',
    },
    {
      icon: <Globe size={20} className="text-teal-600" />,
      title: '자동 SEO 최적화',
      desc: '네이버·구글 검색 상위 노출을 위한 SEO가 자동으로 설정됩니다.',
      bg: 'bg-teal-50',
    },
  ];

  return (
    <section className="py-20 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl font-bold text-stone-900">필요한 기능, 전부 포함</h2>
          <p className="text-stone-500 mt-3 max-w-md mx-auto">비싼 플러그인 없이 모든 스마트 기능이 기본 탑재됩니다.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc, bg }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-stone-900">{title}</h3>
                <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard CTA ───────────────────────────────────── */
function DashboardCTA() {
  const metrics = [
    { label: '오늘 매출', value: '₩1,240,000', change: '+18%', color: 'text-emerald-400' },
    { label: '신규 주문', value: '47건', change: '+12건', color: 'text-blue-400' },
    { label: '예약 건수', value: '23건', change: '내일 8건', color: 'text-violet-400' },
  ];

  const bars = [40, 65, 45, 80, 55, 92, 75];

  return (
    <section className="py-20 px-4 bg-stone-900 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Text */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full self-center lg:self-start border border-amber-500/30">
              <LayoutDashboard size={12} />
              AZOS 대시보드
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              매출·주문·예약을
              <br />
              <span className="text-amber-400">한 화면</span>에서 관리
            </h2>
            <p className="text-stone-400 text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              AI가 실시간으로 분석한 통계와 인사이트로
              더 스마트하게 업체를 운영하세요.
              서빙 로봇·결제·예약이 하나로 연결됩니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
              >
                <LayoutDashboard size={15} />
                대시보드 체험하기
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
              >
                로그인하기
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="flex-1 w-full max-w-lg">
            <div className="bg-stone-800 rounded-2xl border border-stone-700 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-700">
                <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center">
                  <LayoutDashboard size={12} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-white">AZOS 대시보드</span>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  실시간
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3">
                  {metrics.map(({ label, value, change, color }) => (
                    <div key={label} className="bg-stone-900 rounded-xl p-3">
                      <p className="text-[10px] text-stone-500 mb-1">{label}</p>
                      <p className="text-sm font-bold text-white leading-tight">{value}</p>
                      <p className={`text-[10px] font-semibold mt-1 ${color}`}>{change}</p>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="bg-stone-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-stone-400 font-medium">주간 매출 추이</p>
                    <span className="text-xs text-emerald-400 font-semibold">+23% vs 지난주</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-14">
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i === 5 ? 'rgb(217 119 6)' : 'rgb(68 64 60)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex mt-2">
                    {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
                      <span key={d} className="text-[9px] text-stone-600 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Quick stat row */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Package size={12} />, label: '주문 47건 대기', urgent: true },
                    { icon: <Calendar size={12} />, label: '예약 23건', urgent: false },
                    { icon: <Bot size={12} />, label: '로봇 3대 활성', urgent: false },
                    { icon: <CreditCard size={12} />, label: '정산 D-1', urgent: false },
                  ].map(({ icon, label, urgent }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                        urgent
                          ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                          : 'bg-stone-900 text-stone-400'
                      }`}
                    >
                      {icon}
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Demo Preview ────────────────────────────────────── */
function DemoPreview() {
  return (
    <section id="demo" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="text-center mb-2">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Live Demo</p>
          <h2 className="text-3xl font-bold text-stone-900">실제 데모를 직접 체험해 보세요</h2>
          <p className="text-stone-500 mt-3 max-w-md mx-auto">AIZET가 자동 생성한 업종별 데모입니다. 모든 기능이 실제로 작동합니다.</p>
        </div>

        {/* Restaurant demo */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="flex-1 relative">
            <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest mb-2">식당·카페 데모</p>
            <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
              AI가 만든 식당 홈페이지를<br />직접 체험해 보세요
            </h3>
            <p className="text-amber-100 text-sm leading-relaxed mb-6 max-w-md">
              주문·결제·AI 챗봇·서빙 로봇까지 — 실제 식당 데모입니다.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white text-amber-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
            >
              <Play size={15} />
              식당 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">AIZET 식당</p>
                  <p className="text-[10px] text-stone-400">AI 자동 생성</p>
                </div>
              </div>
              {[
                { label: '주문 관리', color: 'bg-amber-500' },
                { label: 'AI 결제', color: 'bg-blue-500' },
                { label: '서빙 로봇', color: 'bg-emerald-500' },
                { label: '배달 추적', color: 'bg-violet-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-stone-600">{label}</span>
                  <Check size={11} className="ml-auto text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Print demo */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="flex-1 relative">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">인쇄·출력 데모</p>
            <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
              인쇄소 홈페이지를<br />직접 체험해 보세요
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 max-w-md">
              실시간 견적 계산기·AI 상담·파일 업로드·제작 현황 추적까지 — 완전한 인쇄 플랫폼 데모입니다.
            </p>
            <Link
              href="/print"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Printer size={15} />
              인쇄소 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Printer size={13} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">AIZET 인쇄소</p>
                  <p className="text-[10px] text-stone-400">AI 자동 생성</p>
                </div>
              </div>
              {[
                { label: '견적 계산기', color: 'bg-blue-500' },
                { label: 'AI 인쇄 상담', color: 'bg-indigo-500' },
                { label: '파일 업로드', color: 'bg-violet-500' },
                { label: '제작 현황 추적', color: 'bg-cyan-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-stone-600">{label}</span>
                  <Check size={11} className="ml-auto text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Korean learning demo */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="flex-1 relative">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">한국어 교육 데모</p>
            <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
              외국인을 위한 한국어 학습<br />플랫폼을 체험해 보세요
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-md">
              AI 레벨 진단·4개국어 학습·AI 회화 챗봇·진도 대시보드까지 — 완전한 한국어 교육 데모입니다.
            </p>
            <Link
              href="/korean"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <BookOpen size={15} />
              한국어 학습 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={13} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">한국어 배우기</p>
                  <p className="text-[10px] text-stone-400">🇺🇸 🇨🇳 🇯🇵 🇻🇳 지원</p>
                </div>
              </div>
              {[
                { label: 'AI 레벨 진단', color: 'bg-violet-500' },
                { label: '단계별 학습 콘텐츠', color: 'bg-indigo-500' },
                { label: 'AI 회화 챗봇', color: 'bg-blue-500' },
                { label: '진도 대시보드', color: 'bg-sky-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-stone-600">{label}</span>
                  <Check size={11} className="ml-auto text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HanCandy demo */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="flex-1 relative">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-2">건강 식품 쇼핑몰 데모</p>
            <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
              무설탕 건강 캔디 브랜드<br />한캔디를 체험해 보세요
            </h3>
            <p className="text-green-100 text-sm leading-relaxed mb-6 max-w-md">
              제품 카탈로그·장바구니·결제·AI 상담 챗봇·관리자 대시보드까지 — 완전한 건강식품 쇼핑몰 데모입니다.
            </p>
            <Link
              href="/hancandy"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              <Leaf size={15} />
              한캔디 쇼핑몰 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <Leaf size={13} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">HanCandy 한캔디</p>
                  <p className="text-[10px] text-stone-400">무설탕 건강기능성 캔디</p>
                </div>
              </div>
              {[
                { label: '제품 카탈로그', color: 'bg-green-500' },
                { label: '장바구니·결제', color: 'bg-emerald-500' },
                { label: 'AI 캔디 상담', color: 'bg-teal-500' },
                { label: '관리자 대시보드', color: 'bg-cyan-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-stone-600">{label}</span>
                  <Check size={11} className="ml-auto text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Prompt Library CTA ─────────────────────────────────── */
function PromptLibraryCTA() {
  const samples = [
    { cat: '이미지', label: '메뉴 플랫레이', tool: 'Midjourney', color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { cat: '영상', label: '시즐 홍보 영상', tool: 'Runway', color: 'bg-rose-50 border-rose-200 text-rose-800' },
    { cat: 'SNS', label: '음식 릴스 콘셉트', tool: 'Kling AI', color: 'bg-violet-50 border-violet-200 text-violet-800' },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full self-start border border-amber-200">
            <BookOpen size={12} />
            프롬프트 라이브러리
          </div>
          <h2 className="text-3xl font-bold text-stone-900 leading-tight">
            AI 마케팅 콘텐츠,
            <br />
            <span className="text-amber-600">복사 한 번</span>으로 시작
          </h2>
          <p className="text-stone-500 text-base leading-relaxed max-w-md">
            식당·카페·미용실 등 8개 업종에 맞는 이미지·영상·SNS 프롬프트를 무료로 제공합니다.
            Midjourney, DALL·E, Runway에 바로 붙여 쓰세요.
          </p>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors self-start shadow-lg shadow-amber-200"
          >
            <BookOpen size={15} />
            프롬프트 라이브러리 보기
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex-1 w-full max-w-md flex flex-col gap-3">
          {samples.map(({ cat, label, tool, color }) => (
            <div key={label} className={`flex items-center justify-between border rounded-xl px-4 py-3.5 ${color}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold opacity-60">{cat}</span>
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70">{tool}</span>
                <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                  <Copy size={12} className="opacity-60" />
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-xs text-stone-400 mt-1">
            8개 업종 · 50개 이상 프롬프트 수록
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      name: '김민준',
      role: '한식당 운영',
      location: '서울 마포구',
      text: '홈페이지 만드는 데 200만 원 견적 받고 포기했었는데, AIZET로 5분 만에 완성했어요. AI 주문 시스템 덕분에 직원 한 명 줄이고 매출은 올랐습니다.',
      stars: 5,
    },
    {
      name: '이수진',
      role: '헤어샵 원장',
      location: '경기 성남시',
      text: '예약 전화 받느라 시술 중에도 폰 봐야 했는데, 이제 고객이 알아서 예약해요. 리마인더 문자도 자동이라 노쇼도 확 줄었어요.',
      stars: 5,
    },
    {
      name: '박성호',
      role: '필라테스 스튜디오',
      location: '부산 해운대구',
      text: '수업 일정·등록·결제를 홈페이지 하나로 다 처리해요. 처음엔 AI가 만든 거 맞나 싶을 정도로 완성도가 높아서 놀랐습니다.',
      stars: 5,
    },
  ];

  return (
    <section className="py-20 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Reviews</p>
          <h2 className="text-3xl font-bold text-stone-900">실제 사용 후기</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(({ name, role, location, text, stars }) => (
            <div key={name} className="bg-white rounded-2xl p-7 border border-stone-100 shadow-sm flex flex-col gap-5">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed flex-1">"{text}"</p>
              <div>
                <p className="font-semibold text-stone-800 text-sm">{name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{role} · {location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SR-05 Section ───────────────────────────────────── */
function SR05Section() {
  const configs = [
    { nodes: 5,   label: '스타터',      price: '1,450만원' },
    { nodes: 10,  label: '스탠다드',    price: '2,600만원', popular: true },
    { nodes: 50,  label: '프로',        price: '1.15억원' },
    { nodes: 200, label: '엔터프라이즈', price: '협의' },
  ];
  const features = [
    { icon: <Zap size={16} />,         text: 'GPU 대비 1/8 전력' },
    { icon: <Thermometer size={16} />, text: '항온항습 내장 섀시' },
    { icon: <BatteryFull size={16} />, text: 'UPS 자체 배터리' },
    { icon: <Shield size={16} />,      text: '진동차단 MIL-STD-810H' },
    { icon: <Cpu size={16} />,         text: '리벨리온 국산 NPU' },
    { icon: <Server size={16} />,      text: 'AZOS 자율 클러스터 관리' },
  ];
  return (
    <section className="py-20 px-4 bg-slate-950 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(6,182,212,0.07),transparent_55%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row items-center gap-12">
        {/* Text */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Cpu size={11} /> 갤럭시 S26 Ultra × 리벨리온 NPU
            </span>
            <span className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              신제품 · 2026 Q4 출시
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2">Hardware · New Product</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              AIZET<span className="text-cyan-400">-SR-05</span><br />
              스마트폰이 <span className="text-cyan-400">서버</span>가 됩니다
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              갤럭시 S26 울트라를 분산 노드로 묶고 리벨리온 국산 NPU로 가속한 초저전력 AI 추론 클러스터. GPU 서버실·별도 항온항습실 없이 사무공간에 바로 설치.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {features.map(f => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-cyan-400 shrink-0">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
          <Link
            href="/products/sr05"
            className="self-start inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-cyan-900/40"
          >
            <Server size={15} />
            SR-05 제품 상세 보기
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Config cards */}
        <div className="flex-1 w-full max-w-lg grid grid-cols-2 gap-3">
          {configs.map(cfg => (
            <div
              key={cfg.nodes}
              className={`relative rounded-2xl p-5 border flex flex-col gap-2 ${cfg.popular ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-700 bg-slate-900'}`}
            >
              {cfg.popular && (
                <span className="absolute -top-2.5 left-4 bg-cyan-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">인기</span>
              )}
              <div className="text-xs font-semibold text-slate-400">{cfg.label}</div>
              <div className="text-xl font-black text-white">{cfg.nodes}<span className="text-sm font-semibold text-slate-400 ml-1">노드</span></div>
              <div className={`text-sm font-bold ${cfg.popular ? 'text-cyan-400' : 'text-slate-300'}`}>{cfg.price}</div>
              {/* Mini node visual */}
              <div className="flex gap-0.5 mt-1 flex-wrap">
                {Array.from({ length: Math.min(cfg.nodes, 8) }).map((_, i) => (
                  <div key={i} className={`w-2 h-3.5 rounded-sm ${cfg.popular ? 'bg-cyan-700' : 'bg-slate-700'}`} />
                ))}
                {cfg.nodes > 8 && <span className="text-[10px] text-slate-500 self-end">+{cfg.nodes - 8}</span>}
              </div>
            </div>
          ))}
          <div className="col-span-2 bg-slate-900 rounded-xl border border-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">AZOS 코어 · 자율 클러스터 관리 포함</div>
            <Link href="/products/sr05#order" className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1">
              사전예약 <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: '스타터',
      price: '무료',
      period: '',
      desc: '처음 시작하는 소규모 업체',
      color: 'border-stone-200',
      features: ['AI 홈페이지 생성', '기본 예약 시스템', '메뉴·서비스 관리', '월 100건 예약'],
      cta: '무료로 시작',
      ctaStyle: 'border border-stone-300 text-stone-700 hover:border-stone-500',
    },
    {
      name: '프로',
      price: '29,000',
      period: '/월',
      desc: '성장 중인 업체에 최적',
      color: 'border-amber-400 shadow-xl shadow-amber-100',
      badge: '인기',
      features: ['스타터 모든 기능', 'AI 챗봇 주문 시스템', '결제 연동 (카드·간편결제)', '실시간 매출 분석', '무제한 예약'],
      cta: '프로 시작하기',
      ctaStyle: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      name: '비즈니스',
      price: '79,000',
      period: '/월',
      desc: '다점포·프랜차이즈 운영',
      color: 'border-stone-200',
      features: ['프로 모든 기능', '서빙 로봇 연동', '다점포 통합 관리', '전담 CS 지원', '커스텀 도메인'],
      cta: '문의하기',
      ctaStyle: 'border border-stone-300 text-stone-700 hover:border-stone-500',
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-stone-900">합리적인 요금제</h2>
          <p className="text-stone-500 mt-3">초기 비용 없이 시작, 성장에 맞게 업그레이드하세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, period, desc, color, badge, features, cta, ctaStyle }) => (
            <div key={name} className={`relative bg-white rounded-2xl border-2 p-7 flex flex-col gap-5 ${color}`}>
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {badge}
                </span>
              )}
              <div>
                <h3 className="font-bold text-stone-900 text-lg">{name}</h3>
                <p className="text-stone-400 text-xs mt-1">{desc}</p>
              </div>
              <div className="flex items-end gap-0.5">
                <span className="text-3xl font-black text-stone-900">{price}</span>
                {period && <span className="text-stone-400 text-sm mb-1">{period}</span>}
              </div>
              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-600">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-auto w-full py-3 rounded-xl font-semibold text-sm transition-colors ${ctaStyle}`}>
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ───────────────────────────────────────── */
function FinalCTA() {
  return (
    <section id="signup" className="py-20 px-4 bg-stone-900">
      <div className="max-w-2xl mx-auto text-center flex flex-col gap-7">
        <div className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full self-center border border-amber-500/30">
          <Sparkles size={12} />
          지금 무료로 시작
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          내 업종으로
          <span className="text-amber-400"> 지금 바로</span> 시작하세요
        </h2>
        <p className="text-stone-400 leading-relaxed">
          신용카드 없이 무료로 시작. 5분이면 완성된 홈페이지가 준비됩니다.
          <br />만족하지 않으면 언제든 취소할 수 있습니다.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-colors"
        >
          무료로 시작하기
          <ArrowRight size={15} />
        </Link>

        <p className="text-stone-500 text-xs">
          이미 <strong className="text-stone-300">2,400개</strong> 업체가 AIZET로 홈페이지를 운영 중입니다.
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
                <UtensilsCrossed size={13} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">AIZET</span>
            </div>
            <p className="text-xs leading-relaxed">AI가 만드는 스마트 홈페이지 플랫폼</p>
          </div>

          {[
            { title: '제품', links: ['기능 소개', '업종별 솔루션', '요금제', '데모 보기'] },
            { title: '회사', links: ['소개', '블로그', '채용', '문의'] },
            { title: '지원', links: ['도움말', '가이드', '개인정보처리방침', '이용약관'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-white text-xs font-semibold mb-3">{title}</p>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2026 AIZET Inc. All rights reserved.</p>
          <p>aizet.co.kr · 서울특별시 마포구 와우산로</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Industries />
      <Features />
      <DashboardCTA />
      <DemoPreview />
      <PromptLibraryCTA />
      <Testimonials />
      <SR05Section />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
