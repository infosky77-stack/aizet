// 클립 seek 캡처 프레임 정확도 회귀 테스트 — headless Chromium(playwright).
//
// buildVideoMp4의 클립 캡처는 프레임 "중앙" 시각((f+0.5)/FPS)으로 seek한다 — 경계 시각으로
// seek하면 Chromium 경계 모호성으로 3프레임 주기 중복+건너뜀(결과 영상 끊김)이 생긴다
// (2026-07-04 실측: 경계 seek 96프레임 중 중복 32 → 중앙 seek 중복 0).
// 이 테스트는 그 전략이 유지되는지(중복 ≤ 1, 건너뜀 0)를 검증한다.
//
// 테스트 클립은 ffmpeg-static으로 즉석 생성(tmp/는 gitignore) — 바이너리를 저장소에 안 둔다.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIP = path.join(ROOT, 'tmp', 'seek-test.mp4');
const FPS = 24, FRAMES = 96;

if (!existsSync(CLIP)) {
  mkdirSync(path.dirname(CLIP), { recursive: true });
  execFileSync(path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg'), [
    '-y', '-f', 'lavfi', '-i', `testsrc2=size=320x240:rate=${FPS}:duration=4`,
    '-c:v', 'libx264', '-profile:v', 'baseline', '-pix_fmt', 'yuv420p', CLIP,
  ], { stdio: 'ignore' });
}

const mp4b64 = readFileSync(CLIP).toString('base64');
const browser = await chromium.launch();
const page = await browser.newPage();

// buildVideoMp4.ts의 클립 캡처와 동일한 전략: (f+0.5)/FPS 중앙 seek + seeked 대기,
// rVFC metadata.mediaTime으로 "실제 표시된 프레임 시각"을 측정한다.
const result = await page.evaluate(async ({ b64, FPS, FRAMES }) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
  const video = document.createElement('video');
  video.muted = true; video.src = url;
  await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej; });

  const mediaTimes = [];
  for (let f = 0; f < FRAMES; f++) {
    const t = Math.min((f + 0.5) / FPS, Math.max(0, video.duration - 0.05));
    const meta = await new Promise((res) => {
      video.requestVideoFrameCallback((_now, m) => res(m));
      video.currentTime = t;
    });
    mediaTimes.push(meta.mediaTime);
  }
  let dup = 0, skipped = 0;
  for (let i = 1; i < mediaTimes.length; i++) {
    const delta = mediaTimes[i] - mediaTimes[i - 1];
    if (delta === 0) dup++;
    if (delta > 1.5 / FPS) skipped++;
  }
  return { dup, skipped, unique: new Set(mediaTimes).size };
}, { b64: mp4b64, FPS, FRAMES });

await browser.close();

// 허용치: 중복 ≤ 1(마지막 끝 클램프분), 건너뜀 0
const ok = result.dup <= 1 && result.skipped === 0;
console.log(`${ok ? 'PASS' : 'FAIL'} | seek 캡처 정확도 — 중복 ${result.dup}(허용 ≤1) 건너뜀 ${result.skipped}(허용 0) 고유 ${result.unique}/${FRAMES}`);
process.exit(ok ? 0 : 1);
