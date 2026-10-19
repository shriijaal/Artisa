from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

from django.conf import settings

WATERMARK_TEXT = 'ARTISA'
MAX_WIDTHS = {'full': 1200, 'thumb': 400}
WATERMARK_OPACITY = 38
WATERMARK_ANGLE = 32


def artwork_image_url(image_id, size='full'):
    """Public URL for a watermarked artwork image."""
    if not image_id:
        return None
    if size == 'full':
        return f'/api/artworks/image/{image_id}/'
    return f'/api/artworks/image/{image_id}/?size={size}'

_FONT_CANDIDATES = [
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/trebucbd.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
]


def _load_font(size):
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _watermark_layer(width, height, font_size=28):
    font = _load_font(font_size)
    layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    bbox = draw.textbbox((0, 0), WATERMARK_TEXT, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    gap_x, gap_y = tw + 80, th + 70
    y, row = 0, 0
    while y < height:
        x = gap_x // 2 if row % 2 else 0
        while x < width:
            draw.text((x, y), WATERMARK_TEXT, font=font, fill=(255, 255, 255, WATERMARK_OPACITY))
            x += gap_x
        y += gap_y
        row += 1
    return layer.rotate(WATERMARK_ANGLE, resample=Image.BICUBIC, expand=False)


def _composite_watermark(img):
    img = img.convert('RGBA')
    width, height = img.size
    layer = _watermark_layer(width, height)
    lw, lh = layer.size
    tiled = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    step_y = max(lh - 20, 1)
    step_x = max(lw - 20, 1)
    for y in range(-lh, height + lh, step_y):
        for x in range(-lw, width + lw, step_x):
            tiled.paste(layer, (x, y), layer)
    return Image.alpha_composite(img, tiled).convert('RGB')


def get_watermarked_path(source_path, image_id, size='full'):
    """Return path to cached watermarked file, creating it if needed."""
    max_w = MAX_WIDTHS.get(size, MAX_WIDTHS['full'])
    cache_dir = Path(settings.MEDIA_ROOT) / 'artworks' / 'watermarked'
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f'{image_id}_{size}.jpg'
    meta_path = cache_dir / f'{image_id}_{size}.meta'

    source = Path(source_path)
    if not source.is_file():
        return None

    source_mtime = int(source.stat().st_mtime)
    if cache_path.is_file():
        try:
            if meta_path.is_file() and meta_path.read_text().strip() == str(source_mtime):
                return cache_path
        except OSError:
            pass

    try:
        with Image.open(source) as img:
            img = ImageOps.exif_transpose(img)
            if img.width > max_w:
                ratio = max_w / img.width
                img = img.resize((max_w, max(1, int(img.height * ratio))), Image.Resampling.LANCZOS)
            protected = _composite_watermark(img)
            if protected.mode != 'RGB':
                protected = protected.convert('RGB')
            protected.save(cache_path, 'JPEG', quality=86, optimize=True)
            meta_path.write_text(str(source_mtime))
    except OSError:
        return None

    return cache_path
