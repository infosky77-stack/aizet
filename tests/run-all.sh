#!/bin/bash
# 슈퍼에디터 시뮬레이션 테스트 일괄 실행 (브라우저 UI 불필요 — Node + headless Chromium)
# 실행: bash tests/run-all.sh   (또는 npm run test:sim)
set -uo pipefail
cd "$(dirname "$0")/.."

FAILED=0
run() {
  echo ""
  echo "════ $1 ════"
  shift
  "$@" || FAILED=1
}

run "잡지 조판 엔진 (10케이스)"        npx tsx tests/magazine-pdf-layout.test.ts
run "제품상세 레이아웃 엔진 (26케이스)" npx tsx tests/product-detail-layout.test.ts
run "영상 scene 마이그레이션"          npx tsx tests/video-migrate.test.ts
run "순수 헬퍼 (folder-domains/types/wrapText)" npx tsx tests/pure-helpers.test.ts
run "쇼핑몰 순수 로직 (상태전이/할인율/평점)"   npx tsx tests/shop-logic.test.ts
run "i18n 뼈대 (언어감지/폴백/UI사전)"          npx tsx tests/i18n.test.ts
run "클립 seek 캡처 정확도 (headless Chromium)" node tests/seek-capture-accuracy.test.mjs

echo ""
if [[ $FAILED -eq 0 ]]; then
  echo "✅ ALL SUITES PASS"
else
  echo "❌ 실패한 스위트가 있습니다"
  exit 1
fi
