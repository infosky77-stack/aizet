'use client';

import Link from 'next/link';
import {
  Upload, Users, Star, Camera,
  ExternalLink, CheckCircle, ArrowLeft,
} from 'lucide-react';
import { AizetLogo } from '@/components/AizetLogo';

function toast(msg: string) {
  alert(msg);
}

export default function ClinicCreatePage() {
  return (
    <div className="bg-gradient-to-b from-amber-50 via-white to-stone-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

        {/* ── AIZET 브랜드 헤더 ─────────────────────────────────── */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-6"
          >
            <ArrowLeft size={12} />
            <AizetLogo className="font-black text-sm" /> 홈으로
          </Link>

          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <span style={{ color: '#C9A227' }}>✦</span>
            한의원 홈페이지 제작
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            한의원 홈페이지,<br />
            <span style={{ color: '#C9A227' }}>이렇게 만들어 드립니다</span>
          </h1>

          <p className="text-gray-500 text-base leading-relaxed">
            가게 정보와 사진만 주시면,{' '}
            <AizetLogo className="font-black text-base" />{' '}
            AI가 도와<br className="hidden sm:block" />
            멋진 홈페이지를 자동으로 만들어 드립니다.
          </p>
        </div>

        {/* ── 영상 자리표시자 ────────────────────────────────────── */}
        <div className="relative bg-stone-100 rounded-2xl aspect-video flex flex-col items-center justify-center mb-3 border-2 border-dashed border-stone-300 shadow-inner">
          <Camera size={36} className="text-stone-300 mb-2" />
          <p className="text-sm font-semibold text-stone-400">제작 과정 영상</p>
          <p className="text-xs text-stone-300 mt-0.5">준비 중</p>
        </div>

        {/* 완성 예시 링크 */}
        <div className="text-center mb-12">
          <Link
            href="/clinic"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-700 font-semibold hover:underline underline-offset-2"
          >
            <ExternalLink size={13} />
            완성 예시 보기 — 자연한의원 데모
          </Link>
        </div>

        {/* ── 두 갈래 선택 ───────────────────────────────────────── */}
        <p className="text-center text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-5">
          어떻게 만들까요?
        </p>

        <div className="grid sm:grid-cols-2 gap-4">

          {/* A. 직접 만들기 */}
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-6 flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center mb-4 shadow-sm">
              <Upload size={20} className="text-amber-700" />
            </div>

            <h2 className="text-xl font-black text-gray-900 mb-1">직접 만들기</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              내 사진·동영상을 올리면{' '}
              <span className="font-bold text-gray-700">AI가 자동으로 제작</span>합니다.
            </p>

            {/* 강조 문구 — 눈에 띄게 */}
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl rounded-l-sm px-4 py-3 mb-5">
              <div className="flex gap-2 items-start">
                <Star size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  될 수 있는 한 사진과 동영상을{' '}
                  <strong className="underline underline-offset-2 decoration-amber-400">
                    많이
                  </strong>{' '}
                  올려주시면, 고객님의 사이트가 더욱더 개성 있고 멋있게 표현됩니다.
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                '사진·동영상 직접 업로드',
                'AI 자동 문구 생성',
                '홈페이지 즉시 완성',
              ].map(txt => (
                <li key={txt} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={14} className="text-amber-500 shrink-0" />
                  {txt}
                </li>
              ))}
            </ul>

            <Link
              href="/clinic/create/self"
              className="mt-auto w-full py-3.5 rounded-xl font-bold text-white text-sm text-center transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #C9A227, #e0b83a)' }}
            >
              직접 시작하기 →
            </Link>
          </div>

          {/* B. 제작 의뢰하기 */}
          <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm p-6 flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center mb-4 shadow-sm">
              <Users size={20} className="text-stone-600" />
            </div>

            <h2 className="text-xl font-black text-gray-900 mb-1">제작 의뢰하기</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              <span className="font-bold text-gray-700">에이젯이 직접 방문 촬영</span>부터
              제작까지 도와드립니다.{' '}
              <span className="text-stone-400 text-xs">(실비)</span>
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-stone-600 leading-relaxed">
                전문 촬영팀이 직접 한의원을 방문해 원장님·공간·시술 현장을 담고,
                에이젯 AI로 완성된 홈페이지를 만들어 드립니다.
              </p>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                '전문 촬영팀 직접 방문',
                'AI + 전문가 공동 제작',
                '수정 피드백 반영',
              ].map(txt => (
                <li key={txt} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={14} className="text-stone-400 shrink-0" />
                  {txt}
                </li>
              ))}
            </ul>

            <button
              onClick={() => toast('준비 중입니다. 곧 만나요! 😊')}
              className="mt-auto w-full py-3.5 rounded-xl font-bold text-stone-700 text-sm bg-stone-100 hover:bg-stone-200 transition-colors active:scale-[0.98]"
            >
              의뢰 문의하기 →
            </button>
          </div>
        </div>

        {/* 하단 브랜드 */}
        <p className="text-center text-xs text-stone-400 mt-12">
          <AizetLogo className="font-black text-sm" />
          &nbsp;·&nbsp;소상공인 AI 홈페이지 플랫폼
        </p>
      </div>
    </div>
  );
}
