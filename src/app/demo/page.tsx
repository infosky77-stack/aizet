'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { UtensilsCrossed, Truck, MapPin, Clock, ChevronDown, X, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';
import { OrderType } from '@/types/order';

type LightboxMedia = { type: 'image' | 'video'; src: string } | null;

export default function LandingPage() {
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableInput, setTableInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<LightboxMedia>(null);
  const { setTable, setOrderType: storeSetOrderType, setDeliveryAddress } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  function handleStart() {
    if (orderType === 'dine-in') {
      const n = tableInput ? parseInt(tableInput) : 1;
      if (tableInput && (isNaN(n) || n < 1 || n > 30)) {
        setError('1~30 사이의 테이블 번호를 입력해 주세요.');
        return;
      }
      storeSetOrderType('dine-in');
      setTable(n);
      router.push('/menu');
    } else {
      if (!addressInput.trim() || addressInput.trim().length < 5) {
        setError('정확한 배달 주소를 입력해 주세요.');
        return;
      }
      storeSetOrderType('delivery');
      setDeliveryAddress(addressInput.trim());
      router.push('/menu');
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] flex flex-col">
      {/* 메인 랜딩으로 나가기 */}
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ChevronLeft size={13} />
          메인으로 돌아가기
        </Link>
      </div>

      {/* ── 히어로: 매장 영상 ─────────────────────────────── */}
      <section
        className="relative w-full h-[60vw] min-h-[280px] max-h-[420px] overflow-hidden cursor-zoom-in"
        onDoubleClick={() => setLightbox({ type: 'video', src: '/demo/restaurant-walkthrough.mp4' })}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          src="/demo/restaurant-walkthrough.mp4"
          poster="/demo/restaurant-exterior.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65 pointer-events-none" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 gap-3 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/90 flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-amber-200 uppercase">Jungwha Gajeong</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight drop-shadow-lg">중화가정</h1>
          <p className="text-sm text-white/85 leading-relaxed max-w-xs">
            가정집의 주방처럼, 어머니의 요리처럼<br />맛있고 신선하고 정성이 깃든 중화가정입니다
          </p>
          <a
            href="#order"
            className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-lg pointer-events-auto"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            지금 주문하기
            <ChevronDown size={15} />
          </a>
        </div>
      </section>

      {/* ── 정보 바 ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-center gap-4 text-xs text-stone-500 flex-wrap">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-amber-500" />
          신세계백화점 의정부점 9층
        </span>
        <span className="text-stone-200">|</span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-amber-500" />
          매일 11:00 ~ 21:00
        </span>
        <span className="text-stone-200">|</span>
        <span className="text-stone-400">매월 첫째주 월요일 휴무</span>
      </div>

      {/* ── 매장 분위기: 인테리어 이미지 ────────────────────── */}
      <section className="px-4 pt-7 pb-2 max-w-sm mx-auto w-full">
        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-2">Interior</p>
        <div
          className="relative h-52 rounded-2xl overflow-hidden shadow-sm cursor-zoom-in"
          onDoubleClick={() => setLightbox({ type: 'image', src: '/demo/restaurant-interior.jpg' })}
        >
          <Image
            src="/demo/restaurant-interior.jpg"
            alt="중화가정 매장 내부"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <p className="text-white font-bold text-base leading-tight">편안한 가정 분위기</p>
            <p className="text-white/75 text-xs mt-0.5">백화점 안에서 즐기는 고즈넉한 중식 공간</p>
          </div>
        </div>
      </section>

      {/* ── 대표 메뉴: 음식 이미지 ──────────────────────────── */}
      <section className="px-4 pt-5 pb-2 max-w-sm mx-auto w-full">
        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-2">Signature Menu</p>
        <div
          className="relative h-52 rounded-2xl overflow-hidden shadow-sm cursor-zoom-in"
          onDoubleClick={() => setLightbox({ type: 'image', src: '/demo/restaurant-food.jpg' })}
        >
          <Image
            src="/demo/restaurant-food.jpg"
            alt="중화가정 대표 메뉴"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <p className="text-white font-bold text-base leading-tight">대표 메뉴</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {['짜장면', '짬뽕', '탕수육', '깐풍기', '유린기'].map((name) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-medium border border-white/30"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 주문 카드 ────────────────────────────────────────── */}
      <section id="order" className="px-4 pt-6 pb-10 max-w-sm mx-auto w-full scroll-mt-4">
        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-3">Order</p>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
          {/* 주문 방식 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-2">주문 방식 선택</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOrderType('dine-in'); setError(''); }}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-colors',
                  orderType === 'dine-in'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                )}
              >
                <UtensilsCrossed size={22} />
                매장 주문
              </button>
              <button
                onClick={() => { setOrderType('delivery'); setError(''); }}
                className={clsx(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-colors',
                  orderType === 'delivery'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                )}
              >
                <Truck size={22} />
                배달 주문
              </button>
            </div>
          </div>

          {/* 매장: 테이블 번호 */}
          {orderType === 'dine-in' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">
                테이블 번호 <span className="text-stone-400 font-normal">(선택)</span>
              </label>
              <p className="text-xs text-stone-400">비워두면 체험용 1번 테이블로 입장됩니다</p>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                placeholder="비워두면 1번으로 체험"
                value={tableInput}
                onChange={(e) => { setTableInput(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* 배달: 주소 */}
          {orderType === 'delivery' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-500" />
                배달 주소
              </label>
              <textarea
                rows={2}
                placeholder="예) 경기도 의정부시 평화로 100, 101호"
                value={addressInput}
                onChange={(e) => { setAddressInput(e.target.value); setError(''); }}
                className="w-full text-sm py-3 px-4 rounded-xl border-2 border-stone-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}

          <button
            onClick={handleStart}
            className={clsx(
              'w-full py-4 text-white font-semibold text-base rounded-xl transition-colors',
              orderType === 'dine-in'
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            )}
          >
            메뉴 보기
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center mt-4">
          {orderType === 'dine-in'
            ? '테이블 번호가 없으신가요? 직원에게 문의해 주세요.'
            : '경기도 의정부시 일대 배달 가능 · 배달 불가 시 문의'}
        </p>
      </section>

      {/* ── 전체화면 라이트박스 ──────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          {lightbox.type === 'image' ? (
            <img
              src={lightbox.src}
              alt="전체화면"
              className="max-w-full max-h-full object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightbox.src}
              autoPlay
              loop
              controls
              playsInline
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

    </main>
  );
}
