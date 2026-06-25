import type { Metadata } from 'next';
import { Geist, Noto_Sans_KR } from 'next/font/google';
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
    <html lang="ko" className={`${geist.variable} ${notoSansKR.variable} h-full`}>
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
