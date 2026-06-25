'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Scissors, CheckCircle, Clock, MapPin, Phone,
  CalendarClock, MessageCircle, Star, Sparkles, Heart,
  Zap, Droplets, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { AdminModeButton } from '@/components/AdminModeButton';

// ── 시술 메뉴 ──────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Scissors,
    title: '컷',
    desc: '샴푸·드라이 포함',
    detail: '두상 형태와 얼굴형을 분석해 가장 잘 어울리는 스타일을 제안합니다. 댄디컷부터 레이어드컷까지 폭넓게 가능합니다.',
    price: '여성 35,000원~ / 남성 25,000원~',
    img: '/salon/salon-cut.jpg',
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600 bg-rose-100',
  },
  {
    icon: Sparkles,
    title: '펌',
    desc: '웨이브·볼륨 시술',
    detail: '셋팅펌, 매직스트레이트, 볼륨매직, 히피펌, 허니펌 등 다양한 펌 종류를 모발 상태에 맞게 시술합니다.',
    price: '55,000원~',
    img: '/salon/salon-perm.jpg',
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    icon: Droplets,
    title: '염색',
    desc: '전체·부분·탈색 포함',
    detail: '컬러리스트가 피부톤과 원하는 분위기에 맞는 색상을 제안합니다. 전체염색·뿌리염색·부분하이라이트 가능합니다.',
    price: '55,000원~',
    img: '/salon/salon-color.jpg',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    icon: Zap,
    title: '탈색',
    desc: '고급 탈색제 사용',
    detail: '모발 손상을 최소화하는 고급 탈색제를 사용합니다. 탈색 후 트리트먼트를 병행해 모발 건강을 유지합니다.',
    price: '70,000원~',
    img: '/salon/salon-bleach.jpg',
    color: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600 bg-yellow-100',
  },
  {
    icon: Heart,
    title: '트리트먼트',
    desc: '모발 집중 영양 케어',
    detail: '손상모·건성모를 위한 집중 영양 트리트먼트. 케라틴 단백질 보충으로 윤기 있고 건강한 모발로 가꿔드립니다.',
    price: '30,000원~',
    img: '/salon/salon-treatment.jpg',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    icon: Shield,
    title: '두피케어',
    desc: '두피 스케일링·앰플',
    detail: '두피 진단 후 맞춤 케어. 과지성·건성·민감성 두피에 맞는 스케일링과 앰플로 건강한 두피 환경을 만들어 드립니다.',
    price: '40,000원~',
    img: '/salon/salon-scalp.jpg',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600 bg-blue-100',
  },
];

// ── 디자이너 ───────────────────────────────────────────────────────────────────
const DESIGNERS = [
  {
    name: '박지수',
    role: '원장 / 수석 디자이너',
    career: '경력 15년',
    desc: '파리 로레알 아카데미 수료. 컬러와 펌 전문. 두상과 얼굴형 분석을 통한 맞춤 스타일 제안이 강점입니다.',
    tags: ['컬러', '펌', '컷'],
    img: '/salon/salon-owner.jpg',
    color: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-600',
  },
  {
    name: '김민준',
    role: '실장 / 수석 디자이너',
    career: '경력 8년',
    desc: '모발 복구 전문. 손상모 케어와 탈색·염색 시술이 특기입니다. 자연스러운 그라데이션 컬러를 추구합니다.',
    tags: ['탈색', '염색', '트리트먼트'],
    img: '/salon/salon-designer.jpg',
    color: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-600',
  },
  {
    name: '이수연',
    role: '디자이너',
    career: '경력 4년',
    desc: '트렌디한 스타일 감각으로 20~30대에게 인기. 내추럴 웨이브 펌과 레이어드컷을 주로 담당합니다.',
    tags: ['컷', '웨이브펌', '두피케어'],
    img: '/salon/salon-styling.jpg',
    color: 'bg-pink-50 border-pink-200',
    badge: 'bg-pink-500',
  },
];

// ── 영업시간 ───────────────────────────────────────────────────────────────────
const HOURS = [
  { day: '화~금', time: '10:00 – 20:00', note: '' },
  { day: '토~일', time: '10:00 – 18:00', note: '' },
  { day: '월요일', time: '정기 휴무', note: '' },
];

