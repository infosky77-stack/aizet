import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'AIZET — AI 홈페이지 자동 생성 플랫폼',
  description: '업종을 선택하면 AI가 5분 안에 완성된 홈페이지를 만들어 드립니다. 예약·주문·결제·서빙 로봇까지 자동화.',
  icons: {
    icon: '/aizet-logo-transparent.png',
    apple: '/aizet-app-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'AIZET',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#fafaf8] text-[#1a1a1a] antialiased">{children}</body>
    </html>
  );
}
