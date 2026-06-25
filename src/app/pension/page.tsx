'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  TreePine, MapPin, Star, ChevronRight, Flame, Waves, Tent, Wind,
  BedDouble, Users, CalendarClock, MessageCircle, Check, Phone, Clock,
} from 'lucide-react';

const ROOMS = [
  {
    id: 'standalone',
    name: '독채 하늘채',
    desc: '프라이빗 독채 — 전용 바베큐·마당·불멍존',
    capacity: '최대 8인',
    price: '350,000',
    tag: '인기',
    tagColor: 'bg-amber-500',
    img: '/pension/pension-room-standalone.jpg',
    features: ['전용 마당·바베큐장', '주방 풀옵션', '킹 침대 2개', '무선 인터넷'],
    icon: Tent,
  },
  {
    id: 'couple',
    name: '커플룸 달빛방',
    desc: '2인 전용 자쿠지 객실 — 프라이빗 테라스 포함',
    capacity: '2인 전용',
    price: '160,000',
    tag: '커플 추천',
    tagColor: 'bg-rose-500',
    img: '/pension/pension-room-couple.jpg',
    features: ['실내 자쿠지 욕조', '킹사이즈 침대', '프라이빗 테라스', '아침 조식 제공'],
    icon: BedDouble,
  },
  {
    id: 'family',
    name: '가족룸 숲속방',
    desc: '복층 구조 — 어린이 놀이 공간·BBQ 그릴 포함',
    capacity: '최대 4인',
    price: '220,000',
    tag: '가족 추천',
    tagColor: 'bg-green-600',
    img: '/pension/pension-room-family.jpg',
    features: ['복층 침실', '어린이 놀이 공간', 'BBQ 그릴 세트', '넓은 거실·소파'],
    icon: Users,
  },
  {
    id: 'jacuzzi',
    name: '프리미엄 자쿠지 스위트',
    desc: '실외 자쿠지 + 파노라마 뷰 — 최고급 침구',
    capacity: '최대 4인',
    price: '300,000',
    tag: '프리미엄',
    tagColor: 'bg-teal-700',
    img: '/pension/pension-room-jacuzzi.jpg',
    features: ['실외 야외 자쿠지', '파노라마 산 전망', '프리미엄 침구 세트', '에스프레소 머신'],
    icon: Waves,
  },
];

const FACILITIES = [
  { icon: Flame, name: '캠프파이어존', desc: '장작 제공, 불멍 즐기기', img: '/pension/pension-campfire.jpg' },
  { icon: Waves, name: '야외 수영장', desc: '6~9월 무료 운영', img: '/pension/pension-pool.jpg' },
  { icon: TreePine, name: '계곡 트레킹', desc: '도보 5분, 청정 계곡', img: '/pension/pension-trail.jpg' },
  { icon: Wind, name: '바베큐장', desc: '숯·그릴 세트 10,000원', img: '/pension/pension-bbq.jpg' },
];

const REVIEWS = [
  { name: '김지우', rating: 5, text: '춘천 근교 최고 펜션이에요. 불멍 하면서 별 보고, 아침엔 새소리에 눈 떴어요. 다음에 또 오겠습니다!', room: '독채 하늘채', date: '2025.11' },
  { name: '이서연', rating: 5, text: '커플룸 달빛방에서 자쿠지 즐기며 환상적인 시간 보냈어요. 조식도 맛있고 청결함도 완벽!', room: '커플룸 달빛방', date: '2025.10' },
  { name: '박현준', rating: 5, text: '아이들이 너무 좋아했어요. 놀이 공간도 넓고 BBQ도 셋업이 잘 되어 있어서 편했습니다.', room: '가족룸 숲속방', date: '2025.09' },
];

function RoomImage({ src, name }: { src: string; name: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-teal-50">
      {err ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-teal-300">
          <BedDouble size={40} />
          <p className="text-xs mt-2 text-teal-400">{name} 사진</p>
          <p className="text-[10px] text-teal-300 mt-1">{src.split('/').pop()}</p>
        </div>
      ) : (
        <Image src={src} alt={name} fill className="object-cover" onError={() => setErr(true)} />
      )}
    </div>
  );
}

