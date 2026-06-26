#!/usr/bin/env python3
"""
명함 이미지 생성 스크립트
stdin:  JSON { shopName, ownerName, phone, address, logoPath, fontDir, cardTemplate }
stdout: PNG binary
"""
import sys
import json
import os
import io
from PIL import Image, ImageDraw, ImageFont

W, H = 1050, 600


# ── 폰트 로더 ────────────────────────────────────────────────
def font(font_dir, size, bold=False):
    name = 'NanumGothicBold.ttf' if bold else 'NanumGothic.ttf'
    return ImageFont.truetype(os.path.join(font_dir, name), size)

def text_w(draw, text, f):
    bb = draw.textbbox((0, 0), text, font=f)
    return bb[2] - bb[0]

def center_x(draw, text, f, x0=0, x1=None):
    if x1 is None:
        x1 = W
    tw = text_w(draw, text, f)
    return x0 + (x1 - x0 - tw) // 2

def wrap(draw, text, f, max_w):
    lines, cur = [], ''
    for ch in text:
        test = cur + ch
        if text_w(draw, test, f) > max_w and cur:
            lines.append(cur)
            cur = ch
        else:
            cur = test
    if cur:
        lines.append(cur)
    return lines

def paste_logo(card, logo_path, x, y, size, bg_color=None):
    if not (logo_path and os.path.exists(logo_path)):
        return
    try:
        logo = Image.open(logo_path).convert('RGBA')
        logo.thumbnail((size, size), Image.LANCZOS)
        lw, lh = logo.size
        bg = Image.new('RGB', (size, size), bg_color or (255, 255, 255))
        if logo.mode == 'RGBA':
            bg.paste(logo, ((size - lw) // 2, (size - lh) // 2), logo)
        else:
            bg.paste(logo, ((size - lw) // 2, (size - lh) // 2))
        card.paste(bg, (x, y))
    except Exception:
        pass


# ── 템플릿 1: 바이올렛 사이드바 ─────────────────────────────
def render_sidebar_violet(card, draw, d, fd):
    SIDE_W = 330
    BG = '#1e1b4b'
    AC = '#7c3aed'

    # 사이드바
    card.paste(Image.new('RGB', (SIDE_W, H), BG), (0, 0))

    # 로고
    paste_logo(card, d['logoPath'], (SIDE_W - 180) // 2, 70, 180, BG)

    # 가게명 (사이드바)
    f_shop = font(fd, 24, bold=True)
    for i, line in enumerate(wrap(draw, d['shopName'], f_shop, SIDE_W - 30)[:3]):
        x = center_x(draw, line, f_shop, 0, SIDE_W)
        draw.text((x, 285 + i * 34), line, font=f_shop, fill='#ffffff')

    # 오른쪽
    RX, RY = SIDE_W + 55, 70
    f_name = font(fd, 36, bold=True)
    draw.text((RX, RY), d['ownerName'], font=f_name, fill='#111827')
    RY += 52
    draw.rectangle([(RX, RY), (RX + 70, RY + 3)], fill=AC)
    RY += 24
    f_val  = font(fd, 20)
    f_lbl  = font(fd, 16)
    for lbl, val in [('T', d['phone']), ('A', d['address'])]:
        if not val:
            continue
        draw.text((RX, RY), lbl, font=f_lbl, fill=AC)
        for j, ln in enumerate(wrap(draw, val, f_val, W - RX - 30)[:2]):
            draw.text((RX + 28, RY + j * 28), ln, font=f_val, fill='#374151')
        RY += 28 * min(len(wrap(draw, val, f_val, W - RX - 30)), 2) + 18
    draw.rectangle([(SIDE_W + 2, H - 8), (W, H)], fill=AC)


# ── 템플릿 2: 심플 미니멀 ────────────────────────────────────
def render_minimal_white(card, draw, d, fd):
    AC = '#7c3aed'

    # 상단·하단 바이올렛 바
    draw.rectangle([(0, 0), (W, 7)], fill=AC)
    draw.rectangle([(0, H - 7), (W, H)], fill=AC)

    # 로고 (왼쪽 상단)
    paste_logo(card, d['logoPath'], 55, 50, 150)

    # 오른쪽 텍스트 블록
    RX, RY = 240, 55
    f_shop = font(fd, 30, bold=True)
    for ln in wrap(draw, d['shopName'], f_shop, W - RX - 40)[:2]:
        draw.text((RX, RY), ln, font=f_shop, fill='#1e1b4b')
        RY += 40

    f_name = font(fd, 22)
    draw.text((RX, RY), d['ownerName'], font=f_name, fill='#374151')
    RY += 38

    draw.rectangle([(RX, RY), (RX + 80, RY + 2)], fill=AC)
    RY += 18

    f_val = font(fd, 18)
    f_lbl = font(fd, 15)
    for lbl, val in [('T', d['phone']), ('A', d['address'])]:
        if not val:
            continue
        draw.text((RX, RY), lbl, font=f_lbl, fill=AC)
        for j, ln in enumerate(wrap(draw, val, f_val, W - RX - 40)[:2]):
            draw.text((RX + 26, RY + j * 26), ln, font=f_val, fill='#4b5563')
        RY += 26 * min(len(wrap(draw, val, f_val, W - RX - 40)), 2) + 14

    # 하단 웹사이트 힌트
    f_hint = font(fd, 13)
    draw.text((55, H - 38), 'AI 제작 명함', font=f_hint, fill='#9ca3af')


# ── 템플릿 3: 다크 네이비 ────────────────────────────────────
def render_dark_navy(card, draw, d, fd):
    BG = '#0f172a'
    AC = '#38bdf8'  # 스카이 블루

    card.paste(Image.new('RGB', (W, H), BG), (0, 0))

    # 로고 (왼쪽)
    paste_logo(card, d['logoPath'], 55, 60, 160, '#1e293b')

    # 수직 구분선
    draw.rectangle([(250, 50), (252, H - 50)], fill='#334155')

    # 오른쪽
    RX, RY = 285, 65
    f_shop = font(fd, 28, bold=True)
    for ln in wrap(draw, d['shopName'], f_shop, W - RX - 40)[:2]:
        draw.text((RX, RY), ln, font=f_shop, fill='#f1f5f9')
        RY += 40

    f_name = font(fd, 20)
    draw.text((RX, RY), d['ownerName'], font=f_name, fill='#94a3b8')
    RY += 38

    draw.rectangle([(RX, RY), (RX + 100, RY + 2)], fill=AC)
    RY += 18

    f_val = font(fd, 18)
    f_lbl = font(fd, 15)
    for lbl, val in [('T', d['phone']), ('A', d['address'])]:
        if not val:
            continue
        draw.text((RX, RY), lbl, font=f_lbl, fill=AC)
        for j, ln in enumerate(wrap(draw, val, f_val, W - RX - 40)[:2]):
            draw.text((RX + 26, RY + j * 26), ln, font=f_val, fill='#cbd5e1')
        RY += 26 * min(len(wrap(draw, val, f_val, W - RX - 40)), 2) + 14

    # 하단 장식
    draw.rectangle([(0, H - 5), (W, H)], fill=AC)


# ── 템플릿 4: 에메랄드 분할 ─────────────────────────────────
def render_split_emerald(card, draw, d, fd):
    SPLIT = 520
    AC    = '#059669'

    # 오른쪽 에메랄드
    card.paste(Image.new('RGB', (W - SPLIT, H), AC), (SPLIT, 0))

    # 로고 (오른쪽 패널 중앙)
    lx = SPLIT + (W - SPLIT - 180) // 2
    ly = (H - 180) // 2
    paste_logo(card, d['logoPath'], lx, ly, 180, AC)

    # 왼쪽 상단 포인트
    draw.rectangle([(0, 0), (SPLIT, 7)], fill=AC)

    RX, RY = 55, 65
    f_shop = font(fd, 30, bold=True)
    for ln in wrap(draw, d['shopName'], f_shop, SPLIT - RX - 20)[:2]:
        draw.text((RX, RY), ln, font=f_shop, fill='#064e3b')
        RY += 42

    f_name = font(fd, 22)
    draw.text((RX, RY), d['ownerName'], font=f_name, fill='#374151')
    RY += 38

    draw.rectangle([(RX, RY), (RX + 80, RY + 3)], fill=AC)
    RY += 22

    f_val = font(fd, 19)
    f_lbl = font(fd, 15)
    for lbl, val in [('T', d['phone']), ('A', d['address'])]:
        if not val:
            continue
        draw.text((RX, RY), lbl, font=f_lbl, fill=AC)
        for j, ln in enumerate(wrap(draw, val, f_val, SPLIT - RX - 20)[:2]):
            draw.text((RX + 26, RY + j * 28), ln, font=f_val, fill='#374151')
        RY += 28 * min(len(wrap(draw, val, f_val, SPLIT - RX - 20)), 2) + 16

    draw.rectangle([(0, H - 7), (SPLIT, H)], fill=AC)


# ── 템플릿 5: 웜 보더 ────────────────────────────────────────
def render_warm_border(card, draw, d, fd):
    AC  = '#b45309'  # 앰버
    B   = 10         # 보더 두께
    PAD = 24

    # 바깥 테두리
    draw.rectangle([(B, B), (W - B, H - B)], outline=AC, width=B)
    # 내부 얇은 선
    draw.rectangle([(B + 14, B + 14), (W - B - 14, H - B - 14)], outline='#fde68a', width=2)

    INNER_X  = B + PAD + 14
    LOGO_SZ  = 140
    LOGO_Y   = 60
    paste_logo(card, d['logoPath'], INNER_X, LOGO_Y, LOGO_SZ)

    # 가게명 (로고 오른쪽)
    RX, RY = INNER_X + LOGO_SZ + 30, LOGO_Y + 8
    f_shop = font(fd, 28, bold=True)
    for ln in wrap(draw, d['shopName'], f_shop, W - RX - 50)[:2]:
        draw.text((RX, RY), ln, font=f_shop, fill='#78350f')
        RY += 40

    f_name = font(fd, 20)
    draw.text((RX, RY), d['ownerName'], font=f_name, fill='#92400e')
    RY += 36

    draw.rectangle([(RX, RY), (RX + 60, RY + 2)], fill=AC)
    RY += 18

    f_val = font(fd, 18)
    f_lbl = font(fd, 14)
    for lbl, val in [('T', d['phone']), ('A', d['address'])]:
        if not val:
            continue
        draw.text((RX, RY), lbl, font=f_lbl, fill=AC)
        for j, ln in enumerate(wrap(draw, val, f_val, W - RX - 50)[:2]):
            draw.text((RX + 24, RY + j * 26), ln, font=f_val, fill='#4b5563')
        RY += 26 * min(len(wrap(draw, val, f_val, W - RX - 50)), 2) + 14

    # 하단 중앙 장식
    f_deco = font(fd, 13)
    deco   = '✦  ✦  ✦'
    dx     = center_x(draw, deco, f_deco)
    draw.text((dx, H - 48), deco, font=f_deco, fill='#d97706')


# ── 디스패처 ─────────────────────────────────────────────────
TEMPLATES = {
    'sidebar-violet': render_sidebar_violet,
    'minimal-white':  render_minimal_white,
    'dark-navy':      render_dark_navy,
    'split-emerald':  render_split_emerald,
    'warm-border':    render_warm_border,
}

def main():
    data = json.loads(sys.stdin.read())
    fd   = data.get('fontDir', '')
    tmpl = data.get('cardTemplate', 'sidebar-violet')
    fn   = TEMPLATES.get(tmpl, render_sidebar_violet)

    card = Image.new('RGB', (W, H), '#ffffff')
    draw = ImageDraw.Draw(card)

    fn(card, draw, data, fd)

    buf = io.BytesIO()
    card.save(buf, format='PNG', optimize=True)
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    main()
