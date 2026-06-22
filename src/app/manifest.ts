import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AIZET — AI 홈페이지 자동 생성 플랫폼',
    short_name: 'AIZET',
    description: '업종을 선택하면 AI가 5분 안에 완성된 홈페이지를 만들어 드립니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf8',
    theme_color: '#f97316',
    icons: [
      {
        src: '/aizet-app-icon-charcoal.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
