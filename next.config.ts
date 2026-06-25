import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    // tsc는 에디터/배포 전 별도 실행 — 빌드 속도 우선
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
