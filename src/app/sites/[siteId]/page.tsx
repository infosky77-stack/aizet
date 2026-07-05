'use client';

// /sites/[siteId] — 홈페이지 진입 화면. 진입 시 getSiteContext(서버 /api/sites/[siteId])로
// "그 홈페이지 전용 컨텍스트"를 단 한 번 확정하고, 이번 단계에선 그 값을 확인용으로 표시만
// 한다. 슈퍼에디터·파일관리자는 자리(placeholder) 버튼만 — 실제 연결은 다음 단계.
//
// 접근 거부(소유자 아님/없는 siteId): API가 null → /sites 목록으로 돌려보낸다.
// 인증은 기존 useSession 재사용, 미인증이면 기존 구글 로그인 흐름으로 보낸다.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import type { SiteContext } from '@/lib/registry/siteContext';

const INDUSTRY_LABEL: Record<string, string> = {
  catalog: '도록·작품집',
  education: '한국어교육',
  magazine: '잡지',
  video: '영상',
  print: '인쇄',
  product: '제품상세',
  beauty: '뷰티',
};

export default function SiteEnterPage() {
  const router = useRouter();
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId ?? '';
  const { status } = useSession();
  const [ctx, setCtx] = useState<SiteContext | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>('loading');

  // 미인증 → 기존 로그인 흐름(구글), 로그인 후 이 화면으로 복귀
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = `/api/auth/google?callbackUrl=/sites/${siteId}`;
    }
  }, [status, siteId]);

  // 인증되면 컨텍스트 단일 확정(서버). null(소유자 아님/없음)이면 목록으로 복귀.
  useEffect(() => {
    if (status !== 'authenticated' || !siteId) return;
    fetch(`/api/sites/${siteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SiteContext | null) => {
        if (data) {
          setCtx(data);
          setState('ready');
        } else {
          setState('denied');
        }
      })
      .catch(() => setState('denied'));
  }, [status, siteId]);

  // 접근 거부 → /sites 목록으로 돌려보냄
  useEffect(() => {
    if (state === 'denied') router.replace('/sites');
  }, [state, router]);

  if (status === 'loading' || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center gap-3 p-8 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        홈페이지 컨텍스트 확정 중...
      </div>
    );
  }

  if (status === 'unauthenticated' || state === 'denied' || !ctx) return null;

  const industryLabel = INDUSTRY_LABEL[ctx.industry] ?? ctx.industry;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* 목록으로 */}
        <button
          type="button"
          onClick={() => router.push('/sites')}
          className="text-sm text-stone-500 hover:text-stone-700 mb-5"
        >
          ← 내 홈페이지 목록
        </button>

        {/* 상단: 사업장명 크게, 업종·slug 작게 */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 leading-tight">
            {ctx.shopName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
            <span className="font-semibold text-amber-600">{industryLabel}</span>
            {ctx.slug && <span className="text-stone-400">/{ctx.slug}</span>}
            <span className="text-stone-300">·</span>
            <span className="text-stone-400 text-xs">siteId: {ctx.siteId}</span>
          </div>
        </header>

        {/* 확인용: 확정된 컨텍스트 값 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-bold text-stone-500 mb-3">확정된 홈페이지 컨텍스트 (확인용)</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between border-b border-stone-100 py-1">
              <dt className="text-stone-400">사업장명</dt><dd className="font-semibold text-stone-700">{ctx.shopName}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-100 py-1">
              <dt className="text-stone-400">업종</dt><dd className="font-semibold text-stone-700">{industryLabel} ({ctx.industry})</dd>
            </div>
            <div className="flex justify-between border-b border-stone-100 py-1">
              <dt className="text-stone-400">slug</dt><dd className="font-semibold text-stone-700">{ctx.slug || '(없음)'}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-100 py-1">
              <dt className="text-stone-400">siteId</dt><dd className="font-mono text-xs text-stone-600">{ctx.siteId}</dd>
            </div>
          </dl>
        </section>

        {/* 슈퍼에디터 / 파일관리자 진입 — 해당 홈페이지 값을 ?siteId= 로 전달(기존 화면 내부 로직은 아직 미소비) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: '슈퍼에디터', desc: '콘텐츠 편집', href: `/admin/super-editor?siteId=${encodeURIComponent(ctx.siteId)}` },
            { title: '파일관리자', desc: '원장·파일 관리', href: `/admin/super-editor/files?siteId=${encodeURIComponent(ctx.siteId)}` },
          ].map((b) => (
            <button
              key={b.title}
              type="button"
              onClick={() => router.push(b.href)}
              className="flex flex-col items-start text-left bg-white border border-stone-200 rounded-2xl
                         p-6 hover:shadow-md hover:border-amber-300 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span className="text-lg font-bold text-stone-700">{b.title}</span>
              <span className="text-sm text-stone-400 mt-1">{b.desc}</span>
              <span className="mt-3 text-[11px] font-semibold text-amber-600">
                이 홈페이지로 진입 →
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
