'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Leaf, CheckCircle, Clock, MapPin, Phone,
  Stethoscope, Zap, FlaskConical, Search, Smile, Activity, Users,
  CalendarClock, MessageCircle, Star, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { AdminModeButton } from '@/components/AdminModeButton';

// ── 진료과목 ───────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Search,
    title: '담적 진단·치료',
    desc: '복진·설진으로 담적 확인, 한약으로 근본 치료',
    detail: '소화기에 쌓인 담적(痰積)은 만성피로·두통·구취의 숨은 원인입니다. 복진과 설진으로 담적 유무를 진단하고, 개인 맞춤 한약 처방으로 담적을 녹여 냅니다.',
    img: '/clinic/clinic-damjeok.jpg',
    covered: false,
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    icon: Smile,
    title: '구취·구강건조 케어',
    desc: '소화기-구강 연결 통합 치료',
    detail: '구취와 구강건조는 단순 구강 문제가 아닌 소화기 이상 신호입니다. 담적 치료와 병행해 위장 환경을 바로잡으면 구강 증상이 근본부터 개선됩니다.',
    img: '/clinic/clinic-oral.jpg',
    covered: false,
    color: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600 bg-sky-100',
  },
  {
    icon: Zap,
    title: '침구치료',
    desc: '소화기·통증 완화 경혈 자극. 건강보험 적용 가능',
    detail: '경혈 자극으로 기혈 순환을 개선하고 소화기 기능을 회복합니다. 담적으로 인한 복부 냉증·더부룩함·두통에 특히 효과적이며 건강보험이 적용됩니다.',
    img: '/clinic/clinic-acupuncture.jpg',
    covered: true,
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    icon: FlaskConical,
    title: '한약 처방',
    desc: '담적 해소 중심 체질 맞춤 탕약',
    detail: '담적 치료의 핵심은 한약입니다. 사상체질 분류 후 담을 녹이고 소화기를 회복시키는 맞춤 처방을 진행합니다. 보약·갱년기·면역력 저하에도 폭넓게 적용됩니다.',
    img: '/clinic/clinic-herbal.jpg',
    covered: false,
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600 bg-green-100',
  },
  {
    icon: Activity,
    title: '만성피로·소화불량',
    desc: '검사상 이상 없는 만성 증상의 한방 관리',
    detail: '검사 결과 이상 없는 만성피로·두통·더부룩함은 담적과 연관된 경우가 많습니다. 소화기 기능 회복에 집중한 한방 통합 치료로 원인부터 해결합니다.',
    img: '/clinic/clinic-fatigue.jpg',
    covered: false,
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    icon: Users,
    title: '체질 진단 상담',
    desc: '사상체질 감별 후 1:1 맞춤 치료 계획',
    detail: '태양·태음·소양·소음 체질에 따라 담적 발생 패턴과 치료 반응이 다릅니다. 체질 감별을 먼저 진행하고 최적화된 치료 계획을 수립합니다.',
    img: '/clinic/clinic-constitution.jpg',
    covered: false,
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600 bg-rose-100',
  },
];

