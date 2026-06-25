'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Dumbbell, CheckCircle, Clock, MapPin, Phone,
  CalendarClock, MessageCircle, Star, Users, Zap, Heart,
  ShieldCheck, Award, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { AdminModeButton } from '@/components/AdminModeButton';

// ── 클래스 ─────────────────────────────────────────────────────────────────────
const CLASSES = [
  {
    icon: Users,
    title: '그룹 필라테스',
    desc: '4~6인 소그룹 · 매트 기반',
    detail: '소그룹으로 진행하는 그룹 필라테스. 코어 강화, 체형 교정, 자세 개선에 집중합니다. 강사의 세밀한 피드백을 받으며 배울 수 있어 초보자에게도 최적입니다.',
    price: '월 8회 150,000원',
    img: '/fitness/fitness-class-group.jpg',
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
    badge: '인기',
  },
  {
    icon: Zap,
    title: '1:1 퍼스널 트레이닝',
    desc: '개인 맞춤 집중 트레이닝',
    detail: '강사가 100% 집중하는 1:1 PT. 체형, 목표, 통증 부위에 따라 완전히 커스터마이즈된 프로그램을 진행합니다. 빠른 변화를 원한다면 최선의 선택입니다.',
    price: '1회 80,000원',
    img: '/fitness/fitness-class-pt.jpg',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600 bg-purple-100',
    badge: '',
  },
  {
    icon: Dumbbell,
    title: '기구 필라테스',
    desc: '리포머·캐딜락·체어 활용',
    detail: '리포머, 캐딜락, 체어 등 전문 기구를 활용한 필라테스. 스프링 저항을 이용해 깊은 근육까지 효과적으로 강화합니다. 척추 교정과 재활에도 탁월한 효과를 보입니다.',
    price: '월 8회 200,000원',
    img: '/fitness/fitness-class-reformer.jpg',
    color: 'bg-indigo-50 border-indigo-200',
    iconColor: 'text-indigo-600 bg-indigo-100',
    badge: '전문',
  },
  {
    icon: Heart,
    title: '매트 필라테스',
    desc: '도구 없이 맨몸으로',
    detail: '별도 기구 없이 맨몸과 간단한 소도구로 진행합니다. 필라테스의 기본 원리를 익히고 체력과 유연성을 키우기에 이상적입니다. 입문자에게 가장 적합한 클래스입니다.',
    price: '월 8회 120,000원',
    img: '/fitness/fitness-class-mat.jpg',
    color: 'bg-pink-50 border-pink-200',
    iconColor: 'text-pink-600 bg-pink-100',
    badge: '입문 추천',
  },
  {
    icon: Star,
    title: '필라테스+요가 복합',
    desc: '유연성·이완·스트레스 해소',
    detail: '필라테스의 코어 운동과 요가의 이완·호흡을 결합한 복합 클래스. 몸과 마음 모두를 케어합니다. 바쁜 일상 속에서 균형을 찾고 싶은 분에게 추천합니다.',
    price: '월 8회 140,000원',
    img: '/fitness/fitness-class-yoga.jpg',
    color: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-600 bg-teal-100',
    badge: '',
  },
  {
    icon: ShieldCheck,
    title: '임산부·산후 필라테스',
    desc: '임신 중·출산 후 전문 프로그램',
    detail: '임산부와 산후 회복 중인 분을 위한 전문 프로그램. 전문 자격을 보유한 이민아 강사가 각 시기에 맞는 안전하고 효과적인 운동을 지도합니다.',
    price: '1회 60,000원',
    img: '/fitness/fitness-class-prenatal.jpg',
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600 bg-rose-100',
    badge: '전담 강사',
  },
];

