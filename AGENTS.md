<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:deploy-rules -->
# 빌드 및 배포

## 빌드 명령어 (반드시 이 명령어 사용)
pm2가 `NEXT_DIST_DIR=.aizet-next` 환경변수로 서버를 실행하므로,
빌드도 반드시 동일한 환경변수를 설정해야 올바른 경로(`/root/aizet/.aizet-next`)에 빌드된다.

```bash
cd /root/aizet && NEXT_DIST_DIR=.aizet-next npm run build
```

`npm run build` 만 실행하면 `/root/aizet/.next`에 저장되어 서버에 반영되지 않는다.

**왜 상대경로인가**: Next.js 16 Turbopack은 `distDir`을 `path.join(projectRoot, distDir)`로 해석하며,
절대경로(`/home/...`)를 넘기면 프로젝트 외부 경로로 판정해 빌드를 거부한다.
상대경로 `.aizet-next`는 `/root/aizet/.aizet-next`로 해석되어 프로젝트 내부로 인식된다.

## 배포 (빌드 후 재시작)
```bash
pm2 restart aizet --update-env
```
<!-- END:deploy-rules -->
