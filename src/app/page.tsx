'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AddToHomeButton } from '@/components/AddToHomeButton';
import { InAppBrowserBanner } from '@/components/InAppBrowserBanner';
import { AizetLogo } from '@/components/AizetLogo';
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
  GraduationCap,
  Leaf,
  Scale,
  Landmark,
  Lock,
  Link2,
  KeyRound,
  Image,
  Video,
  Cloud,
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
    href: '/demo',
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
    href: '/salon',
  },
  {
    icon: <HeartPulse size={22} />,
    name: '병원·한의원',
    color: 'bg-red-100 text-red-700',
    sub: '진료 예약·상담·안내',
    gradient: 'from-red-600 to-red-800',
    mockupTitle: '자연한의원',
    mockupSub: '강남구 역삼동 · 평일 09:00–18:30',
    cta: '진료 예약',
    features: ['진료 예약', '의료진 소개', '비급여 안내', '오시는 길', 'AI 증상 상담', '진료 과목'],
    href: '/clinic',
  },
  {
    icon: <Scale size={22} />,
    name: '세무사',
    color: 'bg-blue-100 text-blue-700',
    sub: '세금 신고·절세·AI 세무 상담',
    gradient: 'from-slate-700 to-blue-900',
    mockupTitle: '세무법인 에이젯',
    mockupSub: 'AI 세무 상담 · 신고 기한 · 계산기',
    cta: '상담 예약',
    features: ['신고 기한 캘린더', '소득세·부가세 계산기', 'AI 세무 상담 챗봇', '상담 예약', '고객 관리 대시보드', '가산세 알림'],
    href: '/tax',
  },
  {
    icon: <Landmark size={22} />,
    name: '법무사',
    color: 'bg-cyan-100 text-cyan-700',
    sub: '등기·법인 설립·내용증명 자동화',
    gradient: 'from-cyan-700 to-teal-900',
    mockupTitle: '에이젯 법무사무소',
    mockupSub: '법인설립 · 부동산 등기 · 내용증명',
    cta: '상담 예약',
    features: ['법인 설립 절차 안내', '부동산 등기 신청', '내용증명 자동 작성', '정관 초안 생성', 'AI 법무 상담 챗봇', '상담 예약'],
    href: '/legal',
  },
  {
    icon: <Dumbbell size={22} />,
    name: '헬스·필라테스',
    color: 'bg-violet-100 text-violet-700',
    sub: '수업 등록·스케줄·결제',
    gradient: 'from-violet-600 to-purple-800',
    mockupTitle: '코어핏 필라테스',
    mockupSub: '해운대구 · 06:00–22:00',
    cta: '수업 예약',
    features: ['수업 일정 관리', '회원권 결제', '트레이너 소개', '출석 체크', '온라인 예약', '프로그램 안내'],
    href: '/fitness',
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
    href: '/pension',
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
    href: '/fashion',
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
    href: '/print',
  },
  {
    icon: <Image size={22} />,
    name: '도록·작품집',
    color: 'bg-stone-100 text-stone-700',
    sub: '작품집·도록 자동 제작·고급 인쇄',
    gradient: 'from-stone-700 to-stone-900',
    mockupTitle: '2024 개인전 도록',
    mockupSub: 'AI 편집 · A4 갤러리 레이아웃 · PDF',
    cta: '작품집 만들기',
    features: ['작품 이미지 업로드', 'AI 자동 레이아웃', 'A4·A5 사이즈 선택', 'PDF 즉시 다운로드', '파주 고급 인쇄 연계', '표지·캡션 자동 구성'],
    href: '/catalog',
  },
  {
    icon: <GraduationCap size={22} />,
    name: '한국어교육',
    color: 'bg-indigo-100 text-indigo-700',
    sub: '3분 회차·영상·이북 학습',
    gradient: 'from-indigo-600 to-violet-700',
    mockupTitle: '3분 한국어',
    mockupSub: '한국어·영어·중국어·일본어·베트남어 지원',
    cta: '학습 시작',
    features: ['회차별 3분 학습', '영상으로 배우기', '이북 플립북', '5개국어 열람', 'AI 삽화·예문 구성', '슈퍼에디터 콘텐츠 제작'],
    href: '/learn/korean/1',
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
    href: '/signup',
  },
  {
    icon: <Sparkles size={22} />,
    name: '석모도 국제 재생의학·웰니스 허브',
    color: 'bg-fuchsia-100 text-fuchsia-700',
    sub: '재생의학·웰니스 프로그램 안내',
    gradient: 'from-fuchsia-600 to-fuchsia-900',
    mockupTitle: '석모도 국제 재생의학·웰니스 허브',
    mockupSub: '재생의학·웰니스 프로그램 안내',
    cta: '자세히 보기',
    features: ['재생의학 프로그램 안내', '웰니스 시설 소개', '오시는 길'],
    href: '/seokmodo.html',
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
            <p className="text-stone-500 text-base leading-relaxed">
              {industry.sub} 기능이 포함된 스마트 홈페이지를 AI가 자동으로 만들어 드립니다.
            </p>
          </div>

          {/* Features grid */}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">포함 기능</p>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
              {industry.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-base text-stone-700">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/signup"
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            이 업종으로 무료 시작
            <ArrowRight size={15} />
          </Link>
          <p className="text-center text-sm text-stone-400 -mt-2">신용카드 불필요 · 5분 완성</p>
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
        <div className="flex items-center">
          <AizetLogo className="font-black text-2xl tracking-tight" />
        </div>

        <nav className="hidden md:flex items-center gap-7 text-base font-medium text-stone-700">
          <a href="#features" className="hover:text-stone-900 transition-colors">기능</a>
          <a href="#industries" className="hover:text-stone-900 transition-colors">업종</a>
          <a href="#pricing" className="hover:text-stone-900 transition-colors">요금제</a>
          <a href="#demo" className="hover:text-stone-900 transition-colors">데모</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <AddToHomeButton />
          <Link
            href="/login"
            className="text-base font-medium text-stone-700 hover:text-stone-900 transition-colors px-3 py-1.5"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="text-base font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
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
              className="text-base font-medium text-stone-600 py-2"
            >
              {item}
            </a>
          ))}
          <AddToHomeButton mobile />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-base font-medium text-stone-600 py-2"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-1 text-xl font-semibold bg-amber-600 text-white px-4 py-4 rounded-lg text-center"
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
          <div className="flex-1 w-full min-w-0 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full self-center lg:self-start border border-amber-200">
              <Sparkles size={12} />
              AI 홈페이지 자동 생성 플랫폼
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-tight tracking-tight">
              내 가게 홈페이지,
              <br />
              <span className="text-amber-600">AI가 5분 만에</span> 완성
            </h1>

            <p className="text-stone-700 text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              업종만 선택하면 예약·주문·결제까지 갖춘
              스마트 홈페이지를 자동으로 만들어 드립니다.
              코딩 지식 없이도 바로 오픈.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors shadow-lg shadow-amber-200 whitespace-nowrap"
              >
                무료로 시작하기
                <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="flex items-center justify-center gap-2 border border-stone-200 text-stone-700 hover:border-stone-400 font-bold text-base px-7 py-4 rounded-xl transition-colors whitespace-nowrap"
              >
                <Play size={14} className="text-amber-600" />
                라이브 데모 보기
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center lg:justify-start text-sm font-semibold text-stone-700">
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

              <Link href="/demo" className="block group">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden group-hover:shadow-amber-200/60 group-hover:border-amber-300 transition-all duration-200">
                <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-stone-400 border border-stone-200 ml-2">
                    my-restaurant.aizet.co.kr
                  </div>
                  <span className="text-[10px] text-amber-500 font-semibold hidden group-hover:inline">데모 체험 →</span>
                </div>

                <div className="bg-gradient-to-b from-amber-600 to-amber-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed size={13} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">중화가정</span>
                  </div>
                  <h2 className="text-white text-lg font-bold mb-1">가정집의 주방처럼, 어머니의 요리처럼</h2>
                  <p className="text-amber-200 text-xs mb-4">신세계백화점 의정부점 9층 · 매일 11:00–21:00</p>
                  <div className="flex gap-2">
                    <div className="bg-white text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg">메뉴 보기</div>
                    <div className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg">예약하기</div>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    {[
                      { name: '짜장면', price: '₩8,000', tag: '인기', img: '/demo/menu/menu-jjajangmyeon.jpg' },
                      { name: '짬뽕', price: '₩10,000', tag: '인기', img: '/demo/menu/menu-jjamppong.jpg' },
                    ].map((item) => (
                      <div key={item.name} className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <img src={item.img} alt={item.name} className="w-full h-40 rounded-lg mb-2 object-cover" />
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
              </Link>

              <div className="hidden sm:flex absolute -right-3 top-16 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 items-center gap-2">
                <Zap size={13} className="text-amber-500" />
                <span className="text-xs font-semibold text-stone-700">AI 생성 완료</span>
              </div>
              <div className="hidden sm:flex absolute -left-3 bottom-16 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 items-center gap-2">
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
              <p className="text-4xl sm:text-5xl font-black text-amber-600">{value}</p>
              <p className="text-sm font-semibold text-stone-700 mt-2">{label}</p>
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
      iconBg: 'bg-amber-100 border-amber-300',
      numColor: 'text-amber-500',
      accent: 'bg-amber-500',
      title: '회원가입 (30초)',
      desc: '이메일 하나로 시작합니다. 신용카드 없이도 무료로 바로 사용할 수 있습니다.',
    },
    {
      num: '02',
      icon: <Building2 size={22} className="text-blue-600" />,
      iconBg: 'bg-blue-100 border-blue-300',
      numColor: 'text-blue-400',
      accent: 'bg-blue-500',
      title: '업종 선택',
      desc: '식당, 카페, 미용실, 병원 등 100개 이상 업종 중 내 업체에 맞는 유형을 선택합니다.',
    },
    {
      num: '03',
      icon: <Wand2 size={22} className="text-emerald-600" />,
      iconBg: 'bg-emerald-100 border-emerald-300',
      numColor: 'text-emerald-500',
      accent: 'bg-emerald-500',
      title: 'AI 자동 완성',
      desc: '디자인, 메뉴/서비스, 예약, 결제까지 AI가 자동으로 완성된 홈페이지를 만들어 드립니다.',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">단 세 단계로 완성</h2>
          <p className="text-stone-600 text-sm mt-4 max-w-md mx-auto break-keep">복잡한 설정 없이 누구나 5분 안에 완성도 높은 홈페이지를 오픈할 수 있습니다.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-stone-300 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              {/* 컬러 상단 액센트 바 */}
              <div className={`h-1.5 w-full ${step.accent}`} />

              <div className="p-5 md:p-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center ${step.iconBg}`}>
                    {step.icon}
                  </div>
                  <span className={`text-5xl font-black ${step.numColor} opacity-25 select-none`}>{step.num}</span>
                </div>

                {/* 단계 번호 배지 */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${step.accent}`}>
                    STEP {step.num}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-stone-900 text-base md:text-lg">{step.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed break-keep">{step.desc}</p>
                </div>
              </div>

              {i < 2 && (
                <ChevronRight
                  size={22}
                  className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-400 bg-white rounded-full shadow-md border border-stone-200"
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
  return (
    <section id="industries" className="py-20 px-4 bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Industries</p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">어떤 업종이든 바로 시작</h2>
          <p className="text-stone-700 text-base mt-4 max-w-md mx-auto">
            각 업종에 특화된 기능과 디자인이 자동으로 적용됩니다.{' '}
            <span className="text-amber-600 font-medium">카드를 클릭해 데모를 체험해 보세요.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {INDUSTRIES_LIST.map((ind) => {
            const cardClassName = "group bg-white border border-stone-300 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-200 flex flex-col gap-1.5 sm:gap-3";
            const cardContent = (
              <>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${ind.color}`}>
                  {ind.icon}
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm sm:text-base break-keep">{ind.name}</p>
                  <p className="hidden sm:block text-sm text-stone-500 mt-1 break-keep">{ind.sub}</p>
                </div>
                <ChevronRight size={10} className="text-stone-500 group-hover:text-amber-500 transition-colors" />
              </>
            );

            // 정적 HTML 파일(예: /seokmodo.html)은 next/link 클라이언트 라우팅 대상이 아니므로
            // 일반 <a> 태그로 새 탭에 연다. 나머지 항목은 기존 Link 라우팅 그대로 유지.
            if (ind.href!.endsWith('.html')) {
              return (
                <a
                  key={ind.name}
                  href={ind.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <Link key={ind.name} href={ind.href!} className={cardClassName}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
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
    <section className="py-20 px-4 bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">필요한 기능, 전부 포함</h2>
          <p className="text-stone-700 text-base mt-4 max-w-md mx-auto">비싼 플러그인 없이 모든 스마트 기능이 기본 탑재됩니다.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc, bg }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-stone-300 shadow-xl flex flex-col gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">{title}</h3>
                <p className="text-stone-600 text-sm mt-1.5 leading-relaxed break-keep">{desc}</p>
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
      <Bot size={170} className="absolute right-0 top-0 text-amber-400/[0.07] -rotate-12 pointer-events-none" />
      <BarChart3 size={88} className="absolute right-44 top-20 text-amber-300/[0.05] rotate-6 pointer-events-none" />
      <Zap size={60} className="absolute right-20 top-44 text-amber-500/[0.06] -rotate-6 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Text */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full self-center lg:self-start border border-amber-500/30">
              <LayoutDashboard size={12} />
              AZOS 대시보드
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
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
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors"
              >
                <LayoutDashboard size={15} />
                대시보드 체험하기
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white font-bold text-base px-7 py-4 rounded-xl transition-colors"
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

/* ─── Demo Images Section ─────────────────────────────── */
function DemoImagesSection() {
  const sideImages = [
    { src: '/demo/menu/menu-tangsuyuk.jpg',    alt: '탕수육 — 중화가정 인기 메뉴' },
    { src: '/demo/menu/menu-jjajangmyeon.jpg', alt: '짜장면 — 중화가정 대표 메뉴' },
    { src: '/demo/menu/menu-kkanpunggi.jpg',   alt: '깐풍기 — 중화가정 시그니처' },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-amber-50/60 to-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 mb-4">
            <Sparkles size={12} />
            AIZET 실제 제작 결과물
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
            이런 홈페이지가 자동으로 만들어집니다
          </h2>
          <p className="text-stone-600 text-base mt-4 max-w-md mx-auto">
            신세계백화점 의정부점 입점 브랜드 <strong className="text-stone-800">중화가정</strong> — AIZET이 실제로 제작한 홈페이지입니다.
          </p>
        </div>

        <Link href="/demo" className="group block">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* 대형 첫 슬롯 — 실제 촬영 영상 */}
            <div className="relative overflow-hidden rounded-2xl col-span-2 md:col-span-1 md:row-span-2 h-52 md:h-[332px]">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/demo/menu/menu-gajeong-set.jpg"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
                <source src="/demo/restaurant-walkthrough.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="bg-white/90 backdrop-blur-sm text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <UtensilsCrossed size={11} />
                  중화가정
                </span>
              </div>
            </div>
            {/* 실제 메뉴 사진 3장 */}
            {sideImages.map((img, i) => (
              <div
                key={img.src}
                className={`relative overflow-hidden rounded-2xl h-40${i === 2 ? ' col-span-2 md:col-span-1' : ''}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </Link>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors shadow-lg shadow-amber-200"
          >
            <Play size={15} />
            중화가정 데모 직접 체험하기
            <ArrowRight size={14} />
          </Link>
          <p className="text-stone-400 text-sm">주문·결제·AI 챗봇·서빙 로봇까지 모두 작동합니다</p>
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
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">실제 데모를 직접 체험해 보세요</h2>
          <p className="text-stone-700 text-base mt-4 max-w-md mx-auto">AIZET가 자동 생성한 업종별 데모입니다. 모든 기능이 실제로 작동합니다.</p>
        </div>

        {/* Restaurant demo */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <UtensilsCrossed size={220} className="absolute -right-10 -top-10 text-white/[0.07] rotate-12 pointer-events-none" />
          <div className="flex-1 relative">
            <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest mb-2">식당·카페 데모</p>
            <h3 className="text-white text-3xl sm:text-4xl font-black mb-4 leading-tight">
              AI가 만든 식당 홈페이지를<br />직접 체험해 보세요
            </h3>
            <p className="text-amber-100 text-base leading-relaxed mb-6 max-w-md">
              주문·결제·AI 챗봇·서빙 로봇까지 — 실제 식당 데모입니다.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white text-amber-700 font-bold text-base px-7 py-4 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
            >
              <Play size={15} />
              식당 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="relative rounded-[2rem] overflow-hidden border-[3px] border-white/40 shadow-2xl h-80">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/demo/restaurant-exterior.jpg"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span className="bg-white/90 backdrop-blur-sm text-amber-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Sparkles size={11} />
                  AI가 만들어드립니다
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Print demo */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <Printer size={200} className="absolute -right-8 -top-8 text-white/[0.07] -rotate-6 pointer-events-none" />
          <div className="flex-1 relative">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">인쇄·출력 데모</p>
            <h3 className="text-white text-3xl sm:text-4xl font-black mb-4 leading-tight">
              인쇄소 홈페이지를<br />직접 체험해 보세요
            </h3>
            <p className="text-blue-100 text-base leading-relaxed mb-6 max-w-md">
              실시간 견적 계산기·AI 상담·파일 업로드·제작 현황 추적까지 — 완전한 인쇄 플랫폼 데모입니다.
            </p>
            <Link
              href="/print"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-base px-7 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
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

        {/* Tax demo */}
        <div className="bg-gradient-to-r from-slate-700 to-blue-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <Scale size={200} className="absolute -right-8 -top-8 text-white/[0.07] -rotate-12 pointer-events-none" />
          <div className="flex-1 relative">
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">세무사 사무소 데모</p>
            <h3 className="text-white text-3xl sm:text-4xl font-black mb-4 leading-tight">
              AI 세무 상담부터 신고 기한까지<br />세무법인 플랫폼을 체험해 보세요
            </h3>
            <p className="text-slate-300 text-base leading-relaxed mb-6 max-w-md">
              신고 캘린더·세금 계산기·AI 상담 챗봇·상담 예약·관리자 대시보드까지 — 완전한 세무법인 데모입니다.
            </p>
            <Link
              href="/tax"
              className="inline-flex items-center gap-2 bg-white text-slate-800 font-bold text-base px-7 py-4 rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
            >
              <Scale size={15} />
              세무법인 데모 체험하기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full md:w-52 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Scale size={13} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">세무법인 에이젯</p>
                  <p className="text-[10px] text-stone-400">AI 세무 서비스</p>
                </div>
              </div>
              {[
                { label: '신고 기한 캘린더', color: 'bg-blue-500' },
                { label: '세금 계산기', color: 'bg-emerald-500' },
                { label: 'AI 세무 상담', color: 'bg-violet-500' },
                { label: '상담 예약·관리', color: 'bg-amber-500' },
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
          <Leaf size={220} className="absolute -right-10 -top-10 text-white/[0.07] rotate-12 pointer-events-none" />
          <div className="flex-1 relative">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-2">건강 식품 쇼핑몰 데모</p>
            <h3 className="text-white text-3xl sm:text-4xl font-black mb-4 leading-tight">
              무설탕 건강 캔디 브랜드<br />한캔디를 체험해 보세요
            </h3>
            <p className="text-green-100 text-base leading-relaxed mb-6 max-w-md">
              제품 카탈로그·장바구니·결제·AI 상담 챗봇·관리자 대시보드까지 — 완전한 건강식품 쇼핑몰 데모입니다.
            </p>
            <Link
              href="/hancandy"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-bold text-base px-7 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
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

/* ─── MySpace Section ────────────────────────────────────── */
function MySpaceSection() {
  const features = [
    { icon: <Lock size={14} />, label: '완전 비공개', desc: '나만 볼 수 있는 나만의 보관함', color: 'bg-stone-100 text-stone-700' },
    { icon: <Link2 size={14} />, label: '링크로만 공유', desc: '선택한 사람에게만 링크 전달', color: 'bg-blue-100 text-blue-700' },
    { icon: <KeyRound size={14} />, label: '암호 보호', desc: '비밀번호 설정으로 이중 보호', color: 'bg-amber-100 text-amber-700' },
    { icon: <Cloud size={14} />, label: '구글 드라이브 연동', desc: '원본 화질 그대로 저장', color: 'bg-emerald-100 text-emerald-700' },
    { icon: <Wand2 size={14} />, label: 'AI 프롬프트 제공', desc: 'Midjourney·Runway 프롬프트 연동', color: 'bg-violet-100 text-violet-700' },
    { icon: <Shield size={14} />, label: '댓글·평가 없음', desc: '순수 저장·공유 목적으로만', color: 'bg-rose-100 text-rose-700' },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-violet-50/40">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Text */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-200">
                <Shield size={11} />
                무료 기능 · MySpace
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                <Check size={11} />
                회원가입만 하면 바로 사용
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
              유튜브·SNS가 부담스러울 때,
              <br />
              <span className="text-violet-600">나만의 조용한 공간</span>
            </h2>

            <p className="text-stone-700 text-base leading-relaxed max-w-lg">
              알고리즘 노출 없이, 댓글 없이, 좋아요 없이. 동영상과 이미지를 내가 원하는 사람에게만
              공유하는 <strong className="text-stone-800">프라이버시 중심 개인 미디어 공간</strong>입니다.
              구글 드라이브와 연동해 원본 화질 그대로 보관하세요.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {features.map(({ icon, label, desc, color }) => (
                <div key={label} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border border-transparent ${color.replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[0]}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${color.split(' ')[1]}`}>{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 break-keep">{label}</p>
                    <p className="text-xs text-stone-600 mt-0.5 leading-snug break-keep">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/myspace"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors shadow-lg shadow-violet-200"
              >
                <Shield size={15} />
                나만의 공간 체험하기
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 border border-stone-200 text-stone-700 hover:border-violet-300 hover:text-violet-700 font-bold text-base px-7 py-4 rounded-xl transition-colors"
              >
                무료로 시작
              </Link>
            </div>
          </div>

          {/* Mockup */}
          <div className="flex-1 w-full max-w-md">
            <div className="relative">
              <div className="absolute -inset-4 bg-violet-400/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
                {/* Profile area */}
                <div className="h-16 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600" />
                <div className="px-5 pb-5">
                  <div className="flex items-end justify-between -mt-6 mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-white flex items-center justify-center text-2xl">🌿</div>
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Shield size={9} />
                      나만의 공간
                    </span>
                  </div>
                  <p className="font-bold text-stone-900 text-sm">나의 조용한 공간</p>
                  <p className="text-xs text-stone-400 mt-0.5">조용히 기록합니다 🌿</p>

                  {/* Privacy notice */}
                  <div className="mt-3 bg-violet-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Shield size={11} className="text-violet-500" />
                    <p className="text-[10px] text-violet-700 font-medium">댓글·좋아요·노출 없음</p>
                  </div>

                  {/* Media items */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { emoji: '🌊', title: '제주 여행', privacy: 'link', color: 'from-violet-400 to-purple-600' },
                      { emoji: '🎬', title: '가족 파티', privacy: 'private', color: 'from-rose-400 to-pink-600' },
                      { emoji: '📸', title: '일상 기록', privacy: 'password', color: 'from-amber-400 to-orange-600' },
                      { emoji: '🌸', title: '봄 산책', privacy: 'link', color: 'from-teal-400 to-emerald-600' },
                    ].map(({ emoji, title, privacy, color }) => (
                      <div key={title} className="rounded-xl overflow-hidden border border-stone-100">
                        <div className={`h-14 bg-gradient-to-br ${color} flex items-center justify-center text-2xl`}>{emoji}</div>
                        <div className="px-2 py-1.5">
                          <p className="text-[10px] font-semibold text-stone-700 truncate">{title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {privacy === 'private' && <Lock size={8} className="text-stone-400" />}
                            {privacy === 'link' && <Link2 size={8} className="text-blue-400" />}
                            {privacy === 'password' && <KeyRound size={8} className="text-amber-500" />}
                            <span className="text-[9px] text-stone-400">
                              {privacy === 'private' ? '비공개' : privacy === 'link' ? '링크공유' : '암호보호'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex absolute -right-3 top-20 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 items-center gap-2">
                <Shield size={12} className="text-violet-500" />
                <span className="text-xs font-semibold text-stone-700">알고리즘 노출 없음</span>
              </div>
              <div className="hidden sm:flex absolute -left-3 bottom-12 bg-white rounded-xl shadow-lg border border-stone-100 px-3 py-2 items-center gap-2">
                <Cloud size={12} className="text-blue-500" />
                <span className="text-xs font-semibold text-stone-700">Drive 연동 저장</span>
              </div>
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
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
            AI 마케팅 콘텐츠,
            <br />
            <span className="text-amber-600">복사 한 번</span>으로 시작
          </h2>
          <p className="text-stone-700 text-base leading-relaxed max-w-md">
            식당·카페·미용실 등 8개 업종에 맞는 이미지·영상·SNS 프롬프트를 무료로 제공합니다.
            Midjourney, DALL·E, Runway에 바로 붙여 쓰세요.
          </p>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors self-start shadow-lg shadow-amber-200"
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
                <span className="text-sm font-bold opacity-60">{cat}</span>
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">{tool}</span>
                <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                  <Copy size={12} className="opacity-60" />
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-stone-400 mt-1">
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
    <section className="py-20 px-4 bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Reviews</p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">실제 사용 후기</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(({ name, role, location, text, stars }) => (
            <div key={name} className="bg-white rounded-2xl p-7 border border-stone-300 shadow-xl flex flex-col gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed break-keep flex-1">"{text}"</p>
              <div>
                <p className="font-bold text-stone-800 text-base">{name}</p>
                <p className="text-sm text-stone-600 mt-0.5">{role} · {location}</p>
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
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
              AIZET<span className="text-cyan-400">-SR-05</span><br />
              스마트폰이 <span className="text-cyan-400">서버</span>가 됩니다
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
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
            className="self-start inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-base px-7 py-4 rounded-xl transition-colors shadow-lg shadow-cyan-900/40"
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
              <div className="text-sm font-semibold text-slate-400">{cfg.label}</div>
              <div className="text-xl font-black text-white">{cfg.nodes}<span className="text-sm font-semibold text-slate-400 ml-1">노드</span></div>
              <div className={`text-base font-bold ${cfg.popular ? 'text-cyan-400' : 'text-slate-300'}`}>{cfg.price}</div>
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
            <div className="text-base text-slate-400">AZOS 코어 · 자율 클러스터 관리 포함</div>
            <Link href="/products/sr05#order" className="text-base text-cyan-400 font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1">
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
      color: 'border-violet-400',
      features: ['AI 홈페이지 생성', '기본 예약 시스템', '메뉴·서비스 관리', '월 100건 예약', '🔒 MySpace (개인 미디어 공간)', '구글 드라이브 연동 저장'],
      cta: '무료로 시작',
      ctaStyle: 'border border-stone-300 text-stone-700 hover:border-stone-500',
    },
    {
      name: '프로',
      price: '29,000',
      period: '/월',
      desc: '성장 중인 업체에 최적',
      color: 'border-amber-500 shadow-2xl shadow-amber-200',
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
      color: 'border-stone-400',
      features: ['프로 모든 기능', '서빙 로봇 연동', '다점포 통합 관리', '전담 CS 지원', '커스텀 도메인'],
      cta: '문의하기',
      ctaStyle: 'border border-stone-300 text-stone-700 hover:border-stone-500',
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">합리적인 요금제</h2>
          <p className="text-stone-700 text-base mt-4">초기 비용 없이 시작, 성장에 맞게 업그레이드하세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, period, desc, color, badge, features, cta, ctaStyle }) => (
            <div key={name} className={`relative bg-white rounded-2xl border-2 p-7 flex flex-col gap-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 ${color}`}>
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {badge}
                </span>
              )}
              <div>
                <h3 className="font-black text-stone-900 text-xl">{name}</h3>
                <p className="text-stone-600 text-sm mt-1">{desc}</p>
              </div>
              <div className="flex items-end gap-0.5">
                <span className="text-5xl font-black text-stone-900">{price}</span>
                {period && <span className="text-stone-600 text-base mb-1">{period}</span>}
              </div>
              <ul className="flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-600">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-auto w-full py-3.5 rounded-xl font-bold text-base transition-colors ${ctaStyle}`}>
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
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          내 업종으로
          <span className="text-amber-400"> 지금 바로</span> 시작하세요
        </h2>
        <p className="text-stone-400 text-base leading-relaxed">
          신용카드 없이 무료로 시작. 5분이면 완성된 홈페이지가 준비됩니다.
          <br />만족하지 않으면 언제든 취소할 수 있습니다.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors"
        >
          무료로 시작하기
          <ArrowRight size={15} />
        </Link>

        <p className="text-stone-500 text-sm">
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
              <AizetLogo className="font-bold text-sm" zetColor="#ffffff" />
            </div>
            <p className="text-sm leading-relaxed">AI가 만드는 스마트 홈페이지 플랫폼</p>
          </div>

          {[
            { title: '제품', links: ['기능 소개', '업종별 솔루션', '요금제', '데모 보기'] },
            { title: '회사', links: ['소개', '블로그', '채용', '문의'] },
            { title: '지원', links: ['도움말', '가이드', '개인정보처리방침', '이용약관'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-white text-sm font-semibold mb-3">{title}</p>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2026 AIZET Inc. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <p>aizet.co.kr · 서울특별시 마포구 와우산로</p>
            <a
              href="/briefing.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-700 hover:text-stone-500 text-[10px] transition-colors"
            >
              회장님 브리핑
            </a>
          </div>
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
      <InAppBrowserBanner />
      <Hero />
      <Stats />
      <HowItWorks />
      <Industries />
      <Features />
      <DashboardCTA />
      <DemoImagesSection />
      <DemoPreview />
      <MySpaceSection />
      <PromptLibraryCTA />
      <Testimonials />
      <SR05Section />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
