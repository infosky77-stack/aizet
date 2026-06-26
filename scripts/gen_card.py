#!/usr/bin/env python3
"""
명함 이미지 생성 스크립트
stdin: JSON { shopName, ownerName, phone, address, logoPath, fontDir }
stdout: PNG binary
"""
import sys
import json
import os
from PIL import Image, ImageDraw, ImageFont

def load_font(font_dir: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = 'NanumGothicBold.ttf' if bold else 'NanumGothic.ttf'
    return ImageFont.truetype(os.path.join(font_dir, name), size)

def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    """긴 텍스트를 max_width에 맞게 줄바꿈"""
    words = list(text)  # 한글은 문자 단위로 분리
    lines = []
    current = ''
    for ch in words:
        test = current + ch
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(current)
            current = ch
        else:
            current = test
    if current:
        lines.append(current)
    return lines

def main():
    data = json.loads(sys.stdin.read())

    shop_name  = data.get('shopName', '')
    owner_name = data.get('ownerName', '')
    phone      = data.get('phone', '')
    address    = data.get('address', '')
    logo_path  = data.get('logoPath', '')
    font_dir   = data.get('fontDir', '')

    # 명함 크기: 1050×600 (3.5×2인치 @ 300DPI)
    W, H = 1050, 600
    PAD  = 60

    # 배경
    card = Image.new('RGB', (W, H), '#FFFFFF')
    draw = ImageDraw.Draw(card)

    # 왼쪽 사이드바 (강조색)
    SIDEBAR_W = 320
    sidebar = Image.new('RGB', (SIDEBAR_W, H), '#1e1b4b')  # 딥 바이올렛
    card.paste(sidebar, (0, 0))

    # 왼쪽 사이드바에 로고 배치
    if logo_path and os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert('RGBA')
            logo_size = 180
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            # 흰 배경으로 합성
            logo_bg = Image.new('RGB', (logo_size, logo_size), '#1e1b4b')
            if logo.mode == 'RGBA':
                logo_bg.paste(logo, ((logo_size - logo.width)//2, (logo_size - logo.height)//2), logo)
            else:
                logo_bg.paste(logo, ((logo_size - logo.width)//2, (logo_size - logo.height)//2))
            lx = (SIDEBAR_W - logo_size) // 2
            ly = 80
            card.paste(logo_bg, (lx, ly))
        except Exception:
            pass

    # 왼쪽 사이드바 — 가게명
    try:
        font_shop = load_font(font_dir, 26, bold=True)
        shop_lines = wrap_text(shop_name, font_shop, SIDEBAR_W - 30, draw)
        sy = 300
        for line in shop_lines[:3]:
            bbox = draw.textbbox((0, 0), line, font=font_shop)
            lw = bbox[2] - bbox[0]
            draw.text(((SIDEBAR_W - lw) // 2, sy), line, font=font_shop, fill='#ffffff')
            sy += 36
    except Exception:
        pass

    # 구분선
    draw.rectangle([(SIDEBAR_W + 1, 0), (SIDEBAR_W + 1, H)], fill='#e5e7eb')

    # 오른쪽 본문 영역
    RX = SIDEBAR_W + PAD
    RY = PAD + 20

    # 대표자명
    try:
        font_name = load_font(font_dir, 36, bold=True)
        draw.text((RX, RY), owner_name, font=font_name, fill='#111827')
        RY += 52
    except Exception:
        pass

    # 직함 / 업종 구분선
    draw.rectangle([(RX, RY), (RX + 80, RY + 3)], fill='#7c3aed')
    RY += 24

    # 연락처 항목들
    try:
        font_info  = load_font(font_dir, 22)
        font_label = load_font(font_dir, 18)
        LINE_H     = 42

        items = []
        if phone:
            items.append(('T', phone))
        if address:
            items.append(('A', address))

        for label, value in items:
            draw.text((RX, RY), label, font=font_label, fill='#7c3aed')
            draw.text((RX + 28, RY), value, font=font_info, fill='#374151')
            RY += LINE_H
    except Exception:
        pass

    # 하단 장식 라인
    draw.rectangle([(SIDEBAR_W + 2, H - 8), (W, H)], fill='#7c3aed')

    # PNG로 출력
    import io
    buf = io.BytesIO()
    card.save(buf, format='PNG', optimize=True)
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    main()
