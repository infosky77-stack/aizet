#!/bin/bash
# AIZET 배포 스크립트
# 실행: bash /root/aizet/deploy.sh
#
# npm run build 는 NEXT_DIST_DIR=.aizet-next 를 내재화하고 있어
# 빌드 결과물이 /root/aizet/.aizet-next 에 직접 생성된다.
# PM2 도 cwd=/root/aizet + NEXT_DIST_DIR=.aizet-next 로 같은 경로를 읽는다.
# 따라서 빌드 후 별도 복사 없이 PM2 재시작만 하면 된다.

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

# ── Step 1: 빌드 ──────────────────────────────────────────
info "Step 1/2 | Next.js 빌드 중..."
cd "$SRC_DIR"
npm run build 2>&1 | tail -5
BUILD_ID=$(cat "$BUILD_OUT/BUILD_ID" 2>/dev/null || echo "")
if [[ -z "$BUILD_ID" ]]; then
  fail "빌드 실패: $BUILD_OUT/BUILD_ID 없음"
fi
ok "빌드 완료 (BUILD_ID: $BUILD_ID)"

# ── Step 2: PM2 재시작 ────────────────────────────────────
info "Step 2/2 | PM2 '$PM2_APP' 재시작 중..."
pm2 restart "$PM2_APP" --update-env 2>&1 | grep -E "(restarted|error|online)" || true
sleep 2

STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p['name'] == '$PM2_APP':
        print(p['pm2_env']['status'])
" 2>/dev/null || echo "unknown")

if [[ "$STATUS" == "online" ]]; then
  ok "PM2 '$PM2_APP' 상태: online"
else
  fail "PM2 '$PM2_APP' 상태 이상: $STATUS (pm2 logs $PM2_APP 로 확인)"
fi

# ── 완료 ──────────────────────────────────────────────────
echo ""
echo "========================================"
echo "   배포 완료 $(date '+%Y-%m-%d %H:%M:%S')"
echo "   BUILD_ID : $BUILD_ID"
echo "========================================"
echo ""