function FacilityImage({ src, name, icon: Icon }: { src: string; name: string; icon: typeof Flame }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-teal-50">
      {err ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-teal-300">
          <Icon size={32} />
          <p className="text-xs mt-2 text-teal-400">{name}</p>
        </div>
      ) : (
        <Image src={src} alt={name} fill className="object-cover" onError={() => setErr(true)} />
      )}
    </div>
  );
}

export default function PensionPage() {
  const [heroErr, setHeroErr] = useState(false);
  const [landscapeErr, setLandscapeErr] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4">

      {/* ── Hero ── */}
      <section className="relative rounded-3xl overflow-hidden mb-12 mt-6" style={{ aspectRatio: '21/9', minHeight: 280 }}>
        {heroErr ? (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-700 flex flex-col items-center justify-center text-white">
            <TreePine size={60} className="opacity-60 mb-4" />
            <p className="text-sm opacity-60">pension-exterior.jpg (21:9 권장)</p>
          </div>
        ) : (
          <Image
            src="/pension/pension-exterior.jpg"
            alt="하늘정원 펜션 외관"
            fill
            className="object-cover"
            priority
            onError={() => setHeroErr(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border border-white/30">
            <TreePine size={11} />
            강원도 춘천 · 자연 힐링 펜션 데모
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 leading-tight drop-shadow-lg">
            별빛 아래, 자연 속<br />나만의 하늘정원
          </h1>
          <p className="text-white/85 text-base md:text-lg mb-5 drop-shadow">
            서울에서 1시간 30분 · 남이섬 10분 · 프라이빗 독채부터 커플 자쿠지룸까지
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/pension/reservation" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg">
              <CalendarClock size={15} />
              객실 예약
            </Link>
            <Link href="/pension/chat" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-white/30">
              <MessageCircle size={15} />
              AI 여행 상담
            </Link>
          </div>
        </div>
      </section>

      {/* ── 펜션 소개 ── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <TreePine size={11} />
              펜션 소개
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-tight">
              자연이 선물하는<br />
              <span className="text-teal-700">완전한 쉼표</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              하늘정원 펜션은 강원도 춘천 남산면 깊은 산속에 자리한 프라이빗 힐링 펜션입니다.
              도심의 소음을 벗어나 별빛 가득한 밤하늘 아래에서, 장작 타오르는 캠프파이어 앞에서 진정한 휴식을 경험하세요.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              남이섬에서 차로 10분, 강촌 레일바이크에서 15분 거리에 위치해 춘천의 다양한 명소를 편리하게 즐길 수 있습니다.
              독채부터 커플룸, 가족룸, 자쿠지 스위트까지 목적에 맞는 객실을 선택하세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '체크인', val: '15:00 이후' },
                { label: '체크아웃', val: '11:00 이전' },
                { label: '위치', val: '강원도 춘천시' },
                { label: '남이섬', val: '차로 10분' },
              ].map(({ label, val }) => (
                <div key={label} className="bg-teal-50 rounded-xl p-3">
                  <p className="text-xs text-teal-500 font-semibold">{label}</p>
                  <p className="text-sm font-bold text-teal-900 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {landscapeErr ? (
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 flex flex-col items-center justify-center text-teal-300">
                <TreePine size={48} />
                <p className="text-xs mt-2">pension-landscape.jpg (4:3 권장)</p>
              </div>
            ) : (
              <Image
                src="/pension/pension-landscape.jpg"
                alt="하늘정원 펜션 풍경"
                fill
                className="object-cover"
                onError={() => setLandscapeErr(true)}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── 객실 ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <BedDouble size={11} />
            객실 안내
          </div>
          <h2 className="text-2xl font-black text-gray-900">목적에 맞는 완벽한 객실</h2>
          <p className="text-gray-500 text-sm mt-1">주말 요금은 30,000~50,000원 추가 / 2박 이상 10% 할인</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {ROOMS.map(room => (
            <div key={room.id} className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <RoomImage src={room.img} name={room.name} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-black text-gray-900">{room.name}</h3>
                      <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${room.tagColor}`}>{room.tag}</span>
                    </div>
                    <p className="text-xs text-gray-500">{room.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded-lg">
                    <Users size={11} />
                    {room.capacity}
                  </span>
                  <span className="text-lg font-black text-teal-800">₩{room.price}<span className="text-xs font-normal text-gray-400">/박~</span></span>
                </div>
                <ul className="grid grid-cols-2 gap-y-1 mb-4">
                  {room.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check size={11} className="text-teal-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pension/reservation" className="block w-full text-center bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                  이 객실 예약하기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 부대시설 ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <Tent size={11} />
            부대시설
          </div>
          <h2 className="text-2xl font-black text-gray-900">자연을 만끽하는 공간들</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FACILITIES.map(({ icon: Icon, name, desc, img }) => (
            <div key={name} className="bg-white rounded-2xl border border-teal-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <FacilityImage src={img} name={name} icon={Icon} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Icon size={13} className="text-teal-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{name}</h3>
                </div>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA 예약 ── */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl p-8 md:p-12 text-white text-center">
          <CalendarClock size={36} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-black mb-2">지금 바로 예약하세요</h2>
          <p className="text-teal-200 mb-6 text-sm">주말·연휴는 빠르게 마감됩니다. 원하는 날짜를 미리 잡아두세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pension/reservation" className="flex items-center justify-center gap-2 bg-white text-teal-800 px-6 py-3 rounded-xl font-black text-sm hover:bg-teal-50 transition-colors shadow-lg">
              <CalendarClock size={15} />
              온라인 예약
              <ChevronRight size={14} />
            </Link>
            <Link href="/pension/chat" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors border border-white/30">
              <MessageCircle size={15} />
              AI 여행 상담
            </Link>
          </div>
        </div>
      </section>

      {/* ── 리뷰 ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <Star size={11} />
            투숙 후기
          </div>
          <h2 className="text-2xl font-black text-gray-900">실제 투숙객 이야기</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
            <span className="text-sm text-gray-500 ml-1 font-semibold">5.0 · 후기 148건</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5">
              <div className="flex gap-0.5 mb-3">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">"{r.text}"</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{r.name}</span>
                <div className="text-right">
                  <span className="block text-teal-600 font-medium">{r.room}</span>
                  <span>{r.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 위치·오시는 길 ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <MapPin size={11} />
            오시는 길
          </div>
          <h2 className="text-2xl font-black text-gray-900">찾아오시는 방법</h2>
        </div>
        <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-teal-600" />
                <h3 className="font-black text-gray-900">주소</h3>
              </div>
              <p className="text-gray-700 text-sm mb-1 font-semibold">강원도 춘천시 남산면 하늘정원길 42</p>
              <p className="text-gray-500 text-xs mb-6">우편번호 24401</p>
              <div className="bg-teal-700 rounded-2xl p-4 text-white text-sm">
                <p className="font-bold mb-1">지도 자리</p>
                <p className="text-teal-200 text-xs">실제 서비스에서는 카카오맵·네이버지도 임베드 삽입 예정</p>
                <p className="text-teal-200 text-xs mt-1">좌표: 37.8813° N, 127.6921° E</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: '자가용', icon: '🚗', desc: '서울 → 경춘고속도로 → 남춘천IC → 남산면 방향 · 1시간 30분' },
                { label: '기차', icon: '🚂', desc: 'ITX청춘 서울춘천역 → 남춘천역 하차 → 택시 20분 · 1시간 40분' },
                { label: '버스', icon: '🚌', desc: '동서울터미널 → 춘천터미널 → 남산면행 군내버스 · 2시간 10분' },
                { label: '주변 명소', icon: '🏔️', desc: '남이섬 10분 · 강촌 레일바이크 15분 · 소양강 스카이워크 20분' },
              ].map(({ label, icon, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-teal-50 flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-teal-600" />
                  <span className="font-semibold">033-000-0000</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-teal-600" />
                  <span className="text-xs">운영 09:00~21:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI 상담 배너 ── */}
      <section className="mb-16">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-teal-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-700 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 mb-0.5">AI 여행 컨시어지</h3>
              <p className="text-sm text-gray-500">여행 목적·인원·날짜를 알려주면 최적의 객실과 주변 명소를 추천해 드려요</p>
            </div>
          </div>
          <Link href="/pension/chat" className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap shadow-md">
            <MessageCircle size={14} />
            상담 시작
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
