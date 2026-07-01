'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MessageCircle, CalendarClock, CheckCircle, Shield, Award, Users, Star, MapPin, Phone, Clock, Landmark } from 'lucide-react';
import { LEGAL_SERVICES, SERVICE_CATEGORY_LABELS } from '@/lib/legal/data';
import { AdminModeButton } from '@/components/AdminModeButton';
import { useState } from 'react';

// ── 서비스 카드 ─────────────────────────────────────────────────────────────
const FEATURED_SERVICES = [
  {
    icon: Landmark,
    title: '부동산 소유권 이전 등기',
    desc: '매매·증여·상속 등기를 한번에',
    detail: '아파트·토지·상가 등 부동산 거래 시 소유권 이전 등기 전 과정을 대리합니다. 취득세 신고부터 등기 완료까지 원스톱으로 처리합니다.',
    href: '/legal/guides',
    color: 'bg-cyan-50 border-cyan-200',
    iconColor: 'text-cyan-600 bg-cyan-100',
  },
  {
    icon: Users,
    title: '법인 설립 / 변경 / 해산 등기',
    desc: '주식회사·비영리법인 설립 대리',
    detail: '주식회사, 유한회사, 비영리법인 설립부터 임원 변경·자본금 증감·해산까지 법인 생애주기 전반의 등기를 처리합니다.',
    href: '/legal/guides',
    color: 'bg-indigo-50 border-indigo-200',
    iconColor: 'text-indigo-600 bg-indigo-100',
  },
  {
    icon: MessageCircle,
    title: 'AI 법무 상담',
    desc: '법무 질문에 즉시 답변, 절차 안내',
    detail: '24시간 AI 법무 상담사가 등기 절차, 필요 서류, 비용 등을 안내합니다. 방문 전 기본 개념을 미리 파악하세요.',
    href: '/legal/chat',
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    icon: CalendarClock,
    title: '상담 예약',
    desc: '전문 법무사와 1:1 맞춤 상담',
    detail: '대표 법무사와 1:1 맞춤 법무 상담을 예약합니다. 등기·서류 작성·경매 대리·개인회생까지 상담드립니다.',
    href: '/legal/reservation',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
];

const STRENGTHS = [
  { icon: Shield,      title: '15년+ 법무 경력', desc: '부동산 등기부터 법인 설립까지 폭넓은 실무 경험' },
  { icon: Award,       title: 'AI 기반 서류 분석', desc: 'AI가 등기부등본·권리관계를 신속 분석해 리스크 사전 파악' },
  { icon: Users,       title: '800+ 처리 실적', desc: '개인·법인·경매 낙찰자까지 다양한 고객 경험' },
  { icon: CheckCircle, title: '당일 서류 검토', desc: '접수 당일 서류 검토 후 진행 일정 안내' },
];

const HOURS = [
  { day: '월~금', time: '09:00 – 18:00', note: '' },
  { day: '토요일', time: '09:00 – 13:00', note: '예약 상담만 운영' },
  { day: '일·공휴일', time: '휴무', note: '' },
];

const REVIEWS = [
  { name: '김○○', text: '아파트 매매 후 소유권 이전 등기를 처음 혼자 진행하려다 너무 복잡해서 맡겼는데, 사흘 만에 깔끔하게 처리해 주셨어요. 취득세 신고까지 같이 해주셔서 너무 편했습니다.', stars: 5, tag: '소유권 이전' },
  { name: '이○○', text: '스타트업 법인 설립할 때 도움을 받았어요. 자본금 설정부터 정관 작성, 등기 완료까지 빠르게 처리해 주셨고, 이후 임원 변경도 바로 맡겼습니다.', stars: 5, tag: '법인 설립' },
  { name: '박○○', text: '아버지 돌아가신 후 부동산 상속 등기 처리가 막막했는데, 상속인 협의 과정부터 등기 완료까지 친절하게 안내해 주셨어요. AI 상담으로 미리 절차를 파악한 게 도움이 됐습니다.', stars: 5, tag: '상속 등기' },
];

function ServiceCard({ s }: { s: typeof FEATURED_SERVICES[number] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Link href={s.href} className={`rounded-2xl border overflow-hidden hover:shadow-md transition-shadow group block ${s.color}`}>
      <div className="relative w-full aspect-video bg-white/50">
        {imgError ? (
          <div className={`absolute inset-0 flex items-center justify-center ${s.iconColor}`}>
            <s.icon size={36} />
          </div>
        ) : (
          <Image
            src={`/legal/legal-service-${s.title.includes('소유권') ? 'registration' : s.title.includes('법인') ? 'corporate' : s.title.includes('AI') ? 'ai' : 'reservation'}.jpg`}
            alt={s.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.iconColor}`}>
            <s.icon size={15} />
          </div>
          <h3 className="font-bold text-gray-900">{s.title}</h3>
          <ArrowRight size={13} className="ml-auto text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
        </div>
        <p className="text-xs text-gray-500 mb-2">{s.desc}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{s.detail}</p>
      </div>
    </Link>
  );
}

export default function LegalHome() {
  const [lawyerImgError, setLawyerImgError] = useState(false);
  const [officeImgError, setOfficeImgError] = useState(false);
  const [consultingImgError, setConsultingImgError] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin/legal" />

      {/* ── 1. Hero ────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Landmark size={13} />
              법무사 에이젯 · 법무사 플랫폼 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              등기·법인·상속,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-slate-700">
                복잡한 법무를 쉽게
              </span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-6">
              부동산 소유권 이전부터 법인 설립, 상속 등기, 개인회생까지.
              15년 경력의 전문 법무사가 서류 작성부터 등기 완료까지 원스톱으로 처리합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/legal/reservation"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <CalendarClock size={16} />
                무료 상담 예약하기
              </Link>
              <Link
                href="/legal/chat"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <MessageCircle size={16} />
                AI 법무 상담
              </Link>
            </div>
          </div>

          {/* 대표 법무사 프로필 이미지 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-lg">
              {lawyerImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                  <Users size={60} />
                  <p className="text-sm mt-3 text-slate-400">legal-lawyer.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/legal/legal-lawyer.jpg</p>
                </div>
              ) : (
                <Image
                  src="/legal/legal-lawyer.jpg"
                  alt="법무사 에이젯 대표 법무사"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setLawyerImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400 mb-0.5">대표 법무사</p>
              <p className="font-black text-slate-900">최지훈 법무사</p>
              <p className="text-xs text-cyan-600 mt-0.5">경력 15년 · 법무사회 정회원</p>
            </div>
          </div>
        </div>

        {/* 강점 요약 배지 */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STRENGTHS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-slate-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. 서비스 메뉴 ─────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">주요 서비스</h2>
          <p className="text-slate-500 text-sm">등기·서류 작성부터 경매 대리까지 원스톱으로 지원합니다</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURED_SERVICES.map(s => (
            <ServiceCard key={s.title} s={s} />
          ))}
        </div>
      </section>

      {/* ── 3. 전체 서비스 목록 ────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">전체 서비스</h2>
          <p className="text-slate-500 text-sm">법무사 에이젯이 제공하는 모든 법무 서비스</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGAL_SERVICES.map(s => {
            const cat = SERVICE_CATEGORY_LABELS[s.category];
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 ${cat.bg} ${cat.color}`}>{cat.label}</span>
                <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{s.title}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{s.desc}</p>
                <p className="text-[11px] text-cyan-700 font-semibold border-t border-slate-50 pt-2">{s.fee}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Link href="/legal/guides" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold text-sm border border-slate-200 hover:border-slate-400 px-5 py-2.5 rounded-xl transition-colors bg-white">
            서비스 상세 안내 <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── 4. 사무실·상담 소개 ────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">법무사 에이젯</h2>
          <p className="text-slate-500 text-sm">서초구 소재 · 부동산·법인·상속 전문 법무사 사무소</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="relative w-full aspect-video bg-slate-100">
              {officeImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Landmark size={40} />
                  <p className="text-sm mt-2 text-slate-400">legal-office.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/legal/legal-office.jpg</p>
                </div>
              ) : (
                <Image
                  src="/legal/legal-office.jpg"
                  alt="법무사 에이젯 사무실"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setOfficeImgError(true)}
                />
              )}
            </div>
            <div className="bg-white p-5">
              <h3 className="font-bold text-slate-900 mb-1">쾌적한 상담 환경</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                서초구 서초동에 위치한 전용 상담 공간에서 편안하게 법무 상담을 받으실 수 있습니다.
                모든 상담은 완전 비밀 보장됩니다.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="relative w-full aspect-video bg-slate-100">
              {consultingImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Users size={40} />
                  <p className="text-sm mt-2 text-slate-400">legal-consulting.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/legal/legal-consulting.jpg</p>
                </div>
              ) : (
                <Image
                  src="/legal/legal-consulting.jpg"
                  alt="법무사 1:1 상담 장면"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setConsultingImgError(true)}
                />
              )}
            </div>
            <div className="bg-white p-5">
              <h3 className="font-bold text-slate-900 mb-1">1:1 맞춤 법무 상담</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                대표 법무사가 직접 담당합니다. 등기 절차, 필요 서류, 비용 안내부터
                경매·개인회생 등 복잡한 사건까지 맞춤 전략을 제안드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 선택 이유 ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-800 to-cyan-900 rounded-3xl p-8 md:p-12 mb-16 text-white">
        <h2 className="text-2xl font-black text-center mb-8">법무사 에이젯을 선택하는 이유</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STRENGTHS.map(s => (
            <div key={s.title} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <s.icon size={20} className="text-white" />
              </div>
              <div className="font-bold text-sm mb-1">{s.title}</div>
              <div className="text-xs text-slate-300 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. AI 상담 CTA ──────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center mb-16">
        <div className="text-3xl mb-3">🤖</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">법무 절차가 궁금하신가요?</h2>
        <p className="text-slate-600 text-sm mb-5 max-w-md mx-auto">
          AI 법무 상담사가 24시간 답변합니다. 등기 절차, 필요 서류, 비용까지.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['"아파트 등기 어떻게 하나요?"', '"법인 설립 비용이 얼마예요?"', '"상속 등기 서류가 뭐가 필요해요?"'].map(ex => (
            <span key={ex} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full font-medium">{ex}</span>
          ))}
        </div>
        <Link href="/legal/chat" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          AI 법무 상담 시작 <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── 7. 위치·영업시간 ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-slate-700" />
              </div>
              <h3 className="font-bold text-slate-900">운영시간</h3>
            </div>
            <div className="space-y-3">
              {HOURS.map(h => (
                <div key={h.day} className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${h.time === '휴무' ? 'opacity-40' : ''}`}>
                  <span className="text-sm text-slate-600 font-medium">{h.day}</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${h.time === '휴무' ? 'text-slate-400' : 'text-cyan-600'}`}>{h.time}</span>
                    {h.note && <p className="text-[10px] text-slate-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-cyan-50 rounded-xl p-3 flex items-center gap-2">
              <Phone size={14} className="text-cyan-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">전화 문의</p>
                <p className="font-bold text-cyan-800">02-9876-5432</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-slate-700" />
              </div>
              <h3 className="font-bold text-slate-900">오시는 길</h3>
            </div>
            <div className="w-full aspect-video bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center mb-4 text-slate-300">
              <MapPin size={32} />
              <p className="text-xs mt-2">지도는 추후 연동 예정</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                <p>서울시 서초구 서초동 456-78 에이젯빌딩 3층</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>지하철 2호선 서초역 3번 출구에서 도보 3분</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-slate-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>건물 지하 주차장 이용 가능 (30분 무료)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. 고객 후기 ────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-slate-900 mb-5 text-center">고객 후기</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full inline-block mb-2">{r.tag}</span>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">"{r.text}"</p>
              <p className="text-xs text-slate-400 font-medium">{r.name} 고객</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 법무사 플랫폼 데모입니다. 표시된 정보는 참고용이며 실제 법무 서비스가 제공되지 않습니다. 법률 문제는 반드시 전문 법무사·변호사와 상담하세요.</p>
      </div>
    </div>
  );
}
