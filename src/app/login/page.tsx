'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  ArrowRight,
  LayoutDashboard,
  BarChart3,
  Calendar,
  Package,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = '올바른 이메일을 입력해 주세요';
    if (!form.password) e.password = '비밀번호를 입력해 주세요';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => router.push('/admin'), 1200);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <UtensilsCrossed size={13} className="text-white" />
          </div>
          <span className="font-bold text-stone-900 text-base tracking-tight">AIZET</span>
        </Link>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
          ← 홈으로
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8">
          {/* Header */}
          <div className="flex flex-col gap-1.5 mb-7">
            <h1 className="text-2xl font-bold text-stone-900">로그인</h1>
            <p className="text-stone-500 text-sm">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-amber-600 font-semibold hover:underline">
                무료로 시작하기
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 이메일 */}
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-1.5">이메일</label>
              <input
                type="email"
                placeholder="hello@mybiz.com"
                value={form.email}
                autoComplete="email"
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  setErrors((r) => ({ ...r, email: undefined }));
                }}
                className={clsx(
                  'w-full text-sm px-4 py-3 rounded-xl border-2 outline-none transition-colors',
                  errors.email
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-stone-200 focus:border-amber-500'
                )}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-stone-700">비밀번호</label>
                <Link href="#" className="text-xs text-amber-600 hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }));
                    setErrors((r) => ({ ...r, password: undefined }));
                  }}
                  className={clsx(
                    'w-full text-sm px-4 py-3 pr-11 rounded-xl border-2 outline-none transition-colors',
                    errors.password
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-stone-200 focus:border-amber-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400">또는</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <button className="w-full py-3 border-2 border-stone-200 hover:border-stone-300 rounded-xl text-sm font-semibold text-stone-700 transition-colors flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 로그인
          </button>

          {/* Dashboard quick link */}
          <div className="mt-6 bg-stone-50 border border-stone-100 rounded-2xl p-4 flex flex-col gap-3">
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
                  {icon}
                  {label}
                </div>
              ))}
            </div>
            <Link
              href="/admin"
              className="text-center text-xs text-amber-600 font-semibold hover:underline"
            >
              대시보드 둘러보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
