'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AizetLogo } from '@/components/AizetLogo';

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* 메인으로 돌아가기 */}
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link href="/" className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>

      {/* 헤더 */}
      <header className="bg-white/95 backdrop-blur border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/catalog" className="flex items-center gap-2.5">
            <AizetLogo className="font-black text-xl tracking-tight" />
            <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full hidden sm:inline">
              도록·작품집
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            <Link href="/catalog" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors hidden sm:block">
              소개
            </Link>
            <Link
              href="/admin/super-editor?type=catalog"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              내 작품집 만들기
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      {/* 푸터 */}
      <footer className="border-t border-stone-100 bg-stone-50 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AizetLogo className="font-bold text-sm" />
            <span className="text-sm text-stone-400 hidden sm:inline">도록·작품집 · by 주식회사 에이젯 (aizet.co.kr)</span>
          </div>
          <p className="text-xs text-stone-400">본 페이지는 AIZET 플랫폼 서비스 안내 페이지입니다.</p>
        </div>
      </footer>
    </div>
  );
}
