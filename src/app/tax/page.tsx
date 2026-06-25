'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Calculator, MessageCircle, CalendarClock, CheckCircle, Shield, Award, Users, Star, MapPin, Phone, Clock, Building2 } from 'lucide-react';
import { TAX_DEADLINES, DEADLINE_TYPE_LABELS } from '@/lib/tax/data';
import { AdminModeButton } from '@/components/AdminModeButton';
import { useState } from 'react';

// ── 서비스 카드 ─────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: CalendarDays,
    title: '신고 기한 캘린더',
    desc: '부가세·소득세·법인세 신고일정을 한눈에',
    detail: '주요 세금 신고 기한을 월별 캘린더로 확인하고, D-30·D-7 자동 알림으로 가산세 없이 기한을 지킵니다.',
    href: '/tax/calendar',
    img: '/tax/tax-service-filing.jpg',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Calculator,
    title: '세금 계산기',
    desc: '실제 세율 구간 적용 소득세·부가세 계산',
    detail: '2024년 최신 세율 기준 종합소득세·부가세를 즉시 계산합니다. 공제 항목을 반영한 실질 납부액을 확인하세요.',
    href: '/tax/calculator',
    img: '/tax/tax-service-calculator.jpg',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    icon: MessageCircle,
    title: 'AI 세무 상담',
    desc: '세금 질문에 즉시 답변, 절세 전략 안내',
    detail: '24시간 AI 세무 상담사가 부가세·소득세·법인세·절세 전략을 안내합니다. 방문 전 기본 개념을 미리 파악하세요.',
    href: '/tax/chat',
    img: '/tax/tax-service-ai.jpg',
    color: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600 bg-violet-100',
  },
  {
    icon: CalendarClock,
    title: '상담 예약',
    desc: '전문 세무사와 1:1 맞춤 상담 예약',
    detail: '대표 세무사와 1:1 맞춤 세무 상담을 예약합니다. 기장·신고·절세 전략·세무조사 대응까지 상담드립니다.',
    href: '/tax/reservation',
    img: '/tax/tax-service-reservation.jpg',
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600 bg-amber-100',
  },
];

const STRENGTHS = [
  { icon: Shield, title: '20년+ 세무 경력', desc: '개인사업자부터 대기업까지 다양한 세무 경험' },
  { icon: Award,  title: 'AI 기반 절세 분석', desc: 'AI가 수천 개 케이스를 분석해 최적 절세안 제시' },
  { icon: Users,  title: '1,200+ 고객사', desc: '신뢰할 수 있는 세무 파트너로 함께 성장' },
  { icon: CheckCircle, title: '가산세 제로 보장', desc: '신고기한 알림 시스템으로 기한 내 신고 완벽 지원' },
];

const HOURS = [
  { day: '월~금', time: '09:00 – 18:00', note: '' },
  { day: '토요일', time: '09:00 – 13:00', note: '예약 상담만 운영' },
  { day: '일·공휴일', time: '휴무', note: '' },
];

const REVIEWS = [
  { name: '김○○', text: '개인사업자 세금 신고를 매번 혼자 하다가 가산세를 맞은 적이 있었어요. 에이젯 세무법인에 맡긴 뒤로 3년째 가산세 없이 잘 운영하고 있습니다.', stars: 5, tag: '개인사업자' },
  { name: '이○○', text: 'AI 세무 상담이 생각보다 훨씬 정확해서 놀랐어요. 방문 상담 전에 미리 개념을 잡고 갈 수 있어서 상담 시간을 훨씬 효율적으로 쓸 수 있었습니다.', stars: 5, tag: '법인 대표' },
  { name: '박○○', text: '신고 기한 캘린더 덕분에 부가세 신고를 한 번도 빠뜨린 적이 없어요. D-7 알림이 올 때마다 든든합니다.', stars: 5, tag: '프리랜서' },
];

const TODAY_STR = new Date().toISOString().slice(0, 10);
const UPCOMING = TAX_DEADLINES
  .filter(d => d.date >= TODAY_STR)
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(0, 3);