// ── 리뷰 ───────────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: '김○○', text: '원장님이 얼굴형에 맞는 스타일을 꼼꼼히 상담해 주셨어요. 펌 결과가 너무 예뻐서 주변에서 다들 어디서 했냐고 물어봐요!', stars: 5 },
  { name: '이○○', text: '탈색 후 트리트먼트까지 꼼꼼하게 해주셔서 모발 손상이 거의 없었어요. 가격도 합리적이고 분위기도 너무 좋습니다.', stars: 5 },
  { name: '박○○', text: 'AI 스타일 상담이 너무 유용했어요. 방문 전에 어떤 스타일이 어울릴지 미리 가이드 받고 갔더니 훨씬 수월했습니다.', stars: 5 },
];

// ── 서비스 카드 ────────────────────────────────────────────────────────────────
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
          <span className="text-[10px] font-semibold text-gray-500 bg-white/70 border border-gray-200 px-2 py-0.5 rounded-full">{s.desc}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-2">{s.detail}</p>
        <p className="text-xs font-bold text-rose-600">{s.price}</p>
      </div>
    </div>
  );
}

// ── 디자이너 카드 ──────────────────────────────────────────────────────────────
function DesignerCard({ d }: { d: typeof DESIGNERS[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden bg-white shadow-sm ${d.color}`}>
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <Scissors size={40} />
            <p className="text-xs mt-2">{d.img.split('/').pop()}</p>
          </div>
        ) : (
          <Image
            src={d.img}
            alt={d.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)}
          />
        )}
        <div className={`absolute top-3 left-3 ${d.badge} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}>
          {d.career}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-black text-gray-900 text-lg">{d.name}</h3>
        <p className="text-xs text-rose-600 font-semibold mb-2">{d.role}</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{d.desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {d.tags.map(t => (
            <span key={t} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SalonHome() {
  const [heroImgError, setHeroImgError] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin" />

      {/* ── 1. 살롱 소개 ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Scissors size={13} />
              프리미엄 헤어살롱 · 미용실 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              당신에게 어울리는<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">
                단 하나의 스타일
              </span>{' '}
              을 찾아드립니다
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              15년 경력의 수석 디자이너가 두상·얼굴형·모발 상태를 분석해 당신에게 가장 잘 어울리는
              헤어스타일을 제안합니다. AI 스타일 상담으로 예약 전 미리 방향을 잡아보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/salon/reservation"
                className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <CalendarClock size={16} />
                온라인 예약
              </Link>
              <Link
                href="/salon/chat"
                className="inline-flex items-center justify-center gap-2 border-2 border-rose-200 hover:border-rose-400 text-rose-800 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <MessageCircle size={16} />
                AI 스타일 상담
              </Link>
            </div>
          </div>

          {/* 살롱 인테리어 사진 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-rose-50 border border-rose-100 shadow-lg">
              {heroImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 text-rose-300">
                  <Scissors size={60} />
                  <p className="text-sm mt-3 text-rose-400">salon-interior.jpg</p>
                </div>
              ) : (
                <Image
                  src="/salon/salon-interior.jpg"
                  alt="블루밍 헤어 살롱 인테리어"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setHeroImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-rose-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">수석 디자이너</p>
              <p className="font-black text-gray-900">박지수 원장</p>
              <p className="text-xs text-rose-500 mt-0.5">경력 15년 · 파리 로레알 아카데미</p>
            </div>
          </div>
        </div>

        {/* 살롱 특징 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: CheckCircle, title: '1:1 맞춤 스타일 상담', desc: '두상·얼굴형·라이프스타일을 종합 분석해 나에게 맞는 스타일을 제안합니다.' },
            { icon: Shield, title: '모발 손상 최소화', desc: '시술 전 모발 진단으로 손상을 최소화하는 방법을 먼저 결정하고 시술합니다.' },
            { icon: Star, title: '합리적인 가격', desc: '숨겨진 추가 비용 없이 메뉴판 가격 그대로. 시술 전 정확한 금액을 안내합니다.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. 시술 메뉴 ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">시술 메뉴</h2>
          <p className="text-gray-500 text-sm">모든 가격은 모발 길이·상태에 따라 달라질 수 있습니다. 상담 후 정확한 금액을 안내드립니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SERVICES.map(s => (
            <ServiceCard key={s.title} s={s} />
          ))}
        </div>
      </section>

      {/* ── 3. 디자이너 프로필 ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">디자이너 소개</h2>
          <p className="text-gray-500 text-sm">전문 디자이너와 1:1 상담 후 예약을 진행할 수 있습니다</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {DESIGNERS.map(d => (
            <DesignerCard key={d.name} d={d} />
          ))}
        </div>
      </section>

      {/* ── 4. 온라인 예약 CTA ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <CalendarClock size={13} />
              대기 없이 원하는 시간에 예약
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">온라인 예약</h2>
            <p className="text-rose-100 text-sm">원하는 디자이너와 시술 항목을 선택하고 바로 예약하세요.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { step: '01', title: '시술 선택', desc: '컷·펌·염색·트리트먼트 중 원하는 시술을 선택합니다.' },
              { step: '02', title: '디자이너 선택', desc: '원하는 디자이너와 날짜·시간을 선택합니다.' },
              { step: '03', title: '예약 완료', desc: '예약 확인 문자를 즉시 발송해 드립니다.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white/10 rounded-2xl p-5 text-center">
                <div className="text-3xl font-black text-white/30 mb-2">{step}</div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-xs text-rose-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/salon/reservation"
              className="inline-flex items-center gap-2 bg-white text-rose-700 hover:bg-rose-50 font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              지금 예약하기 <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. AI 스타일 상담 CTA ─────────────────────────────────────── */}
      <section className="mb-16">
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">AI 스타일 상담</h2>
          <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
            어떤 스타일이 나에게 어울릴지 고민되나요? AI가 얼굴형·모발 상태·취향을 분석해 최적의 헤어스타일을 추천해 드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['"둥근 얼굴형인데 어떤 커트가 좋을까요?"', '"펌과 염색을 같이 해도 되나요?"', '"손상모에 어울리는 시술이 있나요?"'].map(ex => (
              <span key={ex} className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full">{ex}</span>
            ))}
          </div>
          <Link
            href="/salon/chat"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            AI 상담 시작 <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 6. 위치·영업시간 ──────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 영업시간 */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-gray-900">영업시간</h3>
            </div>
            <div className="space-y-3">
              {HOURS.map(h => (
                <div key={h.day} className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${h.time === '정기 휴무' ? 'opacity-40' : ''}`}>
                  <span className="text-sm text-gray-600 font-medium">{h.day}</span>
                  <span className={`text-sm font-bold ${h.time === '정기 휴무' ? 'text-gray-400' : 'text-rose-600'}`}>{h.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-rose-50 rounded-xl p-3 flex items-center gap-2">
              <Phone size={14} className="text-rose-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">전화 예약·문의</p>
                <p className="font-bold text-rose-800">02-5678-1234</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">※ 마지막 예약은 마감 1시간 전까지 가능합니다</p>
          </div>

          {/* 위치 */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-gray-900">오시는 길</h3>
            </div>
            <div className="w-full aspect-video bg-rose-50 rounded-xl border border-rose-100 flex flex-col items-center justify-center mb-4 text-rose-300">
              <MapPin size={32} />
              <p className="text-xs mt-2">지도는 추후 연동 예정</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
                <p>서울시 마포구 합정동 456-7 블루밍빌딩 2층</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>지하철 2·6호선 합정역 7번 출구에서 도보 3분</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>건물 앞 공영주차장 이용 가능 (유료)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 리뷰 */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-gray-900 mb-5 text-center">고객 후기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">"{r.text}"</p>
              <p className="text-xs text-gray-400 font-medium">{r.name} 고객</p>
            </div>
          ))}
        </div>
      </section>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 헤어살롱 플랫폼 데모입니다. 표시된 시술 정보와 가격은 기획안 기반 예시이며 실제 시술이 이루어지지 않습니다.</p>
      </div>
    </div>
  );
}
