'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Leaf, CheckCircle, Clock, MapPin, Phone,
  Stethoscope, CalendarClock, MessageCircle, Star, Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { AdminModeButton } from '@/components/AdminModeButton';
import {
  DEMO_SHOP_INFO, DEMO_HOURS, DEMO_REVIEWS,
  CLINIC_HERO, DAMJEOK_EXPLANATION, PHILOSOPHY_CARDS,
  CLINIC_BASE_SERVICES as SERVICES,
  PRICE_COVERED, PRICE_NON_COVERED, PRICING_NOTE,
  RESERVATION_TOPICS, AI_SAMPLE_QUESTIONS, DISCLAIMER,
  CLINIC_DOCTOR_IMAGE,
  type ClinicServiceItem,
} from '@/lib/industry/clinicBase';

// ── 진료과목 카드 ──────────────────────────────────────────────────────────────
function ServiceCard({ s }: { s: ClinicServiceItem }) {
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

export default function ClinicHome() {
  const [doctorImgError, setDoctorImgError] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href={DEMO_SHOP_INFO.adminHref} />

      {/* ── 1. Hero ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Leaf size={13} />
              {DEMO_SHOP_INFO.specialization} · 한의원 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
              {CLINIC_HERO.title}<br />
              {CLINIC_HERO.titleLine2}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                {CLINIC_HERO.titleAccent}
              </span>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              {DEMO_SHOP_INFO.heroDescription}
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
                  src={CLINIC_DOCTOR_IMAGE}
                  alt={`${DEMO_SHOP_INFO.shopName} ${DEMO_SHOP_INFO.doctorName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setDoctorImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-emerald-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">대표 원장</p>
              <p className="font-black text-gray-900">{DEMO_SHOP_INFO.doctorName}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{DEMO_SHOP_INFO.doctorCareer}</p>
            </div>
          </div>
        </div>

        {/* 담적이란? 간략 설명 */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-xs font-bold text-amber-600 mb-2">담적(痰積)이란?</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {DAMJEOK_EXPLANATION.split('만성피로·두통·구취·소화불량')[0]}
            <span className="font-semibold text-gray-800">만성피로·두통·구취·소화불량</span>
            {DAMJEOK_EXPLANATION.split('만성피로·두통·구취·소화불량')[1]}
          </p>
        </div>

        {/* 진료 철학 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PHILOSOPHY_CARDS.map(({ icon: Icon, title, desc }) => (
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
              <CheckCircle size={13} />
              투명한 진료비 공개 — {DEMO_SHOP_INFO.shopName}의 차별점
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
            ※ {PRICING_NOTE}
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
            {RESERVATION_TOPICS.map(t => (
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
            {AI_SAMPLE_QUESTIONS.map(ex => (
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
              {DEMO_HOURS.map(h => (
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
                <p className="font-bold text-emerald-800">{DEMO_SHOP_INFO.phone}</p>
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
                <p>{DEMO_SHOP_INFO.address}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>{DEMO_SHOP_INFO.subwayInfo}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>{DEMO_SHOP_INFO.parkingInfo}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 환자 후기 ──────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-gray-900 mb-5 text-center">환자 후기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {DEMO_REVIEWS.map(r => (
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

      {/* ── 만들기 CTA ──────────────────────────────────────────────── */}
      <div className="my-10 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-10 text-center">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Sparkles size={11} />
          AIZET 한의원 홈페이지 플랫폼
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          이런 홈페이지,<br className="sm:hidden" /> 내 한의원에도 만들고 싶다면?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          사진과 가게 정보만 주시면 AI가 자동으로 만들어 드립니다.
        </p>
        <Link
          href="/clinic/create"
          className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #C9A227, #e0b83a)' }}
        >
          <Sparkles size={17} />
          내 한의원 홈페이지 만들기
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-gray-300" />
        <p>{DISCLAIMER}</p>
      </div>
    </div>
  );
}
