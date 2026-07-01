#!/usr/bin/env python3
"""
AIZET FullAutoCut — FFmpeg 영상 렌더러
Node.js UbuntuLocalWorker에서 subprocess로 호출됨.

Exit code 0 + JSON stdout → 성공
Exit code 1 + 오류 메시지 → 실패
"""

import sys, os, json, subprocess, tempfile, math, argparse, traceback
from pathlib import Path

FONT_PATH = Path(__file__).parent / 'fonts' / 'NotoSansKR.ttf'
VIDEO_W, VIDEO_H = 1280, 720
FPS = 24


# ── 스타일 ──────────────────────────────────────────────────────────────────

STYLES = {
    # dark bg + white card + dark text (카드가 선명하게 보임)
    'modern':    {'bg': (20, 18, 30),    'fg': (20, 18, 30),    'accent': (139, 92, 246),  'card': (255, 255, 255)},
    'cinematic': {'bg': (10, 8, 6),      'fg': (15, 12, 8),     'accent': (200, 160, 80),  'card': (245, 235, 210)},
    'minimal':   {'bg': (220, 218, 215), 'fg': (28, 25, 23),    'accent': (100, 100, 100), 'card': (255, 255, 255)},
    'energetic': {'bg': (20, 8, 55),     'fg': (255, 255, 255), 'accent': (255, 80, 120),  'card': (80, 35, 155)},
}

def get_style(name):
    return STYLES.get(name, STYLES['modern'])


# ── Pillow 프레임 생성 ───────────────────────────────────────────────────────

def create_image_frame(src_path: Path, out_path: Path, style_name: str) -> Path:
    from PIL import Image
    st = get_style(style_name)
    bg = Image.new('RGB', (VIDEO_W, VIDEO_H), st['bg'])
    try:
        img = Image.open(src_path).convert('RGB')
        img.thumbnail((VIDEO_W, VIDEO_H), Image.LANCZOS)
        x = (VIDEO_W - img.width)  // 2
        y = (VIDEO_H - img.height) // 2
        bg.paste(img, (x, y))
    except Exception as e:
        # 이미지 열기 실패 → 배경만
        pass
    bg.save(str(out_path))
    return out_path


def wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    """단어 단위 줄바꿈. 한글은 글자 단위 fallback."""
    if not text.strip():
        return ['']
    words = text.split()
    lines, line = [], ''
    for word in words:
        candidate = (line + ' ' + word).strip()
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] > max_width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines or ['']