// ── 진료과목 카드 (이미지 에러 처리 포함) ─────────────────────────────────────
function ServiceCard({ s }: { s: typeof SERVICES[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden ${s.color}`}>
      <div className="relative w-full aspect-video bg-white/50">
        {imgError ? (
          <div className={`absolute inset-0 flex items-center justify-center ${s.iconColor}`}>
            <s.icon size={36} />
          </div>
        ) : (
          <Image
            src={s.img}
            alt={s.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900">{s.title}</h3>
          {s.covered && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">🏥 보험</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">{s.desc}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{s.detail}</p>
      </div>
    </div>
  );
}

// ── 진료비 ─────────────────────────────────────────────────────────────────────
const PRICE_COVERED = [
  { name: '초진 진찰료', price: '본인부담 약 5,000원', note: '건강보험 적용' },
  { name: '재진 진찰료', price: '본인부담 약 3,500원', note: '건강보험 적용' },
  { name: '침술 (1부위)', price: '본인부담 약 4,500원', note: '건강보험 적용' },
];

const PRICE_NON_COVERED = [
  { name: '담적 정밀 진단', price: '30,000원', note: '복진·설진 포함 집중 진단' },
  { name: '담적 탕약 (10첩)', price: '120,000 ~ 180,000원', note: '증상·체질에 따라 상이' },
  { name: '구취·구강케어 한약 (1개월)', price: '80,000 ~ 150,000원', note: '담적 동반 시 병행 처방' },
  { name: '체질 진단 상담', price: '20,000원', note: '사상체질 감별 + 치료 계획 수립' },
  { name: '보약·일반 탕약 (10첩)', price: '80,000원 ~', note: '처방 복잡도에 따라 상이' },
  { name: '첩약 건강보험 시범 (탕약)', price: '본인부담 30%', note: '요양병원 협약 시범사업 대상자' },
];

// ── 영업시간 ───────────────────────────────────────────────────────────────────
const HOURS = [
  { day: '월·화·목·금', time: '09:00 – 18:30', note: '' },
  { day: '수요일', time: '09:00 – 13:00', note: '오후 휴진' },
  { day: '토요일', time: '09:00 – 13:00', note: '' },
  { day: '일·공휴일', time: '휴진', note: '' },
];

// ── 리뷰 ───────────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: '김○○', text: '3년 넘게 이유 없이 피곤하고 입냄새가 심했는데, 담적 진단 후 한약 2개월 만에 확연히 좋아졌습니다. 이런 개념이 있는지도 몰랐어요.', stars: 5 },
  { name: '이○○', text: '구강건조와 더부룩함이 함께 있었는데 소화기와 연결된 거라는 설명을 듣고 치료를 시작했습니다. 두 가지가 같이 나아져서 신기했어요.', stars: 5 },
  { name: '박○○', text: '체질 상담부터 담적 치료까지 원장님이 꼼꼼하게 설명해 주셔서 믿음이 갔습니다. 만성 두통도 많이 줄었습니다.', stars: 5 },
];

export default function ClinicHome() {
  const [doctorImgError, setDoctorImgError] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin" />

      {/* ── 1. Hero ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Leaf size={13} />
              담적·구강케어 전문 · 한의원 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              원인 모를 만성피로,<br />
              두통, 입냄새 —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                담적이 원인일 수 있습니다
              </span>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              20년 임상 경험의 박영숙 원장이 직접 진료합니다. 복진·설진으로 담적을 정확히 진단하고,
              소화기-구강 연결 케어로 만성 증상의 근본 원인을 해결합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/clinic/reservation"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <CalendarClock size={16} />
                온라인 예약
              </Link>
              <Link
                href="/clinic/chat"
                className="inline-flex items-center justify-center gap-2 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-800 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <MessageCircle size={16} />
                AI 증상 상담
              </Link>
            </div>
          </div>

          {/* 원장 사진 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-emerald-50 border border-emerald-100 shadow-lg">
              {doctorImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 text-emerald-300">
                  <Stethoscope size={60} />
                  <p className="text-sm mt-3 text-emerald-400">clinic-doctor.jpg</p>
                </div>
              ) : (
                <Image
                  src="/clinic/clinic-doctor.jpg"
                  alt="자연한의원 원장 박영숙"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setDoctorImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-emerald-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">대표 원장</p>
              <p className="font-black text-gray-900">박영숙 원장</p>
              <p className="text-xs text-emerald-600 mt-0.5">경희대 한의과 졸업 · 경력 20년</p>
            </div>
          </div>
        </div>

        {/* 담적이란? 간략 설명 */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-xs font-bold text-amber-600 mb-2">담적(痰積)이란?</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            담적은 소화 기능 저하로 위장 점막에 탁한 노폐물(담)이 굳어 쌓이는 상태입니다.
            혈액순환을 방해해 <span className="font-semibold text-gray-800">만성피로·두통·구취·소화불량</span>이
            동시에 나타나는 것이 특징입니다. 내시경·혈액검사에서 이상이 없어도 담적이 원인일 수 있습니다.
          </p>
        </div>

        {/* 진료 철학 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: ShieldCheck, title: '담적 전문 진단', desc: '복진·설진으로 담적 유무와 정도를 평가합니다. 검사 이상 없어도 담적이 원인일 수 있습니다.' },
            { icon: CheckCircle, title: '소화기-구강 통합 케어', desc: '입냄새·구강건조는 소화기 이상과 연결됩니다. 원인인 담적부터 치료해 구강 증상을 해결합니다.' },
            { icon: Star, title: '체질 맞춤 한약', desc: '같은 담적도 체질에 따라 처방이 다릅니다. 체질 감별 후 가장 잘 맞는 탕약을 처방합니다.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-emerald-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. 진료과목 ───────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">진료과목</h2>
          <p className="text-gray-500 text-sm">건강보험 적용 항목은 <span className="text-emerald-600 font-semibold">🏥 보험</span> 표시로 구분됩니다</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SERVICES.map(s => (
            <ServiceCard key={s.title} s={s} />
          ))}
        </div>
      </section>

      {/* ── 3. 진료비 안내 ────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <ShieldCheck size={13} />
              투명한 진료비 공개 — 자연한의원의 차별점
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">진료비 안내</h2>
            <p className="text-emerald-200 text-sm">진료 전 예상 비용을 미리 확인하세요. 추가 청구 없습니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-emerald-200 text-sm mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">건</span>
                건강보험 적용 항목 (본인부담금 기준)
              </h3>
              <div className="space-y-3">
                {PRICE_COVERED.map(p => (
                  <div key={p.name} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-emerald-300 text-xs mt-0.5">{p.note}</p>
                    </div>
                    <p className="text-white font-bold text-sm shrink-0">{p.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-emerald-200 text-sm mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">비</span>
                비급여 항목
              </h3>
              <div className="space-y-3">
                {PRICE_NON_COVERED.map(p => (
                  <div key={p.name} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-emerald-300 text-xs mt-0.5">{p.note}</p>
                    </div>
                    <p className="text-white font-bold text-sm shrink-0">{p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-emerald-300 mt-6">
            ※ 실제 납부금액은 보험 종류·개인 부담률·처방 내용에 따라 다를 수 있습니다. 진료 전 상담 시 안내드립니다.
          </p>
        </div>
      </section>

      {/* ── 4. 온라인 예약 CTA ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarClock size={28} className="text-emerald-700" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">온라인 예약</h2>
          <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
            대기 없이 원하는 날짜와 시간에 예약하세요. 예약 확인 문자를 즉시 발송해 드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['담적 진단', '구취·구강케어', '침구치료', '한약 상담', '체질 진단'].map(t => (
              <span key={t} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
          <Link
            href="/clinic/reservation"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            예약하기 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 5. AI 증상 상담 CTA ───────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-3xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h2 className="text-2xl font-black mb-2">AI 증상 상담</h2>
          <p className="text-emerald-100 text-sm mb-5 max-w-md mx-auto">
            증상을 말씀해 주세요. AI가 담적 연관 가능성과 추천 치료 방향을 안내해 드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['"이유 없이 항상 피곤해요"', '"입냄새가 심해요"', '"속이 자주 더부룩해요"', '"만성 두통이 있어요"'].map(ex => (
              <span key={ex} className="text-xs bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full">{ex}</span>
            ))}
          </div>
          <Link
            href="/clinic/chat"
            className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            AI 상담 시작 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 6. 위치·영업시간 ──────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-emerald-700" />
              </div>
              <h3 className="font-bold text-gray-900">영업시간</h3>
            </div>
            <div className="space-y-3">
              {HOURS.map(h => (
                <div key={h.day} className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${h.time === '휴진' ? 'opacity-40' : ''}`}>
                  <span className="text-sm text-gray-600 font-medium">{h.day}</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${h.time === '휴진' ? 'text-gray-400' : 'text-emerald-700'}`}>{h.time}</span>
                    {h.note && <p className="text-[10px] text-gray-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
              <Phone size={14} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">전화 예약·문의</p>
                <p className="font-bold text-emerald-800">02-1234-5678</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-emerald-700" />
              </div>
              <h3 className="font-bold text-gray-900">오시는 길</h3>
            </div>
            <div className="w-full aspect-video bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center mb-4 text-emerald-300">
              <MapPin size={32} />
              <p className="text-xs mt-2">지도는 추후 연동 예정</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p>서울시 강남구 역삼동 123-45 자연빌딩 3층</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>지하철 2호선 역삼역 3번 출구에서 도보 5분</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>건물 지하 주차장 이용 가능 (30분 무료)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 환자 후기 */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-gray-900 mb-5 text-center">환자 후기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">"{r.text}"</p>
              <p className="text-xs text-gray-400 font-medium">{r.name} 환자</p>
            </div>
          ))}
        </div>
      </section>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 한의원 플랫폼 데모입니다. 표시된 의료 정보와 가격은 기획안 기반 예시이며 실제 진료가 이루어지지 않습니다. 의료적 결정은 반드시 자격을 갖춘 의료인과 상담 후 진행하세요.</p>
      </div>
    </div>
  );
}
