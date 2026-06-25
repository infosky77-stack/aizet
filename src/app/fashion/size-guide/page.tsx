'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Ruler, RefreshCw, CheckCircle, ArrowRight, Bot, AlertCircle, Info } from 'lucide-react';

type Category = 'top' | 'bottom' | 'outer' | 'dress';

const SIZE_TABLES: Record<Category, { label: string; headers: string[]; rows: string[][] }> = {
  top: {
    label: '상의',
    headers: ['사이즈', '가슴 (cm)', '어깨 (cm)', '총장 (cm)'],
    rows: [
      ['XS', '80~83', '37~38', '61~63'],
      ['S', '84~87', '38~39', '62~64'],
      ['M', '88~91', '40~41', '63~65'],
      ['L', '92~96', '42~43', '64~66'],
      ['XL', '97~101', '44~45', '65~67'],
      ['2XL', '102~107', '46~47', '66~68'],
    ],
  },
  bottom: {
    label: '하의',
    headers: ['사이즈', '허리 (cm)', '엉덩이 (cm)', '허벅지 (cm)', '총장 (cm)'],
    rows: [
      ['XS (24)', '61~64', '87~90', '52~55', '97~99'],
      ['S (25~26)', '65~68', '91~94', '56~59', '98~100'],
      ['M (27~28)', '69~72', '95~98', '60~63', '99~101'],
      ['L (29~30)', '73~77', '99~103', '64~67', '100~102'],
      ['XL (31~32)', '78~83', '104~108', '68~72', '101~103'],
      ['2XL (33~34)', '84~90', '109~115', '73~78', '102~104'],
    ],
  },
  outer: {
    label: '아우터',
    headers: ['사이즈', '가슴 (cm)', '어깨 (cm)', '소매 (cm)', '총장 (cm)'],
    rows: [
      ['XS', '84~87', '38~39', '58~59', '80~82'],
      ['S', '88~91', '40~41', '59~60', '82~84'],
      ['M', '92~96', '42~43', '60~61', '84~86'],
      ['L', '97~101', '44~45', '61~62', '86~88'],
      ['XL', '102~107', '46~47', '62~63', '88~90'],
      ['2XL', '108~114', '48~49', '63~64', '90~92'],
    ],
  },
  dress: {
    label: '원피스·드레스',
    headers: ['사이즈', '가슴 (cm)', '허리 (cm)', '엉덩이 (cm)', '총장 (cm)'],
    rows: [
      ['XS', '80~83', '61~64', '87~90', '88~92'],
      ['S', '84~87', '65~68', '91~94', '90~94'],
      ['M', '88~91', '69~72', '95~98', '92~96'],
      ['L', '92~96', '73~77', '99~103', '94~98'],
      ['XL', '97~101', '78~83', '104~108', '96~100'],
    ],
  },
};

const HOW_TO_MEASURE = [
  { part: '가슴', desc: '겨드랑이 바로 아래, 가슴의 가장 넓은 부분을 수평으로 잽니다.' },
  { part: '어깨', desc: '양쪽 어깨 끝점 사이의 거리를 수평으로 잽니다.' },
  { part: '허리', desc: '허리의 가장 가는 부분을 수평으로 잽니다. 배꼽 위 2~3cm 지점이 일반적입니다.' },
  { part: '엉덩이', desc: '엉덩이의 가장 넓은 부분을 수평으로 잽니다.' },
  { part: '허벅지', desc: '바지를 입었을 때 가장 넓은 허벅지 윗부분을 수평으로 잽니다.' },
  { part: '총장', desc: '어깨 끝점부터 옷의 아랫단까지 수직으로 잽니다.' },
];

const RETURN_POLICY = [
  {
    title: '교환·환불 가능한 경우',
    type: 'ok',
    items: [
      '상품 수령 후 30일 이내 신청',
      '미착용·미세탁 상태의 상품',
      '택(tag)이 그대로 부착된 상품',
      '상품 불량 또는 오배송',
      '상품 정보와 다른 경우 (색상·소재 등)',
    ],
  },
  {
    title: '교환·환불 불가한 경우',
    type: 'no',
    items: [
      '착용·세탁·훼손된 상품',
      '택(tag)이 제거된 상품',
      '수령 후 30일이 경과한 경우',
      '상품에 향수·체취 등이 묻은 경우',
      '이벤트·사은품으로 제공된 상품',
      '주문 제작 상품 (커스텀 자수 등)',
    ],
  },
];

const SHIPPING_POLICY = [
  { label: '기본 배송비', value: '3,000원' },
  { label: '무료배송 기준', value: '50,000원 이상 구매 시' },
  { label: '배송 기간', value: '결제 완료 후 2~3 영업일 이내' },
  { label: '반품 배송비 (단순 변심)', value: '3,000원 (선불)' },
  { label: '반품 배송비 (불량·오배송)', value: '왕복 무료' },
  { label: '교환 배송비', value: '왕복 6,000원 (단순 변심)' },
];

