import type { Metadata } from 'next';
import { Geist, Noto_Sans_KR, Noto_Sans_JP, Noto_Sans_SC } from 'next/font/google';
import './globals.css';
import { DesktopModeBanner } from '@/components/DesktopModeBanner';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

// 한국어 텍스트를 일관되게 렌더링하기 위한 명시적 웹폰트
// Geist는 한국어 unicode-range를 포함하지 않아 OS 기본 폰트로 fallback됨
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin', 'korean'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: true,
});

// 다국어(ja/zh) 웹폰트 — CSS 변수만 심고 언어별 적용은 lib/i18n/fontStacks.ts가 담당.
// preload:false — 해당 언어로 그린 텍스트가 있을 때만 unicode-range 슬라이스가
// 다운로드되므로(브라우저 동작), ko 사용자 첫 로딩에는 비용이 없다.
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'AIZET — AI 홈페이지 자동 생성 플랫폼',
  description: '업종을 선택하면 AI가 5분 안에 완성된 홈페이지를 만들어 드립니다. 예약·주문·결제·서빙 로봇까지 자동화.',
  icons: {
    icon: '/aizet-logo-charcoal.png',
    apple: '/aizet-app-icon-charcoal.png',
  },
  appleWebApp: {
    capable: true,
    title: 'AIZET',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} ${notoSansKR.variable} ${notoSansJP.variable} ${notoSansSC.variable} h-full`}>
      <body className="min-h-full bg-[#fafaf8] text-[#1a1a1a] antialiased">
        <DesktopModeBanner />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})}window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
      </body>
    </html>
  );
}
