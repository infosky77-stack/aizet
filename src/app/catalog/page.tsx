'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Star } from 'lucide-react';
import { CATALOG_STRENGTHS, SAMPLE_ARTWORKS } from '@/lib/catalog/data';

const SampleFlipbook = dynamic(
  () => import('@/components/catalog/CatalogFlipbook'),
  { ssr: false },
);

const SAMPLE_FLIPBOOK_ARTWORKS = SAMPLE_ARTWORKS.map((a, i) => ({
  id: String(i),
  imageUrl: a.src,
  title: a.title,
  year: a.year,
  medium: a.medium,
  size: '',
  description: '',
}));


export default function CatalogHome() {
  // 모바일에서 화면폭에 맞게 플립북 크기 조정, 데스크톱은 380 고정
  const [flipW, setFlipW] = useState(380);
  const [flipH, setFlipH] = useState(Math.round(380 * 424 / 300));
  useEffect(() => {
    const update = () => {
      const w = Math.min(380, Math.max(260, window.innerWidth - 32));
      setFlipW(w);
      setFlipH(Math.round(w * 424 / 300));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="bg-white">

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-stone-50 px-6 pt-28 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.2em]">
            AIZET FullAutoCatalog
          </p>
          <h1 className="text-5xl md:text-[4.5rem] font-black leading-[1.05] tracking-tight text-stone-950">
            작가의 격에 맞는<br />
            <span className="text-stone-400">작품집, AI로 완성하다</span>
          </h1>
          <p className="text-stone-500 text-base md:text-lg leading-relaxed max-w-lg">
            작품 이미지와 정보를 입력하면 AI가 갤러리급 도록을 자동으로 편집합니다.
            전문 디자이너 없이, 파주출판도시 인쇄 품질로.
          </p>
          <Link
            href="/admin/super-editor?type=catalog"
            className="inline-flex items-center gap-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-9 py-4 rounded-xl transition-colors shadow-sm"
          >
            <BookOpen size={16} />
            내 작품집 만들기
            <ArrowRight size={15} />
          </Link>
          <p className="text-stone-400 text-xs tracking-wide">
            기본 제작비 30,000원 · 작품 1점당 3,000원
          </p>
        </div>
      </section>

      {/* ── 2a. 도록으로 넘겨보기 — catalog-bg-2 (화사한 추상 배경) ────── */}
      <section className="relative bg-stone-50 py-20 px-4 sm:px-6 overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/catalog/catalog-bg-2.jpg" alt="" className="w-full h-full object-cover" style={{ opacity: 0.65 }} />
          <div className="absolute inset-0 bg-white/28" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold text-stone-700 uppercase tracking-[0.2em] mb-5 text-center">
            샘플 — 실제 작품 이미지
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 text-center mb-3 tracking-tight">
            이렇게 완성됩니다
          </h2>
          <p className="text-stone-800 text-sm text-center mb-12">
            A4 한 페이지에 작품 한 점 — 제목·재료·연도가 캡션으로 자동 구성됩니다
          </p>

          {/* 도록으로 넘겨보기 소제목 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-amber-500/70" />
            <span className="text-[11px] font-semibold text-amber-800 tracking-[0.18em] uppercase shrink-0">도록으로 넘겨보기</span>
            <div className="h-px flex-1 bg-amber-500/70" />
          </div>

          {/* 인터랙티브 힌트 */}
          <div className="flex justify-center mb-8">
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-300 px-4 py-1.5 rounded-full font-semibold shadow-sm">
              ← 페이지를 클릭하거나 드래그해서 직접 넘겨보세요 →
            </span>
          </div>

          {/* 샘플 플립북 — 크게 */}
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <SampleFlipbook
              artworks={SAMPLE_FLIPBOOK_ARTWORKS}
              exhibitionTitle="AIZET 초대전"
              artistName="샘플 작가"
              pageW={flipW}
              pageH={flipH}
              forcePortrait
            />
          </div>
          <p className="text-stone-500 text-xs text-center mt-6">
            ※ 위 작품은 AIZET 도록 서비스 샘플입니다.
          </p>
        </div>
      </section>

      {/* ── 2b. 작품 갤러리 — catalog-bg-1 (차분한 추상 배경) ──────────── */}
      <section className="relative bg-stone-50 py-20 px-4 sm:px-6 overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/catalog/catalog-bg-1.jpg" alt="" className="w-full h-full object-cover" style={{ opacity: 0.6 }} />
          <div className="absolute inset-0 bg-white/28" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* 작품 갤러리 소제목 */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-px flex-1 bg-amber-500/70" />
            <span className="text-[11px] font-semibold text-amber-800 tracking-[0.18em] uppercase shrink-0">작품 갤러리</span>
            <div className="h-px flex-1 bg-amber-500/70" />
          </div>

          {/* 작품 세로 배치 — 한 장씩 크게 */}
          <div className="flex flex-col gap-20">
            {SAMPLE_ARTWORKS.map((a, i) => (
              <div key={i} className="flex flex-col gap-4">
                {/* 작품 카드 — 흰 배경 + 그림자로 배경 위에 떠 보이게 */}
                <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.src}
                    alt={a.title}
                    className="w-full object-contain max-h-[560px] sm:max-h-[680px]"
                    draggable={false}
                  />
                </div>
                {/* 작품 정보 */}
                <div className="text-center">
                  <p className="font-bold text-stone-900 text-base">{a.title}</p>
                  <p className="text-stone-700 text-sm mt-1">{a.medium} · {a.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 도록이란? ─────────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-5 text-center">
            도록이란
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 text-center mb-16 leading-tight">
            작가에게 도록(圖錄)이<br />왜 필요한가
          </h2>
          <div className="flex flex-col divide-y divide-stone-200">
            {[
              {
                n: '01',
                title: '전시의 기록, 작가의 이력',
                body: '전시가 끝나면 작품은 흩어지지만 도록은 남습니다. 전시 제목·출품작·작가 노트를 한 권에 묶어 영구적인 예술 기록물로 만들어 드립니다. 갤러리·미술관 입점 제안, 레지던시 지원, 해외 아트페어 출품 시 작가 포트폴리오로 활용됩니다.',
              },
              {
                n: '02',
                title: '작품 판매와 소장 가치',
                body: '컬렉터에게 작품을 팔 때 도록 한 권을 함께 건네는 것은 작품의 공신력과 소장 가치를 높이는 가장 확실한 방법입니다. 작품 제목·재료·크기·연도·에디션이 인쇄된 도록은 진위 증명서 역할도 합니다.',
              },
              {
                n: '03',
                title: '비용의 벽을 AI가 허문다',
                body: '기존 도록은 편집 디자이너 고용·인쇄 최소 발주량 문제로 수백만 원이 들었습니다. AIZET은 AI 자동 편집과 소량 인쇄 제휴로 이 비용을 대폭 낮춥니다. 신진 작가도 전시마다 자신만의 도록을 가질 수 있습니다.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-8 py-10 first:pt-0 last:pb-0">
                <span className="text-stone-200 font-black text-3xl tabular-nums shrink-0 leading-none mt-1">
                  {n}
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. AIZET 도록의 강점 ─────────────────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-5 text-center">
            강점
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 text-center mb-16">
            왜 AIZET 도록인가
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATALOG_STRENGTHS.map((s, i) => (
              <div key={i} className="border border-stone-100 rounded-2xl p-8 flex flex-col gap-3 bg-white hover:border-stone-200 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-stone-300 font-black text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-bold text-stone-900 leading-tight">
                    {s.title}
                    {s.badge && (
                      <span className="ml-2 text-[10px] font-semibold border border-stone-300 text-stone-500 px-2 py-0.5 rounded-full align-middle">
                        {s.badge}
                      </span>
                    )}
                  </h3>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. 이용 방법 ─────────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-5 text-center">
            이용 방법
          </p>
          <h2 className="text-3xl font-black text-stone-950 text-center mb-16 tracking-tight">
            내 작품집 만드는 법
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                step: '01',
                title: '작품 사진 준비',
                desc: '정면에서 자연광 또는 밝은 조명 아래 고화질로 촬영합니다. 반사·그림자가 없는 깨끗한 이미지일수록 도록이 선명하게 나옵니다.',
                tip: '스마트폰 카메라로도 충분합니다. 화소보다 조명이 중요합니다.',
              },
              {
                step: '02',
                title: '업로드 & 작품 정보 입력',
                desc: '편집 화면에서 작품 이미지를 올리고, 각 작품의 제목·제작연도·재료·크기를 입력합니다. QR 스캔으로 스마트폰에서 바로 전송도 가능합니다.',
                tip: '입력한 순서대로 도록 페이지가 만들어집니다.',
              },
              {
                step: '03',
                title: 'AI 자동 레이아웃 & 미리보기',
                desc: '전시명·작가명을 입력하면 AI가 갤러리 도록 레이아웃으로 자동 편집합니다. A4 미리보기에서 완성본을 확인한 뒤 순서를 조정할 수 있습니다.',
                tip: '작품 순서는 드래그 없이 ▲▼ 버튼으로 간편하게 변경합니다.',
              },
              {
                step: '04',
                title: '도록 PDF 완성 & 인쇄',
                desc: '결제 후 고해상도 PDF를 즉시 다운로드합니다. 직접 출력하거나 파주출판도시 전문 인쇄소에 의뢰해 고급 아트지로 제작할 수 있습니다.',
                tip: '기본 제작비 30,000원 + 작품 1점당 3,000원.',
              },
            ].map(({ step, title, desc, tip }) => (
              <div key={step} className="bg-white border border-stone-100 rounded-2xl p-8 flex flex-col gap-3">
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-black text-stone-200 leading-none tabular-nums shrink-0">{step}</span>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base mb-2">{title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
                <div className="ml-[3.75rem] border-l-2 border-stone-100 pl-3">
                  <p className="text-xs text-stone-400 leading-relaxed">💡 {tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 바로 시작 CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/admin/super-editor?type=catalog"
              className="inline-flex items-center gap-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              <BookOpen size={15} />
              지금 바로 시작하기
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. 촬영 가이드 자리 (준비중) ────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="border border-dashed border-stone-200 rounded-2xl p-14 text-center flex flex-col items-center gap-3">
            <Star size={22} className="text-stone-200" />
            <h3 className="font-semibold text-stone-400 text-sm">작품 촬영 가이드 — 준비중</h3>
            <p className="text-stone-300 text-xs max-w-sm leading-relaxed">
              사진 촬영 요령·장비 추천·출장 촬영 서비스 안내가 이 자리에 추가될 예정입니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. 하단 CTA ─────────────────────────────────────────────────── */}
      <section className="bg-stone-50 border-t border-stone-100 py-28 px-6">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-7">
          <div className="w-10 h-px bg-stone-300" />
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 leading-tight tracking-tight">
            지금 바로<br />내 작품집을 만들어보세요
          </h2>
          <p className="text-stone-500 text-base leading-relaxed">
            작품 이미지만 있으면 됩니다. 편집은 AI가 합니다.
          </p>
          <Link
            href="/admin/super-editor?type=catalog"
            className="inline-flex items-center gap-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base px-9 py-4 rounded-xl transition-colors shadow-sm"
          >
            <BookOpen size={16} />
            내 작품집 만들기
            <ArrowRight size={15} />
          </Link>
          <p className="text-stone-400 text-sm">
            기본 제작비 30,000원 + 작품 1점당 3,000원 · PDF 즉시 다운로드
          </p>
        </div>
      </section>

    </div>
  );
}