def create_text_frame(text: str, out_path: Path, style_name: str) -> Path:
    from PIL import Image, ImageDraw, ImageFont
    st = get_style(style_name)
    img = Image.new('RGB', (VIDEO_W, VIDEO_H), st['bg'])
    draw = ImageDraw.Draw(img)

    # 폰트 로드
    try:
        font_xl  = ImageFont.truetype(str(FONT_PATH), size=72)
        font_lg  = ImageFont.truetype(str(FONT_PATH), size=56)
        font_md  = ImageFont.truetype(str(FONT_PATH), size=44)
    except Exception:
        font_xl = font_lg = font_md = ImageFont.load_default()

    # 텍스트 길이에 따라 폰트 선택
    clean = text.strip()
    if len(clean) <= 12:
        font = font_xl
        max_w = VIDEO_W - 200
    elif len(clean) <= 25:
        font = font_lg
        max_w = VIDEO_W - 160
    else:
        font = font_md
        max_w = VIDEO_W - 120

    lines = wrap_text(draw, clean, font, max_w)

    line_h = int(font.size * 1.6)
    total_h = len(lines) * line_h
    pad_v, pad_h = 60, 80

    # 카드 배경 (텍스트 영역 강조)
    card_x1 = pad_h
    card_y1 = (VIDEO_H - total_h) // 2 - pad_v
    card_x2 = VIDEO_W - pad_h
    card_y2 = (VIDEO_H + total_h) // 2 + pad_v
    card_color = st.get('card', st['bg'])
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2],
                            radius=24, fill=card_color)

    # 액센트 바 (카드 상단)
    bar_y = card_y1 + 8
    draw.rectangle([(VIDEO_W // 2 - 60, bar_y), (VIDEO_W // 2 + 60, bar_y + 6)],
                   fill=st['accent'])

    y_start = (VIDEO_H - total_h) // 2
    for i, ln in enumerate(lines):
        bbox = draw.textbbox((0, 0), ln, font=font)
        w = bbox[2] - bbox[0]
        x = (VIDEO_W - w) // 2
        draw.text((x, y_start + i * line_h), ln, font=font, fill=st['fg'])

    img.save(str(out_path))
    return out_path


def create_title_frame(title: str, out_path: Path, style_name: str) -> Path:
    """빈 캔버스일 때 제목 슬라이드."""
    from PIL import Image, ImageDraw, ImageFont
    st = get_style(style_name)
    img = Image.new('RGB', (VIDEO_W, VIDEO_H), st['bg'])
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype(str(FONT_PATH), size=80)
        font_sub = ImageFont.truetype(str(FONT_PATH), size=36)
    except Exception:
        font = font_sub = ImageFont.load_default()

    # 카드 배경
    card_color = st.get('card', st['bg'])
    draw.rounded_rectangle([120, VIDEO_H // 2 - 120, VIDEO_W - 120, VIDEO_H // 2 + 120],
                            radius=32, fill=card_color)

    # 액센트 바
    draw.rectangle([(VIDEO_W // 2 - 80, VIDEO_H // 2 - 100),
                    (VIDEO_W // 2 + 80, VIDEO_H // 2 - 92)],
                   fill=st['accent'])

    # 제목
    bbox = draw.textbbox((0, 0), title, font=font)
    x = (VIDEO_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, VIDEO_H // 2 - 60), title, font=font, fill=st['fg'])

    # 부제
    sub = 'AIZET FullAutoCut'
    bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
    x2 = (VIDEO_W - (bbox2[2] - bbox2[0])) // 2
    draw.text((x2, VIDEO_H // 2 + 60), sub, font=font_sub, fill=st['accent'])

    img.save(str(out_path))
    return out_path


# ── BPM / 비트 분석 ──────────────────────────────────────────────────────────

def analyze_beats(bgm_path: Path) -> list[float]:
    """Librosa로 비트 타임스탬프(초) 반환. 실패하면 빈 리스트."""
    try:
        import librosa
        import numpy as np
        y, sr = librosa.load(str(bgm_path), mono=True)
        _, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()
        return beat_times
    except Exception as e:
        print(f'[WARN] BPM 분석 실패: {e}', file=sys.stderr)
        return []


def calc_beat_durations(beat_times: list[float], n: int, total_sec: float) -> list[float]:
    """n개 클립을 비트 경계에 맞게 배분."""
    valid = [t for t in beat_times if 0 < t <= total_sec]
    if len(valid) < n:
        per = max(1.0, total_sec / n)
        return [per] * n

    import numpy as np
    # n+1개 경계 균등 샘플 (0 포함)
    idxs = np.linspace(0, len(valid) - 1, n + 1, dtype=int)
    boundaries = [0.0] + [valid[i] for i in idxs[1:]]
    durations = [boundaries[i+1] - boundaries[i] for i in range(n)]
    return [max(0.5, d) for d in durations]


# ── FFmpeg 인코딩 ─────────────────────────────────────────────────────────────

def encode_video(
    frames: list[tuple[Path, float]],
    bgm_path,
    out_path: Path,
    ffmpeg_bin: str,
) -> None:
    """frames = [(png_path, duration_sec), ...]"""

    cmd = [ffmpeg_bin, '-y']

    n = len(frames)
    for frame_path, duration in frames:
        cmd += ['-loop', '1', '-t', f'{duration:.3f}', '-i', str(frame_path)]

    has_audio = bgm_path and Path(bgm_path).exists()
    if has_audio:
        cmd += ['-i', str(bgm_path)]

    # filter_complex: scale + pad each input → concat
    filter_parts = []
    for i in range(n):
        filter_parts.append(
            f'[{i}:v]scale={VIDEO_W}:{VIDEO_H}:'
            f'force_original_aspect_ratio=decrease,'
            f'pad={VIDEO_W}:{VIDEO_H}:(ow-iw)/2:(oh-ih)/2,'
            f'setsar=1,fps={FPS}[v{i}]'
        )
    concat_in = ''.join(f'[v{i}]' for i in range(n))
    filter_parts.append(f'{concat_in}concat=n={n}:v=1:a=0[vout]')

    cmd += ['-filter_complex', ';'.join(filter_parts)]
    cmd += ['-map', '[vout]']

    if has_audio:
        cmd += ['-map', f'{n}:a', '-c:a', 'aac', '-b:a', '192k', '-shortest']
    else:
        cmd += ['-an']

    cmd += [
        '-c:v', 'libx264',
        '-profile:v', 'baseline',
        '-level', '3.1',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        # 색공간 명시 (플레이어가 잘못 해석하는 것 방지)
        '-colorspace', 'bt709',
        '-color_primaries', 'bt709',
        '-color_trc', 'bt709',
        '-color_range', 'tv',
        '-movflags', '+faststart',
    ]
    cmd += [str(out_path)]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f'FFmpeg 실패:\n{result.stderr[-2000:]}')


# ── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--payload',  required=True, help='JSON 문자열')
    parser.add_argument('--output',   required=True, help='출력 mp4 경로')
    parser.add_argument('--cwd',      required=True, help='프로젝트 루트 경로')
    parser.add_argument('--ffmpeg',   required=True, help='ffmpeg 바이너리 경로')
    args = parser.parse_args()

    payload    = json.loads(args.payload)
    cwd        = Path(args.cwd)
    ffmpeg_bin = args.ffmpeg
    out_path   = Path(args.output)

    snapshot     = payload.get('snapshot', {})
    blocks_raw   = snapshot.get('canvas', {}).get('blocks', [])
    duration_sec = float(snapshot.get('duration_sec', 30))
    style_name   = snapshot.get('style', 'modern')
    bgm_label    = snapshot.get('bgm', 'none')
    user_id      = payload.get('userId', '')
    title        = payload.get('title', '영상')

    user_files_dir = cwd / 'data' / 'super-editor-files' / user_id
    bgm_path = (cwd / 'data' / 'bgm' / f'{bgm_label}.mp3') if bgm_label != 'none' else None

    # 유효 블록 필터링
    valid_blocks = []
    for b in blocks_raw:
        if b.get('type') == 'image':
            url = b.get('content', '')
            fname = url.split('/')[-1]
            fpath = user_files_dir / fname
            if fpath.exists():
                valid_blocks.append(b)
            # 파일 없는 이미지 블록은 건너뜀
        elif b.get('type') == 'text' and b.get('content', '').strip():
            valid_blocks.append(b)

    # 빈 캔버스 → 제목 슬라이드 1장
    if not valid_blocks:
        valid_blocks = [{'type': '_title', 'content': title}]

    n_blocks = len(valid_blocks)

    # 클립 길이 계산
    if bgm_path and bgm_path.exists():
        beat_times = analyze_beats(bgm_path)
        if beat_times and n_blocks > 1:
            durations = calc_beat_durations(beat_times, n_blocks, duration_sec)
        else:
            per = max(1.0, duration_sec / n_blocks)
            durations = [per] * n_blocks
    else:
        per = max(1.0, duration_sec / n_blocks)
        durations = [per] * n_blocks

    out_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix='aizet_render_') as tmpdir:
        tmp = Path(tmpdir)
        frames: list[tuple[Path, float]] = []

        for i, block in enumerate(valid_blocks):
            frame_out = tmp / f'frame_{i:03d}.png'
            btype = block.get('type')

            if btype == 'image':
                url   = block.get('content', '')
                fname = url.split('/')[-1]
                fpath = user_files_dir / fname
                create_image_frame(fpath, frame_out, style_name)

            elif btype == 'text':
                create_text_frame(block.get('content', ''), frame_out, style_name)

            else:  # _title (빈 캔버스)
                create_title_frame(block.get('content', title), frame_out, style_name)

            frames.append((frame_out, durations[i]))

        encode_video(frames, bgm_path, out_path, ffmpeg_bin)

    print(json.dumps({'success': True, 'outputPath': str(out_path)}))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'trace': traceback.format_exc()}))
        sys.exit(1)
