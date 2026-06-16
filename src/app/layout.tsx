import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'AIZET Restaurant',
  description: 'AI 기반 스마트 식당 주문 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#fafaf8] text-[#1a1a1a] antialiased">{children}</body>
    </html>
  );
}