// ── 강사 ─────────────────────────────────────────────────────────────────────
const INSTRUCTORS = [
  {
    name: '김지수',
    title: '대표 강사 · 원장',
    career: '경력 10년',
    certs: ['STOTT Pilates 국제 자격', 'BPI 기구필라테스 자격', '스포츠 재활 전문가'],
    specialty: ['기구 필라테스', '척추 교정', '만성 통증 재활'],
    bio: '10년 이상의 임상 경험을 바탕으로 척추 교정과 기구 필라테스를 전문으로 합니다. "몸이 바뀌면 삶이 바뀐다"는 철학으로 회원 한 명 한 명의 변화를 함께합니다.',
    img: '/fitness/fitness-instructor-main.jpg',
    color: 'from-violet-600 to-purple-700',
  },
  {
    name: '이민아',
    title: '수석 강사',
    career: '경력 5년',
    certs: ['PMA 필라테스 자격', '요가지도사 2급', '임산부·산후 필라테스 전문 과정'],
    specialty: ['매트 필라테스', '산후 관리', '필라테스+요가'],
    bio: '임산부·산후 필라테스 전문가로서 여성의 생애 주기 전반에 걸친 운동을 지도합니다. 따뜻한 케어와 세밀한 피드백으로 회원들의 신뢰를 받고 있습니다.',
    img: '/fitness/fitness-instructor-2.jpg',
    color: 'from-pink-500 to-rose-600',
  },
  {
    name: '박세준',
    title: '강사',
    career: '경력 4년',
    certs: ['NSCA-CPT 개인 트레이닝 자격', 'STOTT Pilates 자격', '기능성 움직임 전문가 (FMS)'],
    specialty: ['1:1 PT', '기능성 트레이닝', '재활 운동'],
    bio: '기능성 트레이닝과 재활 운동 전문가로서 통증 없이 움직이는 몸을 만드는 데 집중합니다. 특히 어깨·무릎·고관절 통증을 가진 회원들과 함께 효과적인 변화를 이끌어냅니다.',
    img: '/fitness/fitness-instructor-3.jpg',
    color: 'from-indigo-500 to-blue-600',
  },
];

// ── 영업시간 ───────────────────────────────────────────────────────────────────
const HOURS = [
  { day: '월·화·수·목·금', time: '06:00 – 22:00', note: '' },
  { day: '토요일', time: '08:00 – 18:00', note: '' },
  { day: '일요일', time: '10:00 – 16:00', note: '그룹 클래스 없음' },
  { day: '공휴일', time: '10:00 – 16:00', note: '사전 예약 필수' },
];

