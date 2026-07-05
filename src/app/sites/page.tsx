'use client';

// /sites — 로그인한 회원의 홈페이지(사업장) 목록을 폴더처럼 보여주는 READ 전용 화면.
//
// 표시 전용: 생성·수정·삭제 없음. 카드 클릭 시 이동 배선은 다음 단계 — 지금은 콘솔에
// siteId만 찍는다. 인증은 기존 useSession(→ /api/auth/me)을 재사용하고, 미인증이면
// 기존 로그인 흐름(/api/auth/google)으로 보낸다(새 인증 로직 없음). 데이터는 서버가
// /api/sites(listSitesForMember)에서 읽어 넘긴다.

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { SiteCard } from '@/components/sites/SiteCard';
import type { MemberSite } from '@/lib/registry/registryDb';

export default function SitesPage() {
  const { status } = useSession();
  const [sites, setSites] = useState<MemberSite[] | null>(null);

  // 미인증 → 기존 로그인 흐름(구글) 재사용, 로그인 후 /sites로 복귀
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/api/auth/google?callbackUrl=/sites';
    }
  }, [status]);

  // 인증되면 목록 읽기(서버 = /api/sites)
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/sites')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MemberSite[] | null) => setSites(data ?? []))
      .catch(() => setSites([]));
  }, [status]);

  // 로딩(세션 확인 중 또는 목록 도착 전)
  if (status === 'loading' || (status === 'authenticated' && sites === null)) {
    return (
      <div className="min-h-screen flex items-center gap-3 p-8 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        로딩 중...
      </div>
    );
  }

  // 미인증 리다이렉트 대기 중 — 빈 화면 유지
  if (status === 'unauthenticated') return null;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800">내 홈페이지</h1>
          <p className="text-sm text-stone-500 mt-1">
            만든 홈페이지를 폴더처럼 모아 봅니다
          </p>
        </header>

        {sites && sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 px-6
                          bg-white border border-dashed border-stone-200 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4 text-2xl">
              📁
            </div>
            <p className="text-base font-semibold text-stone-600">아직 만든 홈페이지가 없습니다</p>
            <p className="text-sm text-stone-400 mt-1">새 홈페이지를 만들면 여기에 폴더로 나타납니다</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {sites!.map((site) => (
              <SiteCard
                key={site.siteId}
                site={site}
                onOpen={(siteId) => { window.location.href = `/sites/${siteId}`; }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
