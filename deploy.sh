#!/bin/bash
# AIZET 배포 스크립트
# 실행: bash /root/aizet/deploy.sh

set -euo pipefail

SRC_DIR="/root/aizet"
DIST_DIR="/root/aizet/home/aizet/.aizet-next"
BUILD_OUT="$SRC_DIR/.next"
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
info "Step 1/3 | Next.js 빌드 중..."
cd "$SRC_DIR"
npm run build 2>&1 | tail -5
BUILD_ID=$(cat "$BUILD_OUT/BUILD_ID" 2>/dev/null || echo "")
if [[ -z "$BUILD_ID" ]]; then
  fail "빌드 실패: $BUILD_OUT/BUILD_ID 없음"
fi
ok "빌드 완료 (BUILD_ID: $BUILD_ID)"

# ── Step 2: 복사 ──────────────────────────────────────────
info "Step 2/3 | $DIST_DIR 으로 복사 중..."
rm -rf "$DIST_DIR"
cp -r "$BUILD_OUT" "$DIST_DIR"

# BUILD_ID 일치 확인
DIST_BUILD_ID=$(cat "$DIST_DIR/BUILD_ID" 2>/dev/null || echo "")
if [[ "$BUILD_ID" != "$DIST_BUILD_ID" ]]; then
  fail "BUILD_ID 불일치: src=$BUILD_ID dist=$DIST_BUILD_ID"
fi
ok "복사 완료 (BUILD_ID 일치: $BUILD_ID)"

# ── Step 3: PM2 재시작 ────────────────────────────────────
info "Step 3/3 | PM2 '$PM2_APP' 재시작 중..."
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
