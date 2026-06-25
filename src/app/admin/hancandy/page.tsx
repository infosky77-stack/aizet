'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Star, Package, Users, ExternalLink,
  Leaf, BarChart3, MessageCircle, AlertCircle,
} from 'lucide-react';
import { CANDY_PRODUCTS } from '@/lib/hancandy/products';

const MOCK_ORDERS = [
  { id: 'HC-001', customer: '김민지', products: ['비타 시트러스 x2', '글로우 피치 x1'], total: 30700, status: '배송중', date: '2026-06-19' },
  { id: 'HC-002', customer: '이수현', products: ['캄 민트 x3'], total: 29700, status: '결제완료', date: '2026-06-19' },
  { id: 'HC-003', customer: '박준호', products: ['에너지 베리 x2', '비타 시트러스 x1'], total: 29800, status: '배송완료', date: '2026-06-18' },
  { id: 'HC-004', customer: '최지은', products: ['글로우 피치 x2'], total: 25800, status: '결제완료', date: '2026-06-18' },
  { id: 'HC-005', customer: '정다연', products: ['에너지 베리 x1', '캄 민트 x1'], total: 20400, status: '배송완료', date: '2026-06-17' },
];

const CHAT_STATS = [
  { query: '"피부 좋아지는 캔디 추천"', count: 42, product: '글로우 피치' },
  { query: '"잠 못 잘 때 뭐가 좋아요"', count: 38, product: '캄 민트' },
  { query: '"운동 전에 먹기 좋은 캔디"', count: 31, product: '에너지 베리' },
  { query: '"면역력 올려주는 거 뭐야"', count: 27, product: '비타 시트러스' },
];

const STATUS_COLORS: Record<string, string> = {
  '결제완료': 'bg-blue-100 text-blue-700',
  '배송중': 'bg-amber-100 text-amber-700',
  '배송완료': 'bg-green-100 text-green-700',
};

const STATS = [
  { icon: ShoppingBag, label: '오늘 주문', value: '12건', sub: '+3 vs 어제', color: 'bg-green-100 text-green-600' },
  { icon: TrendingUp, label: '이번 달 매출', value: '1,284,000원', sub: '목표 대비 64%', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Users, label: 'AI 상담 건수', value: '138건', sub: '오늘 24건', color: 'bg-violet-100 text-violet-600' },
  { icon: Star, label: '평균 평점', value: '4.8점', sub: '리뷰 89개', color: 'bg-amber-100 text-amber-600' },
];

export default function AdminHancandyPage() {
  const [tab, setTab] = useState<'orders' | 'products' | 'chat'>('orders');

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">HanCandy 관리</h1>
          </div>
          <p className="text-sm text-gray-400">무설탕 건강 캔디 · 한캔디 쇼핑몰 데모</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <AlertCircle size={13} />
            사업자 정보 준비중
          </div>
          <Link
            href="/hancandy"
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-semibold px-3 py-1.5 rounded-xl border border-green-200 hover:bg-green-50 transition-colors"
          >
            <ExternalLink size={14} />
            쇼핑몰 보기
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div className="text-xl font-black text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            <div className="text-xs text-green-600 font-semibold mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Business info notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-800 text-sm mb-1">법인 설립 준비 중</div>
          <div className="text-xs text-amber-700 leading-relaxed space-y-0.5">
            <p>사업자등록번호: 준비중 | 통신판매업 신고번호: 준비중 | 대표자: 준비중</p>
            <p>회사명: 주식회사 에이젯 (aizet.co.kr) | 브랜드: 한캔디 (hancandy.co.kr)</p>
            <p>식품 영업 허가 및 건강기능식품 신고 절차 진행 예정</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'orders', label: '주문 관리', icon: ShoppingBag },
          { key: 'products', label: '제품 현황', icon: Package },
          { key: 'chat', label: 'AI 상담 분석', icon: MessageCircle },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-[80px_100px_1fr_100px_90px_90px] gap-4 px-5 py-3 text-xs font-semibold text-gray-400 border-b border-gray-100 bg-gray-50">
            <span>주문번호</span>
            <span>고객</span>
            <span>상품</span>
            <span className="text-right">금액</span>
            <span className="text-center">상태</span>
            <span className="text-right">날짜</span>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_ORDERS.map(o => (
              <div key={o.id} className="grid grid-cols-1 sm:grid-cols-[80px_100px_1fr_100px_90px_90px] gap-2 sm:gap-4 px-5 py-4 hover:bg-green-50/30 transition-colors">
                <span className="text-xs font-mono text-gray-500">{o.id}</span>
                <span className="text-sm font-semibold text-gray-800">{o.customer}</span>
                <div className="flex flex-wrap gap-1">
                  {o.products.map(p => (
                    <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
                <span className="text-sm font-black text-right text-gray-900">{o.total.toLocaleString()}원</span>
                <div className="flex justify-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400 text-right">{o.date}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
            총 {MOCK_ORDERS.length}건 · 데모 데이터
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CANDY_PRODUCTS.map(p => (
            <div key={p.id} className={`rounded-2xl border-2 ${p.bgColor} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.image}</span>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.flavor} · {p.weight}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900 text-sm">{p.price.toLocaleString()}원</div>
                  {p.badge && (
                    <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {p.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-white/60 rounded-xl p-3 text-center text-xs">
                <div>
                  <div className="font-black text-gray-800">38건</div>
                  <div className="text-gray-400 text-[10px]">이번 달 판매</div>
                </div>
                <div>
                  <div className="font-black text-green-600">0g</div>
                  <div className="text-gray-400 text-[10px]">당류</div>
                </div>
                <div>
                  <div className="font-black text-gray-800">4.9⭐</div>
                  <div className="text-gray-400 text-[10px]">평점</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.benefitTags.map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'chat' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-green-500" />
              <h3 className="font-bold text-gray-900 text-sm">AI 상담 인기 질문 TOP 4</h3>
              <span className="text-xs text-gray-400 ml-auto">최근 30일</span>
            </div>
            <div className="space-y-3">
              {CHAT_STATS.map((c, i) => (
                <div key={c.query} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700'
                    : i === 1 ? 'bg-gray-100 text-gray-600'
                    : 'bg-orange-50 text-orange-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{c.query}</div>
                    <div className="text-[10px] text-green-600 font-medium">→ 주로 {c.product} 추천</div>
                  </div>
                  <div className="text-sm font-black text-gray-700 shrink-0">{c.count}건</div>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5 shrink-0">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${(c.count / 42) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="font-bold mb-2 flex items-center gap-2">
              <MessageCircle size={16} />
              AI 상담 전환율
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: '138건', label: '이번 달 상담' },
                { value: '61%', label: '제품 링크 클릭' },
                { value: '34%', label: '장바구니 전환' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-black">{s.value}</div>
                  <div className="text-xs opacity-75 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