// ── 서비스 카드 컴포넌트 ────────────────────────────────────────────────────
function ServiceCard({ s }: { s: typeof SERVICES[number] }) {
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
            src={s.img}
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

export default function TaxHome() {
  const [accountantImgError, setAccountantImgError] = useState(false);
  const [officeImgError, setOfficeImgError] = useState(false);
  const [consultingImgError, setConsultingImgError] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AdminModeButton href="/admin/tax" />

      {/* ── 1. Hero ────────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Building2 size={13} />
              세무법인 에이젯 · 세무사 플랫폼 데모
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              카드 내역 자동 정리로,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-slate-700">
                기장료 부담을 줄이세요
              </span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-6">
              카드 사용 비율이 90% 이상이라면 거래 내역이 자동 분류·장부화되어
              월 기장료(8~10만원)를 절감할 수 있습니다. 20년 경력의 전문 세무사가 직접 담당합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/tax/reservation"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <CalendarClock size={16} />
                기장료 절감 상담받기
              </Link>
              <Link
                href="/tax/chat"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors bg-white"
              >
                <MessageCircle size={16} />
                AI 세무 상담
              </Link>
            </div>
          </div>

          {/* 대표 세무사 프로필 이미지 */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-lg">
              {accountantImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                  <Users size={60} />
                  <p className="text-sm mt-3 text-slate-400">tax-accountant.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/tax/tax-accountant.jpg</p>
                </div>
              ) : (
                <Image
                  src="/tax/tax-accountant.jpg"
                  alt="세무법인 에이젯 대표 세무사"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setAccountantImgError(true)}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg border border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400 mb-0.5">대표 세무사</p>
              <p className="font-black text-slate-900">이준호 세무사</p>
              <p className="text-xs text-blue-600 mt-0.5">경력 20년 · 세무사회 정회원</p>
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
          <p className="text-slate-500 text-sm">세무 신고부터 절세 전략까지 원스톱으로 지원합니다</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SERVICES.map(s => (
            <ServiceCard key={s.title} s={s} />
          ))}
        </div>
      </section>

      {/* ── 3. 사무실·상담 소개 ────────────────────────────────────── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">세무법인 에이젯</h2>
          <p className="text-slate-500 text-sm">강남 소재 · 개인사업자·법인 전문 세무법인</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {/* 사무실 인테리어 */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="relative w-full aspect-video bg-slate-100">
              {officeImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Building2 size={40} />
                  <p className="text-sm mt-2 text-slate-400">tax-office.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/tax/tax-office.jpg</p>
                </div>
              ) : (
                <Image
                  src="/tax/tax-office.jpg"
                  alt="세무법인 에이젯 사무실"
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
                강남구 역삼동에 위치한 전용 상담 공간에서 편안하게 세무 상담을 받으실 수 있습니다.
                모든 상담은 완전 비밀 보장됩니다.
              </p>
            </div>
          </div>

          {/* 상담 장면 */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="relative w-full aspect-video bg-slate-100">
              {consultingImgError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Users size={40} />
                  <p className="text-sm mt-2 text-slate-400">tax-consulting.jpg</p>
                  <p className="text-xs text-slate-300 mt-1">/public/tax/tax-consulting.jpg</p>
                </div>
              ) : (
                <Image
                  src="/tax/tax-consulting.jpg"
                  alt="세무사 1:1 상담 장면"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => setConsultingImgError(true)}
                />
              )}
            </div>
            <div className="bg-white p-5">
              <h3 className="font-bold text-slate-900 mb-1">1:1 맞춤 세무 상담</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                대표 세무사가 직접 담당합니다. 기장·신고·절세·세무조사 대응까지 업종과
                규모에 맞는 맞춤 전략을 제안드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 다가오는 신고 기한 ──────────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">다가오는 신고 기한</h2>
            <p className="text-xs text-slate-400 mt-0.5">놓치면 가산세가 부과됩니다</p>
          </div>
          <Link href="/tax/calendar" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            전체 일정 <ArrowRight size={13} />
          </Link>
        </div>
        <div className="space-y-3">
          {UPCOMING.map(d => {
            const typeInfo = DEADLINE_TYPE_LABELS[d.type];
            const deadlineDate = new Date(d.date);
            const today = new Date();
            const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
            return (
              <div key={d.id} className={`rounded-2xl border p-4 flex items-center gap-4 ${d.bg}`}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-white shadow-sm">
                  <span className="text-xs font-bold text-slate-600">{d.date.slice(5, 7)}월</span>
                  <span className="text-lg font-black text-slate-900 leading-none">{d.date.slice(8)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {daysLeft <= 30 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        D-{daysLeft}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-800 truncate">{d.title}</div>
                  <div className="text-xs text-slate-600">{d.period} · {d.target}</div>
                </div>
                <Link href="/tax/reservation" className="shrink-0 text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  상담 예약
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. 선택 이유 ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl p-8 md:p-12 mb-16 text-white">
        <h2 className="text-2xl font-black text-center mb-8">세무법인 에이젯을 선택하는 이유</h2>
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
        <h2 className="text-xl font-black text-slate-900 mb-2">세금 질문이 있으신가요?</h2>
        <p className="text-slate-600 text-sm mb-5 max-w-md mx-auto">
          AI 세무 상담사가 24시간 답변합니다. 부가세, 소득세, 절세 전략까지.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['"종합소득세 신고 어떻게 하나요?"', '"부가세 환급 받을 수 있나요?"', '"법인세 절세 방법이 있나요?"'].map(ex => (
            <span key={ex} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full font-medium">{ex}</span>
          ))}
        </div>
        <Link href="/tax/chat" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          AI 세무 상담 시작 <ArrowRight size={15} />
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
                    <span className={`text-sm font-bold ${h.time === '휴무' ? 'text-slate-400' : 'text-blue-600'}`}>{h.time}</span>
                    {h.note && <p className="text-[10px] text-slate-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-50 rounded-xl p-3 flex items-center gap-2">
              <Phone size={14} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">전화 문의</p>
                <p className="font-bold text-blue-800">02-1234-5678</p>
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
                <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p>서울시 강남구 역삼동 123-45 에이젯빌딩 5층</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[8px] font-bold">2</span>
                <p>지하철 2호선 역삼역 3번 출구에서 도보 5분</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-slate-400 font-medium shrink-0 mt-0.5">🅿</span>
                <p>건물 지하 주차장 이용 가능 (1시간 무료)</p>
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
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-2">{r.tag}</span>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">"{r.text}"</p>
              <p className="text-xs text-slate-400 font-medium">{r.name} 고객</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4 text-xs text-gray-400">
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-gray-300" />
        <p>본 페이지는 AIZET의 세무사 플랫폼 데모입니다. 표시된 정보는 참고용이며 실제 세무 서비스가 제공되지 않습니다. 세금 납부 전 반드시 전문가와 상담하세요.</p>
      </div>
    </div>
  );
}
