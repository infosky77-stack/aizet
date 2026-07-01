#!/usr/bin/env python3
"""
AIZET FullAutoCatalog — 도록(작품집) PDF 렌더러
Node.js UbuntuLocalWorker에서 subprocess로 호출됨.

Exit code 0 + JSON stdout → 성공
Exit code 1                → 실패 (stderr에 오류)
"""

import sys, os, json, argparse, traceback
from pathlib import Path

FONT_PATH = Path(__file__).parent / 'fonts' / 'NotoSansKR.ttf'

PAGE_SIZES = {
    'A4': (210, 297),
    'A5': (148, 210),
}


def url_to_disk_path(url: str, cwd: str) -> str | None:
    """/api/super-editor-files/{userId}/{filename} → 디스크 절대경로"""
    prefix = '/api/super-editor-files/'
    if url.startswith(prefix):
        rel = url[len(prefix):]
        return os.path.join(cwd, 'data', 'super-editor-files', rel)
    return None


def render_catalog(snapshot: dict, output_path: str, cwd: str) -> None:
    from fpdf import FPDF
    from PIL import Image as PILImage

    exhibition_title = snapshot.get('exhibition_title', '').strip()
    artist_name      = snapshot.get('artist_name', '').strip()
    paper_key        = snapshot.get('paper_size', 'A4')
    artworks         = snapshot.get('artworks', [])

    W, H   = PAGE_SIZES.get(paper_key, PAGE_SIZES['A4'])
    MARGIN = 22          # 상하좌우 여백 (mm) — 갤러리 느낌의 넉넉한 여백
    GAP    = 7           # 이미지 하단 ~ 캡션 상단 간격 (mm)
    CAP_H  = 42          # 캡션 영역 높이 (mm) — 설명 텍스트 포함
    IMG_W  = W - 2 * MARGIN
    IMG_H  = H - 2 * MARGIN - GAP - CAP_H

    font = str(FONT_PATH)
    pdf  = FPDF(orientation='P', unit='mm', format=paper_key)
    pdf.set_auto_page_break(auto=False)
    pdf.add_font('NS', style='',  fname=font)
    pdf.add_font('NS', style='B', fname=font)

    # ── 표지 ─────────────────────────────────────────────────────────
    if exhibition_title or artist_name:
        pdf.add_page()
        # 순백 배경
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, W, H, 'F')

        center_y = H * 0.42

        # 전시명
        if exhibition_title:
            pdf.set_font('NS', style='B', size=20)
            pdf.set_text_color(18, 18, 18)
            pdf.set_xy(MARGIN, center_y)
            pdf.multi_cell(IMG_W, 11, exhibition_title, align='C')
            center_y = pdf.get_y() + 5

        # 얇은 구분선
        pdf.set_draw_color(190, 190, 190)
        pdf.set_line_width(0.25)
        sep_x1 = W * 0.35
        sep_x2 = W * 0.65
        pdf.line(sep_x1, center_y, sep_x2, center_y)
        center_y += 7

        # 작가명
        if artist_name:
            pdf.set_font('NS', size=12)
            pdf.set_text_color(100, 100, 100)
            pdf.set_xy(MARGIN, center_y)
            pdf.cell(IMG_W, 8, artist_name, align='C')

    # ── 작품 페이지 ──────────────────────────────────────────────────
    for artwork in artworks:
        img_url    = artwork.get('imageUrl', '')
        art_title       = artwork.get('title',       '').strip()
        art_year        = artwork.get('year',        '').strip()
        art_medium      = artwork.get('medium',      '').strip()
        art_size        = artwork.get('size',        '').strip()
        art_description = artwork.get('description', '').strip()

        img_path = url_to_disk_path(img_url, cwd)
        if not img_path or not os.path.exists(img_path):
            continue

        # 이미지 원본 크기로 비율 계산
        try:
            with PILImage.open(img_path) as im:
                im.verify()
        except Exception:
            continue

        try:
            with PILImage.open(img_path) as im:
                px_w, px_h = im.size
        except Exception:
            continue

        pdf.add_page()
        # 순백 배경
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, W, H, 'F')

        # 이미지 배치 — 가용 영역에 비율 유지하며 중앙 정렬
        img_ratio  = px_w / px_h
        area_ratio = IMG_W / IMG_H

        if img_ratio > area_ratio:
            placed_w = IMG_W
            placed_h = IMG_W / img_ratio
        else:
            placed_h = IMG_H
            placed_w = IMG_H * img_ratio

        img_x = MARGIN + (IMG_W - placed_w) / 2
        img_y = MARGIN + (IMG_H - placed_h) / 2

        pdf.image(img_path, x=img_x, y=img_y, w=placed_w, h=placed_h)

        # 캡션 영역 시작
        cap_y = MARGIN + IMG_H + GAP

        # 구분선 (가는 회색)
        pdf.set_draw_color(215, 215, 215)
        pdf.set_line_width(0.2)
        pdf.line(MARGIN, cap_y - 1.5, W - MARGIN, cap_y - 1.5)

        # 작품명 (굵게, 조금 크게)
        if art_title:
            pdf.set_font('NS', style='B', size=10.5)
            pdf.set_text_color(18, 18, 18)
            pdf.set_xy(MARGIN, cap_y)
            pdf.cell(IMG_W, 7, art_title, align='C')
            cap_y += 7

        # 연도  재료 (회색, 작게)
        meta_parts = [p for p in [art_year, art_medium] if p]
        if meta_parts:
            pdf.set_font('NS', size=8.5)
            pdf.set_text_color(115, 115, 115)
            pdf.set_xy(MARGIN, cap_y)
            pdf.cell(IMG_W, 5.5, ',  '.join(meta_parts), align='C')
            cap_y += 5.5

        # 크기 (더 연한 회색)
        if art_size:
            pdf.set_font('NS', size=8)
            pdf.set_text_color(160, 160, 160)
            pdf.set_xy(MARGIN, cap_y)
            pdf.cell(IMG_W, 5, art_size, align='C')
            cap_y += 5

        # 작품 설명 (이탤릭, 진한 회색, multi_cell로 자동 줄바꿈)
        if art_description:
            pdf.set_font('NS', size=7.5)
            pdf.set_text_color(100, 100, 100)
            pdf.set_xy(MARGIN, cap_y + 1.5)
            pdf.multi_cell(IMG_W, 4.5, art_description, align='C')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--payload', required=True)
    parser.add_argument('--output',  required=True)
    parser.add_argument('--cwd',     required=True)
    args = parser.parse_args()

    try:
        payload  = json.loads(args.payload)
        snapshot = payload.get('snapshot', {})
        render_catalog(snapshot, args.output, args.cwd)
        print(json.dumps({'success': True}))
    except Exception:
        err = traceback.format_exc()
        sys.stderr.write(json.dumps({'success': False, 'error': err}) + '\n')
        sys.exit(1)


if __name__ == '__main__':
    main()
