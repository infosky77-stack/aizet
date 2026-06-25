#!/bin/bash
# AIZET 커스텀 도메인 nginx 설정 적용 스크립트
# 실행: sudo bash /root/aizet/nginx-custom-domains.sh

set -euo pipefail

CONF_SRC="/root/aizet/nginx-custom-domains.conf"
CONF_DEST="/etc/nginx/sites-available/custom-domains"
CONF_LINK="/etc/nginx/sites-enabled/custom-domains"
CERTBOT_WEBROOT="/var/www/certbot"

echo "[1/4] certbot webroot 디렉터리 생성..."
mkdir -p "$CERTBOT_WEBROOT"

echo "[2/4] nginx 설정 파일 복사..."
cp "$CONF_SRC" "$CONF_DEST"

echo "[3/4] sites-enabled 심볼릭 링크 생성..."
ln -sf "$CONF_DEST" "$CONF_LINK"

echo "[4/4] nginx 설정 테스트 및 리로드..."
nginx -t && nginx -s reload

echo ""
echo "완료! 커스텀 도메인 catch-all 블록이 활성화되었습니다."
echo "이제 이 서버 IP를 A레코드로 가리키는 모든 도메인이 Next.js로 라우팅됩니다."