// ── 클래스 카드 ────────────────────────────────────────────────────────────────
function ClassCard({ c }: { c: typeof CLASSES[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden ${c.color}`}>
      <div className="relative w-full aspect-video bg-white/50">
        {imgError ? (
          <div className={`absolute inset-0 flex items-center justify-center ${c.iconColor}`}>
            <c.icon size={36} />
          </div>
        ) : (
          <Image
            src={c.img}
            alt={c.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        )}
        {c.badge && (
          <span className="absolute top-3 left-3 text-[10px] font-bold bg-violet-700 text-white px-2 py-0.5 rounded-full">{c.badge}</span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">{c.title}</h3>
          <span className="text-xs font-bold text-violet-700">{c.price}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{c.desc}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{c.detail}</p>
      </div>
    </div>
  );
}

// ── 강사 카드 ──────────────────────────────────────────────────────────────────
function InstructorCard({ inst }: { inst: typeof INSTRUCTORS[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
      <div className={`relative w-full aspect-[3/2] bg-gradient-to-br ${inst.color}`}>
        {!imgError && (
          <Image
            src={inst.img}
            alt={inst.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)}
          />
        )}
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <Users size={40} />
            <p className="text-xs mt-2">{inst.img.split('/').pop()}</p>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-black text-gray-900 text-lg">{inst.name} 강사</h3>
            <p className="text-sm text-violet-600 font-semibold">{inst.title}</p>
          </div>
          <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-full">{inst.career}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{inst.bio}</p>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5">전문 분야</p>
            <div className="flex flex-wrap gap-1.5">
              {inst.specialty.map(s => (
                <span key={s} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5">자격증</p>
            <ul className="space-y-0.5">
              {inst.certs.map(cert => (
                <li key={cert} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Award size={11} className="text-violet-400 shrink-0 mt-0.5" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FitnessHome() {
  const [heroImgError, setHeroImgError] = useState(false);
  const [mainInstructorImgError, setMainInstructorImgError] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin" />

      {/* ── 1. Hero ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        {/* 인테리어 전경 사진 */}
        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-violet-100 border border-violet-200 shadow-lg mb-10">
          {heroImgError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-violet-300">
              <Dumbbell size={56} />
              <p className="text-sm mt-3 text-violet-400">fitness-interior.jpg</p>
              <p className="text-xs text-violet-300 mt-1">권장 비율 21:9 · 2100×900px 이상</p>
            </div>
          ) : (
            <Image
              src="/fitness/fitness-interior.jpg"
              alt="코어핏 필라테스 스튜디오 인테리어"
              fill
              className="object-cover"
              sizes="100vw"
              onError={() => setHeroImgError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <Dumbbell size={12} />
              해운대 · 기구·매트·1:1 PT
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow">
              몸의 중심을 바로잡는<br />
              <span className="text-violet-300">코어핏 필라테스</span>
            </h1>
            <p className="text-white/80 text-sm max-w-md">
              척추 교정부터 체형 관리까지. 전문 강사가 당신의 목표에 맞는 최적의 프로그램을 설계합니다.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Dumbbell size={13} />
              필라테스 스튜디오 데모
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
              통증 없이 움직이는 몸,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                코어에서 시작합니다
              </span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              10년 이상 경력의 전문 강사진이 체형·목표·통증에 맞는 1:1 맞춤 프로그램을 설계합니다.
              기구 필라테스부터 그룹 클래스까지, 06:00~22:00 내가 원할 때 운동합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/fitness/reservation"
                className="inline-flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <CalendarClock size={16} />
                무료 체험 예약
              </Link>
              <Link
                href="/fitness/chat"
                className="inline-flex items-center justify-center gap-2 border-2 border-violet-200 hover:border-violet-400 text-violet-800 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <MessageCircle size={16} />
                AI 운동 상담
              </Link>
            </div>
          </div>

          {/* 대표 강사 사진 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-violet-50 border border-violet-100 shadow-lg">
              {mainInstructorImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-violet-300 bg-violet-50">
                  <Users size={60} />
                  <p className="text-sm mt-3 text-violet-400">fitness-instructor-main.jpg</p>
                  <p className="text-xs text-violet-300 mt-1">권장 비율 4:5</p>
                </div>
              ) : (
                <Image
                  src="/fitness/fitness-instructor-main.jpg"
                  alt="코어핏 필라테스 대표 강사 김지수"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setMainInstructorImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-violet-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">대표 강사</p>
              <p className="font-black text-gray-900">김지수 원장</p>
              <p className="text-xs text-violet-600 mt-0.5">STOTT Pilates · 경력 10년</p>
            </div>
          </div>
        </div>

        {/* 스튜디오 강점 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: ShieldCheck, title: '소수 정예 클래스', desc: '최대 6인 소그룹 운영. 강사가 모든 회원의 자세를 직접 확인하고 교정합니다.' },
            { icon: Dumbbell, title: '최신 기구 완비', desc: '리포머, 캐딜락, 체어, 배럴 등 STOTT Pilates 정품 기구를 완비했습니다.' },
            { icon: Clock, title: '06:00 ~ 22:00 운영', desc: '이른 아침부터 늦은 밤까지. 직장인도 퇴근 후 운동할 수 있는 긴 운영 시간.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-violet-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. 클래스 ─────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">클래스 안내</h2>
          <p className="text-gray-500 text-sm">목표와 경험 수준에 맞는 클래스를 선택해 보세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CLASSES.map(c => (
            <ClassCard key={c.title} c={c} />
          ))}
        </div>
        <div className="mt-6 bg-violet-50 border border-violet-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-violet-900">처음이라면 무료 체험 수업으로 시작하세요</p>
            <p className="text-sm text-violet-600 mt-0.5">강사 1:1 체형 분석 + 맞춤 클래스 추천 포함 · 완전 무료</p>
          </div>
          <Link
            href="/fitness/reservation"
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            무료 체험 신청 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 3. 강사 프로필 ────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">강사 소개</h2>
          <p className="text-gray-500 text-sm">전문 자격을 보유한 강사진이 직접 지도합니다</p>
        </div>

        {/* 강사 탭 */}
        <div className="flex gap-2 mb-6 justify-center">
          {INSTRUCTORS.map((inst, idx) => (
            <button
              key={inst.name}
              onClick={() => setActiveInstructor(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeInstructor === idx
                  ? 'bg-violet-700 text-white border-violet-700 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              {inst.name}
              <span className={`text-[10px] font-normal ${activeInstructor === idx ? 'text-violet-200' : 'text-gray-400'}`}>{inst.career}</span>
            </button>
          ))}
        </div>

        <InstructorCard inst={INSTRUCTORS[activeInstructor]} />

        {/* 이전/다음 */}
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={() => setActiveInstructor(i => (i - 1 + INSTRUCTORS.length) % INSTRUCTORS.length)}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1.5 items-center">
            {INSTRUCTORS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveInstructor(idx)}
                className={`rounded-full transition-all ${activeInstructor === idx ? 'w-5 h-2 bg-violet-700' : 'w-2 h-2 bg-gray-300 hover:bg-violet-300'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveInstructor(i => (i + 1) % INSTRUCTORS.length)}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ── 4. 온라인 예약 CTA ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarClock size={28} className="text-violet-700" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">온라인 수업 예약</h2>
          <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
            원하는 클래스, 강사, 시간을 선택해 간편하게 예약하세요. 예약 확인 문자를 즉시 발송합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['그룹 필라테스', '1:1 PT', '기구 필라테스', '매트 필라테스', '무료 체험'].map(t => (
              <span key={t} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
          <Link
            href="/fitness/reservation"
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            예약하기 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 5. AI 운동 상담 CTA ───────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-r from-violet-700 to-purple-700 rounded-3xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h2 className="text-2xl font-black mb-2">AI 운동 상담</h2>
          <p className="text-violet-100 text-sm mb-5 max-w-md mx-auto">
            목표나 통증 부위를 알려주세요. AI 트레이너가 딱 맞는 클래스와 강사를 추천해 드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['"허리 통증이 있어요"', '"다이어트하고 싶어요"', '"처음인데 뭐가 맞나요?"', '"산후 회복 중이에요"'].map(ex => (
              <span key={ex} className="text-xs bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full">{ex}</span>
            ))}
          </div>
          <Link
            href="/fitness/chat"
            className="inline-flex items-center gap-2 bg-white text-violet-800 hover:bg-violet-50 font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            AI 상담 시작 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 6. 위치·영업시간 ──────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-violet-700" />
              </div>
              <h3 className="font-bold text-gray-900">운영시간</h3>
            </div>
            <div className="space-y-3">
              {HOURS.map(h => (
                <div key={h.day} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 font-medium">{h.day}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-violet-700">{h.time}</span>
                    {h.note && <p className="text-[10px] text-gray-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-violet-50 rounded-xl p-3 flex items-center gap-2">
              <Phone size={14} className="text-violet-600 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">전화 예약·문의</p>
                <p className="font-bold text-violet-800">051-000-0000</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-violet-700" />
              </div>
              <h3 className="font-bold text-gray-900">오시는 길</h3>
            </div>
            <div className="w-full aspect-video bg-violet-50 rounded-xl border border-violet-100 flex flex-col items-center justify-center mb-4 text-violet-300">
              <MapPin size={32} />
              <p className="text-xs mt-2">지도는 추후 연동 예정</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-violet-500 shrink-0 mt-0.5" />
                <p>부산광역시 해운대구 해운대로 123 코어핏빌딩 2층</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-orange-500 rounded shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>지하철 2호선 해운대역 1번 출구에서 도보 7분</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>건물 주차장 이용 가능 (1시간 무료, 수업 확인 필수)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 필라테스 스튜디오 플랫폼 데모입니다. 표시된 가격과 정보는 기획안 기반 예시이며 실제 수업이 제공되지 않습니다. 운동 전 전문가 상담을 권장합니다.</p>
      </div>
    </div>
  );
}
