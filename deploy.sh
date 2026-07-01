#!/bin/bash
# AIZET 배포 스크립트
# 실행: bash /root/aizet/deploy.sh
#
# npm run build 에 NEXT_DIST_DIR=.aizet-next 가 내재화되어 있음.
# PM2 도 cwd=/root/aizet + NEXT_DIST_DIR=.aizet-next 로 같은 경로를 읽음.
# 빌드 완료 즉시 PM2 재시작 → CSS 해시 어긋남 없음.

set -euo pipefail

SRC_DIR="/root/aizet"
BUILD_OUT="$SRC_DIR/.aizet-next"
PM2_APP="aizet"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }
info() { echo -e "${YELLOW}[--]${NC}  $*"; }

echo ""
echo "========================================"
echo "   AIZET 배포 시작 $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ── Step 1: 빌드 ──────────────────────────────────────────────────────────
info "Step 1/3 | Next.js 빌드 중... (NEXT_DIST_DIR=.aizet-next)"
cd "$SRC_DIR"

# 빌드 출력 전체 캡처 — 에러 시 원인 확인 가능
BUILD_LOG=$(npm run build 2>&1)
BUILD_EXIT=$?

if [[ $BUILD_EXIT -ne 0 ]]; then
  echo "$BUILD_LOG" | tail -20
  fail "빌드 실패 (exit $BUILD_EXIT)"
fi

BUILD_ID=$(cat "$BUILD_OUT/BUILD_ID" 2>/dev/null || echo "")
if [[ -z "$BUILD_ID" ]]; then
  fail "빌드 실패: BUILD_ID 없음"
fi
echo "$BUILD_LOG" | tail -3
ok "빌드 완료 (BUILD_ID: $BUILD_ID)"

# ── Step 2: PM2 재시작 (빌드 직후 즉시) ──────────────────────────────────
info "Step 2/3 | PM2 '$PM2_APP' 재시작 중..."
pm2 restart "$PM2_APP" --update-env 2>&1 | grep -E "(restarted|error|online|✓)" || true
sleep 3

# ── Step 3: 기동 확인 ────────────────────────────────────────────────────
info "Step 3/3 | 기동 상태 확인..."

STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == '$PM2_APP':
        print(p['pm2_env']['status'])
" 2>/dev/null || echo "unknown")

if [[ "$STATUS" != "online" ]]; then
  fail "PM2 '$PM2_APP' 상태 이상: $STATUS"
fi
ok "PM2 상태: online"

# HTML 응답 + CSS 해시 일치 검증
sleep 2
CSS_FROM_HTML=$(curl -sk https://aizet.co.kr/ | grep -oE '_next/static/chunks/[a-zA-Z0-9._-]+\.css' | sort -u)
MISMATCH=0
for css in $CSS_FROM_HTML; do
  fname=$(basename "$css")
  if [[ ! -f "$BUILD_OUT/static/chunks/$fname" ]]; then
    echo "  MISSING: $fname"
    MISMATCH=1
  fi
done

if [[ $MISMATCH -eq 0 ]]; then
  ok "HTML↔CSS 해시 일치 확인"
else
  fail "CSS 해시 불일치! 빌드 결과물과 서빙 중인 HTML이 다름"
fi

# ── 완료 ──────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "   배포 완료 $(date '+%Y-%m-%d %H:%M:%S')"
echo "   BUILD_ID : $BUILD_ID"
echo "========================================"
echo ""
