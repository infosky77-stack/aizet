import Link from 'next/link';
import { BookOpen, Home, TestTube, GraduationCap, MessageCircle, LayoutDashboard } from 'lucide-react';

export default function KoreanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <header className="bg-white border-b border-indigo-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/korean" className="flex items-center gap-2 font-bold text-indigo-700">
            <BookOpen size={20} className="text-indigo-500" />
            <span>한국어 배우기</span>
            <span className="text-xs font-normal text-indigo-400 hidden sm:inline">Korean with AIZET</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/korean" className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <Home size={15} /><span className="hidden sm:inline">홈</span>
            </Link>
            <Link href="/korean/test" className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <TestTube size={15} /><span className="hidden sm:inline">레벨 테스트</span>
            </Link>
            <Link href="/korean/learn" className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <GraduationCap size={15} /><span className="hidden sm:inline">학습</span>
            </Link>
            <Link href="/korean/chat" className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <MessageCircle size={15} /><span className="hidden sm:inline">AI 회화</span>
            </Link>
            <Link href="/korean/dashboard" className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
              <LayoutDashboard size={15} /><span className="hidden sm:inline">대시보드</span>
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
