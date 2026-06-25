import Link from 'next/link';
import { Settings } from 'lucide-react';

export function AdminModeButton({ href }: { href: string }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href={href}
        className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md text-gray-600 hover:text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
      >
        <Settings size={12} />
        관리자 모드
      </Link>
    </div>
  );
}