export default function SizeGuidePage() {
  const [category, setCategory] = useState<Category>('top');
  const table = SIZE_TABLES[category];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          <Ruler size={13} />
          사이즈 가이드 &amp; 교환·환불 정책
        </div>
        <h1 className="text-3xl font-black text-stone-900 mb-2">사이즈 가이드</h1>
        <p className="text-stone-500 text-sm">정확한 사이즈 측정으로 온라인 쇼핑 실패를 줄이세요</p>
      </div>

      {/* ── 사이즈 표 ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(Object.entries(SIZE_TABLES) as [Category, typeof SIZE_TABLES[Category]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                category === key
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-orange-300 hover:text-orange-700'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-900 text-white">
                  {table.headers.map((h, i) => (
                    <th key={h} className={`py-3 px-4 font-semibold text-sm ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-orange-50/50 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`py-3 px-4 ${ci === 0 ? 'font-black text-orange-600 text-left' : 'text-center text-stone-600'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-orange-50 rounded-xl p-3 mt-3 text-xs text-orange-700">
          <Info size={13} className="shrink-0 mt-0.5" />
          <p>사이즈는 제품에 따라 1~2cm 내외의 차이가 있을 수 있습니다. 브랜드별 자세한 사이즈는 상품 상세 페이지를 참고해 주세요.</p>
        </div>
      </section>

      {/* ── 측정 방법 ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-black text-stone-900 mb-5 flex items-center gap-2">
          <Ruler size={20} className="text-orange-500" />
          측정 방법
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {HOW_TO_MEASURE.map(({ part, desc }) => (
            <div key={part} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm flex gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <Ruler size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">{part}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 mt-4 text-xs text-amber-700">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <p>줄자를 사용하여 몸에 밀착시켜 측정하세요. 옷 위로 측정하는 경우 실제보다 크게 측정될 수 있습니다.</p>
        </div>
      </section>

      {/* ── AI 스타일 추천 CTA ── */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black mb-1">사이즈 선택이 어렵다면?</h3>
            <p className="text-orange-100 text-sm">AI 스타일리스트에게 체형과 치수를 알려주면 딱 맞는 사이즈를 추천해 드립니다.</p>
          </div>
          <Link
            href="/fashion/chat"
            className="flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <Bot size={16} />
            AI 사이즈 추천 <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 교환·환불 정책 ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-black text-stone-900 mb-5 flex items-center gap-2">
          <RefreshCw size={20} className="text-orange-500" />
          교환·환불 정책
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {RETURN_POLICY.map(({ title, type, items }) => (
            <div key={title} className={`bg-white rounded-2xl border p-5 shadow-sm ${type === 'ok' ? 'border-green-100' : 'border-red-100'}`}>
              <h3 className={`font-bold mb-3 text-sm ${type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{title}</h3>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                    <CheckCircle size={14} className={`shrink-0 mt-0.5 ${type === 'ok' ? 'text-green-500' : 'text-red-400'}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 교환·환불 신청 방법 */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm mt-5">
          <h3 className="font-bold text-stone-900 mb-3">교환·환불 신청 방법</h3>
          <ol className="space-y-2 text-sm text-stone-600">
            {[
              '마이페이지 → 주문 내역에서 교환·환불 신청',
              '사유 선택 및 반품 회수지 입력 (택배 기사 방문 수거)',
              '상품 반송 확인 후 영업일 기준 3~5일 이내 환불 처리',
              '카드 결제 취소는 카드사 정책에 따라 3~5 영업일 소요',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="text-xs text-stone-400 mt-3">고객센터: 평일 09:00~18:00 | 이메일: support@modefashion.co.kr</p>
        </div>
      </section>

      {/* ── 배송 정책 ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-black text-stone-900 mb-5">배송 안내</h2>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {SHIPPING_POLICY.map(({ label, value }, i) => (
            <div key={label} className={`flex justify-between items-center px-5 py-4 text-sm ${i < SHIPPING_POLICY.length - 1 ? 'border-b border-stone-50' : ''}`}>
              <span className="text-stone-600 font-medium">{label}</span>
              <span className="font-bold text-stone-900">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-stone-50 rounded-xl p-3 mt-3 text-xs text-stone-500">
          <Info size={13} className="shrink-0 mt-0.5 text-stone-400" />
          <p>도서·산간 지역은 추가 배송비가 발생할 수 있습니다. 배송 기간은 공휴일 및 택배사 사정에 따라 달라질 수 있습니다.</p>
        </div>
      </section>

      {/* 법적 고지 */}
      <div className="flex items-start gap-2 bg-stone-50 rounded-xl p-4 text-xs text-stone-400">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-stone-300" />
        <p>본 페이지는 AIZET의 의류 쇼핑몰 플랫폼 데모입니다. 기재된 정책과 안내는 데모 기준이며 실제 서비스와 다를 수 있습니다.</p>
      </div>
    </div>
  );
}
