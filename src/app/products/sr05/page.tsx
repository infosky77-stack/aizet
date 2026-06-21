'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChevronLeft,
  Server,
  Cpu,
  BatteryFull,
  Thermometer,
  Shield,
  Layers,
  Zap,
  Globe,
  BarChart3,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Activity,
  Box,
  Package,
  WifiOff,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

/* ─── Hero Gallery ──────────────────────────────────────── */
const HERO_IMAGES = [
  { src: '/products/sr05-hero.jpg',  alt: 'AIZET-SR-05 메인 컷' },
  { src: '/products/sr05-hero2.jpg', alt: 'AIZET-SR-05 추가 컷 2' },
  { src: '/products/sr05-hero3.jpg', alt: 'AIZET-SR-05 추가 컷 3' },
];

function HeroGallery() {
  const [active, setActive] = useState(0);
  const prev = () => setActive(a => (a - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  const next = () => setActive(a => (a + 1) % HERO_IMAGES.length);

  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-3" style={{ width: 480 }}>
        {/* Main image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/40 border border-slate-700 group">
          <Image
            key={HERO_IMAGES[active].src}
            src={HERO_IMAGES[active].src}
            alt={HERO_IMAGES[active].alt}
            width={480}
            height={360}
            className="object-cover w-full"
            priority={active === 0}
          />
          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
          {/* Dot indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={clsx(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === active ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'
                )}
              />
            ))}
          </div>
        </div>
        {/* Thumbnails */}
        <div className="flex gap-2">
          {HERO_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={clsx(
                'flex-1 rounded-xl overflow-hidden border-2 transition-all',
                i === active ? 'border-cyan-400 shadow-lg shadow-cyan-500/20' : 'border-slate-700 opacity-60 hover:opacity-90'
              )}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={150}
                height={90}
                className="object-cover w-full h-16"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Advantages ───────────────────────────────────────── */
const AZOS_ADV = [
  {
    icon: <Shield size={16} />,
    title: '메모리 안전성',
    desc: '가비지 컬렉터 없이 메모리 오류를 컴파일 시점에 차단. 드론·로봇 제어처럼 오작동이 사고로 이어지는 환경에 필수.',
  },
  {
    icon: <Activity size={16} />,
    title: '실시간성',
    desc: 'GC 멈춤이 없어 응답 지연이 예측 가능. 드론 군집 제어처럼 타이밍이 중요한 작업에 최적.',
  },
  {
    icon: <Zap size={16} />,
    title: '고성능 저자원',
    desc: 'C/C++급 속도에 적은 메모리 사용량. 스마트폰처럼 자원이 제한된 디바이스에도 적합.',
  },
  {
    icon: <Cpu size={16} />,
    title: '동시성 처리',
    desc: '수백 개 노드를 동시에 안전하게 제어. 데이터 레이스를 컴파일러가 원천 차단.',
  },
  {
    icon: <Globe size={16} />,
    title: '크로스플랫폼',
    desc: 'ARM 기반 스마트폰 프로세서에도 쉽게 컴파일. 다양한 디바이스에 동일한 코드베이스 배포.',
  },
];

const HW_ADV = [
  {
    icon: <Box size={16} />,
    title: '범용 하드웨어',
    desc: '갤럭시 스마트폰을 노드로 사용. 전세계 어디서나 구매·교체·수리 가능.',
  },
  {
    icon: <BatteryFull size={16} />,
    title: '올인원 노드',
    desc: '폰 1대에 배터리·디스플레이·카메라·센서·Snapdragon 8 Elite Gen 5 for Galaxy NPU(전작 대비 39% 성능 향상)가 모두 내장.',
  },
  {
    icon: <Package size={16} />,
    title: '현장 즉시 배치',
    desc: '보안 잠금 케이스 + 휴대용 디자인. 행사장·현장에 바로 설치 가능.',
  },
  {
    icon: <Plus size={16} />,
    title: '모듈식 확장',
    desc: '폰을 추가하면 컴퓨팅 파워가 그만큼 늘어남. 수요에 맞게 점진적으로 증설.',
  },
  {
    icon: <WifiOff size={16} />,
    title: '온디바이스 AI',
    desc: 'Snapdragon 8 Elite Gen 5 NPU로 클라우드 연결 없이 로컬 AI 추론. 인터넷 없는 현장에서도 동작.',
  },
];

function AdvantagesSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-2">Why SR-05</p>
          <h2 className="text-3xl font-bold text-slate-900">왜 Rust OS + 스마트폰인가</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            소프트웨어와 하드웨어 양쪽의 선택이 SR-05의 핵심입니다.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AZOS — dark */}
          <div className="bg-slate-900 rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-cyan-400 font-black text-xs">Rs</span>
              </div>
              <div>
                <p className="font-bold text-white text-sm">AZOS · Rust 기반 OS</p>
                <p className="text-[11px] text-slate-400">안전성과 실시간성을 컴파일 수준에서 보장</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {AZOS_ADV.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hardware — light */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Server size={15} className="text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">AIZET-SR-05 · 하드웨어</p>
                <p className="text-[11px] text-slate-400">전세계 어디서나 구할 수 있는 스마트폰이 서버가 됩니다</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {HW_ADV.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key differentiator banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Zap size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-1">핵심 차별점</p>
            <p className="text-white text-sm leading-relaxed">
              저렴하고 어디서나 구할 수 있는 하드웨어 + 안전성이 검증된 Rust OS로,{' '}
              <span className="text-cyan-300 font-semibold">전용 서버랙 없이 스마트폰 몇 대로 현장형 AI 오케스트레이션 인프라를 즉석에서 구성</span>합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Data ─────────────────────────────────────────────── */
const CONFIGS = [
  {
    id: 5,
    label: '스타터',
    nodes: 5,
    price: 14500000,
    perNode: 2900000,
    desc: '소규모 AI 추론 / 개발·테스트 환경',
    azosFeatures: ['자동 부하 분산', '노드 헬스체크', '원격 모니터링'],
    badge: null,
    color: 'border-slate-200',
  },
  {
    id: 10,
    label: '스탠다드',
    nodes: 10,
    price: 26000000,
    perNode: 2600000,
    desc: '중소기업 AI 서비스 / 엣지 추론 클러스터',
    azosFeatures: ['자동 부하 분산', '노드 헬스체크', '원격 모니터링', '이중화 failover', '배치 스케줄링'],
    badge: '인기',
    color: 'border-cyan-400 shadow-xl shadow-cyan-100',
  },
  {
    id: 50,
    label: '프로',
    nodes: 50,
    price: 115000000,
    perNode: 2300000,
    desc: '대용량 AI 서비스 / 다거점 분산 배포',
    azosFeatures: ['자동 부하 분산', '노드 헬스체크', '원격 모니터링', '이중화 failover', '배치 스케줄링', '멀티 클러스터', '전담 온보딩'],
    badge: null,
    color: 'border-slate-200',
  },
  {
    id: 200,
    label: '엔터프라이즈',
    nodes: 200,
    price: 0,
    perNode: 0,
    desc: '대형 AI 데이터센터 대체 / 국가·공공 인프라',
    azosFeatures: ['모든 프로 기능', '전담 SRE 팀', 'SLA 99.9%', '커스텀 AZOS 구성', '현장 설치·유지보수'],
    badge: '협의',
    color: 'border-slate-200',
  },
];

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: '초저전력 AI 추론',
    desc: '갤럭시 S26 울트라의 Snapdragon 8 Elite Gen 5 for Galaxy NPU로 GPU 대비 1/8 전력으로 동일한 추론 성능.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: <Thermometer size={20} />,
    title: '항온항습 내장 섀시',
    desc: '19인치 랙마운트 섀시에 냉각 챔버와 습도 제어 모듈 내장. 서버실 없이 일반 사무공간에 설치 가능.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <BatteryFull size={20} />,
    title: 'UPS 자체 배터리',
    desc: '노드당 72Wh 배터리 내장. 정전 시 최소 4시간 무중단 운영. 외부 UPS 없이 독립 운영 가능.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: <Shield size={20} />,
    title: '진동차단·충격흡수',
    desc: '군용 MIL-STD-810 기준 진동 차단 마운트 적용. 공장·물류창고 등 진동 환경에서도 안정적 운영.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <Cpu size={20} />,
    title: 'Snapdragon 8 Elite Gen 5 NPU',
    desc: '갤럭시 S26 울트라 내장 NPU. 전작 대비 39% 성능 향상. 한국어 LLM·비전·음성 모델 온디바이스 추론.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: <Layers size={20} />,
    title: '모듈형 확장',
    desc: '5노드 단위 핫스왑 확장. 서비스 중단 없이 노드 추가·교체. 수요에 맞게 점진적으로 확장.',
    color: 'bg-orange-50 text-orange-600',
  },
];

const SPECS = [
  { label: '노드 디바이스', value: 'Samsung Galaxy S26 Ultra (2026)' },
  { label: 'AP', value: 'Snapdragon 8 Elite Gen 5 for Galaxy' },
  { label: 'AI NPU', value: 'Snapdragon 8 Elite Gen 5 내장 NPU (전작 대비 39% 성능 향상)' },
  { label: 'RAM / 스토리지', value: '24GB LPDDR6 / 512GB UFS 4.1' },
  { label: '노드당 소비전력', value: '최대 12W (추론 시) / 대기 2.4W' },
  { label: '배터리 (노드당)', value: '5,000mAh / 72Wh' },
  { label: '인터페이스', value: 'USB4 Gen3 × 2 / Wi-Fi 7 / 5G mmWave' },
  { label: '섀시 폼팩터', value: '19인치 랙마운트 / 2U (10노드 기준)' },
  { label: '냉각 방식', value: '능동형 수냉 + 항온항습 챔버 (±0.5°C)' },
  { label: '진동 규격', value: 'MIL-STD-810H Method 514.8' },
  { label: '동작 온도', value: '-10°C ~ 50°C' },
  { label: 'AZOS 관리 인터페이스', value: '웹 대시보드 / REST API / gRPC' },
];

const FAQS = [
  {
    q: '기존 GPU 서버와 비교해 어떤 장점이 있나요?',
    a: 'GPU 서버 대비 소비전력 1/8, 발열 1/6, 부피 1/4 수준입니다. 특히 소형 모델(7B~30B) 추론에서는 H100 단일 GPU와 10노드 SR-05의 처리량이 유사하며, 전력비·공간·냉각비용을 크게 줄일 수 있습니다.',
  },
  {
    q: 'AZOS 코어는 어떻게 노드를 관리하나요?',
    a: 'AZOS는 각 노드의 온도·배터리·부하 상태를 실시간 모니터링하고, 요청을 최적 노드에 자동 라우팅합니다. 노드 장애 시 1초 이내 failover하며, 업데이트도 롤링 방식으로 무중단 진행됩니다.',
  },
  {
    q: '어떤 AI 모델을 실행할 수 있나요?',
    a: 'llama.cpp, Ollama, MLC-LLM 기반 양자화 모델(GGUF/GGML)이 기본 지원됩니다. Llama 3.2, Qwen2.5, HyperCLOVA X 등 7B~70B 파라미터 모델을 클러스터 분산 추론으로 실행합니다. 비전·음성 파이프라인도 지원.',
  },
  {
    q: '일반 사무공간에도 설치 가능한가요?',
    a: '네. 10노드 기준 소음 38dB 이하, 발열 600W 이하로 일반 사무실 설치 가능합니다. 별도 항온항습 서버실이 필요 없으며, 표준 220V 콘센트 2구로 운영됩니다.',
  },
  {
    q: '보안 인증은 어떻게 되나요?',
    a: '국가정보원 CC 인증(EAL4+) 획득 예정(2026 Q4). 현재 ISO 27001 준비 중. 온-프레미스 완전 폐쇄망 구성 가능하며, 데이터가 외부로 나가지 않습니다.',
  },
];

/* ─── Components ────────────────────────────────────────── */
function NodeVisual({ count }: { count: number }) {
  const show = Math.min(count, 10);
  return (
    <div className="relative">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(show, 5)}, 1fr)` }}>
        {Array.from({ length: show }).map((_, i) => (
          <div
            key={i}
            className="aspect-[9/19] rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 flex flex-col items-center justify-between p-1 shadow-lg"
            style={{ minWidth: '28px', maxWidth: '40px' }}
          >
            <div className="w-3 h-0.5 bg-slate-500 rounded-full mt-0.5" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-sm bg-cyan-400 animate-pulse" />
              </div>
              <div className="w-3 h-2 rounded-sm bg-slate-600" />
            </div>
            <div className="flex gap-0.5 mb-0.5">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              <div className="w-1 h-1 rounded-full bg-blue-400" />
            </div>
          </div>
        ))}
      </div>
      {count > 10 && (
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
          +{count - 10}
        </div>
      )}
      {/* Chassis frame */}
      <div className="absolute -inset-3 border-2 border-dashed border-slate-600/40 rounded-2xl pointer-events-none" />
      <div className="absolute -top-5 left-0 text-[10px] text-slate-400 font-mono">AIZET-SR-05 chassis</div>
    </div>
  );
}

function AzosVisual({ nodes }: { nodes: number }) {
  return (
    <div className="relative bg-slate-900 rounded-2xl p-6 overflow-hidden border border-slate-700">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 to-slate-900 pointer-events-none" />
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center">
            <Activity size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">AZOS Core · 실시간 클러스터 현황</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: '활성 노드', value: `${nodes}/${nodes}`, color: 'text-emerald-400' },
            { label: '평균 부하', value: '23%', color: 'text-cyan-400' },
            { label: '추론 요청/s', value: nodes * 14 + '', color: 'text-violet-400' },
          ].map(m => (
            <div key={m.label} className="bg-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 mb-1">{m.label}</div>
              <div className={clsx('text-sm font-black', m.color)}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Node grid */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {Array.from({ length: Math.min(nodes, 10) }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-2 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-slate-400 font-mono">N{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${15 + ((i * 17) % 60)}%` }}
                />
              </div>
            </div>
          ))}
          {nodes > 10 && (
            <div className="bg-slate-700/50 rounded-lg p-2 flex items-center justify-center">
              <span className="text-[9px] text-slate-400">+{nodes - 10}개</span>
            </div>
          )}
        </div>

        {/* Events log */}
        <div className="bg-slate-800 rounded-xl p-3 font-mono text-[10px] space-y-1">
          {[
            { color: 'text-emerald-400', text: `[OK] 클러스터 ${nodes}노드 전체 정상` },
            { color: 'text-cyan-400',    text: '[SCHED] 추론 요청 → N03, N07, N11 라우팅' },
            { color: 'text-yellow-400',  text: '[TEMP] N05 온도 41°C → 냉각 강화' },
            { color: 'text-slate-400',   text: '[BAT] 평균 배터리 88% · 그리드 연결됨' },
          ].map((l, i) => (
            <div key={i} className={l.color}>{l.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function SR05Page() {
  const [selectedConfig, setSelectedConfig] = useState(10);
  const config = CONFIGS.find(c => c.id === selectedConfig)!;

  return (
    <div className="min-h-screen bg-white">
      {/* Topbar */}
      <div className="bg-slate-950 text-slate-300 text-xs text-center py-2 px-4">
        <span className="text-cyan-400 font-semibold">AIZET-SR-05</span> · 2026년 4분기 출시 예정 · 사전예약 접수 중
      </div>

      {/* Nav */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors text-sm">
            <ArrowLeft size={15} />
            AIZET 홈
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center">
              <Server size={13} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">AIZET-SR-05</span>
          </div>
          <a
            href="#order"
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            사전예약
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white py-20 px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(6,182,212,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.06),transparent_50%)]" />

        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Cpu size={11} />
                갤럭시 S26 Ultra × Snapdragon 8 Elite Gen 5
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                국산 AI 인프라
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              AIZET<span className="text-cyan-400">-SR-05</span><br />
              <span className="text-2xl sm:text-3xl font-bold text-slate-300">모바일 분산 서버 클러스터</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              스마트폰이 서버가 됩니다. 갤럭시 S26 울트라를 분산 노드로 묶고 Snapdragon 8 Elite Gen 5 NPU로 가속한 초저전력 AI 추론 클러스터. GPU 서버실이 필요 없습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#configure"
                className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-cyan-900/40"
              >
                구성 선택하기 <ArrowRight size={15} />
              </a>
              <a
                href="#specs"
                className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
              >
                사양서 보기
              </a>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-slate-400">
              {[
                { v: 'GPU 대비 1/8 전력', c: 'text-yellow-400' },
                { v: '서버실 불필요', c: 'text-emerald-400' },
                { v: 'Snapdragon 8 Elite Gen 5 NPU', c: 'text-cyan-400' },
              ].map(({ v, c }) => (
                <span key={v} className="flex items-center gap-1.5">
                  <Check size={12} className={c} />
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="flex-1 flex justify-center">
            <HeroGallery />
          </div>
        </div>
      </section>

      <AdvantagesSection />

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-2">Hardware</p>
            <h2 className="text-3xl font-bold text-slate-900">엔지니어링 차별점</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', f.color)}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AZOS Core section */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">AZOS Core</p>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              노드 관리,<br />
              <span className="text-cyan-400">AZOS가 알아서</span> 합니다
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
              AZOS 코어 소프트웨어가 클러스터 전체를 자율 관리합니다. 부하 분산·장애 복구·온도 제어·배터리 밸런싱까지 — 운영자 개입 없이 자동으로.
            </p>
            <ul className="space-y-3">
              {[
                '실시간 부하 모니터링 및 자동 라우팅',
                '노드 장애 1초 이내 failover',
                '온도·배터리 기반 동적 클로킹',
                'REST API / gRPC 통합 인터페이스',
                '롤링 업데이트로 무중단 패치',
                '멀티 사이트 분산 클러스터 지원',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Check size={14} className="text-cyan-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full max-w-lg">
            <AzosVisual nodes={selectedConfig} />
          </div>
        </div>
      </section>

      {/* Configuration selector */}
      <section id="configure" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-2">Pricing</p>
            <h2 className="text-3xl font-bold text-slate-900">노드 구성 선택</h2>
            <p className="text-slate-500 mt-2 text-sm">규모에 맞는 구성을 선택하세요. 나중에 노드 추가도 가능합니다.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {CONFIGS.map(cfg => (
              <button
                key={cfg.id}
                onClick={() => setSelectedConfig(cfg.id)}
                className={clsx(
                  'relative text-left rounded-2xl border-2 p-5 transition-all bg-white',
                  selectedConfig === cfg.id ? cfg.color : 'border-slate-200 hover:border-slate-300'
                )}
              >
                {cfg.badge && (
                  <span className={clsx(
                    'absolute -top-2.5 left-4 text-xs font-bold px-2.5 py-0.5 rounded-full',
                    cfg.badge === '인기' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-white'
                  )}>
                    {cfg.badge}
                  </span>
                )}
                <div className="text-xs font-semibold text-slate-400 mb-1">{cfg.label}</div>
                <div className="text-2xl font-black text-slate-900 mb-0.5">{cfg.nodes}<span className="text-sm font-semibold text-slate-400 ml-1">노드</span></div>
                <div className="text-xs text-slate-400 mb-3">{cfg.desc}</div>
                {cfg.price > 0 ? (
                  <>
                    <div className="text-lg font-black text-slate-900">₩{(cfg.price / 10000).toLocaleString()}만</div>
                    <div className="text-xs text-slate-400">노드당 ₩{(cfg.perNode / 10000).toFixed(1)}만</div>
                  </>
                ) : (
                  <div className="text-base font-bold text-slate-500">견적 문의</div>
                )}
              </button>
            ))}
          </div>

          {/* Selected config detail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                    <Server size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{config.label} — {config.nodes}노드 구성</div>
                    <div className="text-xs text-slate-400">{config.desc}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {config.azosFeatures.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={13} className="text-cyan-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-64 shrink-0">
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="text-xs text-slate-400 mb-1">예상 공급가 (VAT 별도)</div>
                  {config.price > 0 ? (
                    <>
                      <div className="text-3xl font-black text-slate-900">₩{(config.price / 10000).toLocaleString()}<span className="text-base font-semibold text-slate-400 ml-1">만원</span></div>
                      <div className="text-xs text-slate-400 mt-1">노드당 ₩{(config.perNode / 10000).toFixed(1)}만원</div>
                    </>
                  ) : (
                    <div className="text-xl font-bold text-slate-700">별도 협의</div>
                  )}
                </div>
                <a
                  href="#order"
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
                >
                  {config.price > 0 ? '사전예약 신청' : '견적 문의'}
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section id="specs" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-2">Specifications</p>
            <h2 className="text-3xl font-bold text-slate-900">기술 사양</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {SPECS.map((s, i) => (
              <div key={s.label} className={clsx('flex items-start px-5 py-3.5 gap-4', i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                <div className="w-40 shrink-0 text-xs font-semibold text-slate-400">{s.label}</div>
                <div className="text-sm text-slate-800 font-medium">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">* 사양은 출시 전까지 변경될 수 있습니다.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">자주 묻는 질문</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Order / Inquiry */}
      <section id="order" className="py-20 px-4 bg-slate-950">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Box size={26} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2">Pre-order</p>
            <h2 className="text-3xl font-bold text-white mb-3">2026년 4분기 출시 예정</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              사전예약 시 노드당 10% 할인 + 우선 설치·온보딩 지원. 지금 문의해 두시면 출시 즉시 우선 공급됩니다.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <a
              href="tel:02-1234-5678"
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <Phone size={15} />
              전화 문의
            </a>
            <a
              href="mailto:sr05@aizet.co.kr"
              className="flex-1 flex items-center justify-center gap-2 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <Mail size={15} />
              이메일 문의
            </a>
          </div>
          <p className="text-slate-500 text-xs">sr05@aizet.co.kr · 영업일 24시간 이내 회신</p>
        </div>
      </section>

      {/* Footer mini */}
      <div className="bg-slate-950 border-t border-slate-800 py-5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>© 2026 AIZET Corp. AIZET-SR-05는 등록상표입니다.</span>
          <Link href="/" className="hover:text-slate-400 transition-colors">aizet.co.kr</Link>
        </div>
      </div>
    </div>
  );
}
