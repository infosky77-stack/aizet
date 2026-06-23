'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart3, Package, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { AizetLogo } from '@/components/AizetLogo';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const ERROR_MSG: Record<string, string> = {
  oauth_failed:    '구글 로그인에 실패했습니다. 다시 시도해 주세요.',
  token_exchange:  '인증 코드 교환에 실패했습니다. 다시 시도해 주세요.',
  user_info:       '계정 정보를 가져오지 못했습니다. 다시 시도해 주세요.',
  invalid_state:   '인증 요청이 만료됐습니다. 다시 시도해 주세요.',
  not_configured:  'Google OAuth가 아직 설정되지 않았습니다.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';
  const errorKey = searchParams.get('error') || '';
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) window.location.href = callbackUrl;
    });
  }, [callbackUrl]);

  function handleGoogleLogin() {
    setLoading(true);
    window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <LayoutDashboard size={13} className="text-white" />
          </div>
          <AizetLogo className="font-bold text-base tracking-tight" />
        </Link>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">← 홈으로</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8">
          <div className="flex flex-col gap-1.5 mb-8">
            <h1 className="text-2xl font-bold text-stone-900">로그인</h1>
            <p className="text-stone-500 text-sm">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-amber-600 font-semibold hover:underline">무료로 시작하기</Link>
            </p>
          </div>

          {errorKey && (
            <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{ERROR_MSG[errorKey] || '오류가 발생했습니다. 다시 시도해 주세요.'}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60 rounded-xl text-sm font-semibold text-stone-700 transition-colors flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-stone-400" /> : <GoogleIcon />}
            {loading ? '구글로 이동 중...' : 'Google 계정으로 로그인'}
          </button>

          <p className="text-center text-xs text-stone-400 mt-4">
            로그인 시 구글 드라이브 파일 접근 권한이 함께 요청됩니다.
          </p>

          <div className="mt-8 bg-stone-50 border border-stone-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <LayoutDashboard size={15} className="text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-700">AZOS 대시보드</p>
                <p className="text-[11px] text-stone-400 mt-0.5">로그인 후 매출·주문·예약을 한눈에 관리</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <BarChart3 size={12} />, label: '매출 분석' },
                { icon: <Package size={12} />, label: '주문 관리' },
                { icon: <Calendar size={12} />, label: '예약 관리' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-stone-600">
                  {icon}{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-amber-600" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
