"""Detect dominant colors from clan motif images using Pillow.

Strategy:
  1. Download the motif image from motif_url.
  2. Resize to a small thumbnail for fast processing.
  3. Convert to RGB, discard transparent/near-transparent pixels.
  4. Filter out near-black, near-white, and low-saturation (gray) pixels.
  5. Quantize the remaining pixels to find dominant color clusters.
  6. Pick the two most distinct saturated colors as primary and secondary.
"""

import colorsys
import logging
from collections import Counter
from datetime import datetime, timezone
from io import BytesIO

import httpx
from PIL import Image

from app.core.database import db

logger = logging.getLogger(__name__)

# Thresholds for filtering uninteresting pixels
MIN_SATURATION = 0.10       # Ignore very desaturated / gray pixels
MIN_LIGHTNESS = 0.08        # Ignore near-black
MAX_LIGHTNESS = 0.92        # Ignore near-white
COLOR_DISTANCE_THRESHOLD = 60  # Minimum RGB distance between primary and secondary


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _color_distance(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5


def _is_interesting_color(r: int, g: int, b: int) -> bool:
    """Filter out blacks, whites, grays, and very desaturated colors."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if s < MIN_SATURATION:
        return False
    if l < MIN_LIGHTNESS or l > MAX_LIGHTNESS:
        return False
    return True


def extract_colors_from_image(image_data: bytes) -> tuple[str, str]:
    """Extract primary and secondary colors from image bytes.

    Returns (primary_hex, secondary_hex).
    Raises ValueError if no usable colors found.
    """
    img = Image.open(BytesIO(image_data))

    # Handle transparency: flatten onto white background
    if img.mode in ("RGBA", "LA", "PA"):
        # Filter out transparent pixels
        rgba = img.convert("RGBA")
        pixels_with_alpha = list(rgba.getdata())
        rgb_pixels = [
            (r, g, b) for r, g, b, a in pixels_with_alpha if a > 128
        ]
    else:
        img = img.convert("RGB")
        rgb_pixels = list(img.getdata())

    if not rgb_pixels:
        raise ValueError("No non-transparent pixels found")

    # Resize approach: quantize to reduce color space
    # Work with a small version for speed
    img_small = img.convert("RGB").resize((64, 64), Image.LANCZOS)
    all_pixels = list(img_small.getdata())

    # Filter to interesting colors only
    interesting = [p for p in all_pixels if _is_interesting_color(*p)]

    if len(interesting) < 10:
        # Fall back to all non-black/white pixels with looser filter
        interesting = [
            p for p in all_pixels
            if not (p[0] < 20 and p[1] < 20 and p[2] < 20)
            and not (p[0] > 235 and p[1] > 235 and p[2] > 235)
        ]

    if len(interesting) < 5:
        raise ValueError("Not enough usable color pixels in image")

    # Quantize: reduce to 16 colors then to 8 for clustering
    img_quant = img_small.quantize(colors=16, method=Image.Quantize.MEDIANCUT)
    palette = img_quant.getpalette()
    if not palette:
        raise ValueError("Failed to quantize image")

    # Build palette colors list
    palette_colors: list[tuple[int, int, int]] = []
    for i in range(0, min(len(palette), 48), 3):
        palette_colors.append((palette[i], palette[i + 1], palette[i + 2]))

    # Count how many pixels map to each palette color
    quant_pixels = list(img_quant.getdata())
    color_counts: Counter[tuple[int, int, int]] = Counter()
    for idx in quant_pixels:
        if idx < len(palette_colors):
            color_counts[palette_colors[idx]] += 1

    # Filter palette colors to interesting ones, sorted by frequency
    ranked = [
        (color, count) for color, count in color_counts.most_common()
        if _is_interesting_color(*color)
    ]

    if not ranked:
        # Looser filter: just exclude black/white
        ranked = [
            (color, count) for color, count in color_counts.most_common()
            if not (color[0] < 30 and color[1] < 30 and color[2] < 30)
            and not (color[0] > 225 and color[1] > 225 and color[2] > 225)
        ]

    if not ranked:
        raise ValueError("No usable color clusters found")

    primary_rgb = ranked[0][0]
    primary_hex = _rgb_to_hex(*primary_rgb)

    # Find secondary: most frequent color that is distinct from primary
    secondary_hex = None
    for color, _count in ranked[1:]:
        if _color_distance(primary_rgb, color) >= COLOR_DISTANCE_THRESHOLD:
            secondary_hex = _rgb_to_hex(*color)
            break

    if secondary_hex is None:
        # Use a darker/lighter variant of primary as fallback
        h, l, s = colorsys.rgb_to_hls(primary_rgb[0] / 255, primary_rgb[1] / 255, primary_rgb[2] / 255)
        alt_l = max(0.15, l - 0.25) if l > 0.5 else min(0.85, l + 0.25)
        alt_r, alt_g, alt_b = colorsys.hls_to_rgb(h, alt_l, s)
        secondary_hex = _rgb_to_hex(int(alt_r * 255), int(alt_g * 255), int(alt_b * 255))

    return primary_hex, secondary_hex


async def detect_clan_colors(clan_id: str, motif_url: str) -> dict:
    """Download motif image for a clan, detect colors, and store them.

    Returns a summary dict with status and detected colors.
    """
    now = datetime.now(timezone.utc)

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(motif_url)

        if resp.status_code != 200:
            error_msg = f"Failed to download motif: HTTP {resp.status_code}"
            await db.indexedclan.update(
                where={"id": clan_id},
                data={
                    "colorDetectionStatus": "failed",
                    "colorDetectionError": error_msg,
                    "colorDetectionSourceUrl": motif_url,
                    "colorsDetectedAt": now,
                },
            )
            return {"status": "failed", "error": error_msg}

        primary_hex, secondary_hex = extract_colors_from_image(resp.content)

        await db.indexedclan.update(
            where={"id": clan_id},
            data={
                "primaryColor": primary_hex,
                "secondaryColor": secondary_hex,
                "colorDetectionStatus": "success",
                "colorDetectionError": None,
                "colorDetectionSourceUrl": motif_url,
                "colorsDetectedAt": now,
            },
        )

        return {
            "status": "success",
            "primaryColor": primary_hex,
            "secondaryColor": secondary_hex,
        }

    except Exception as e:
        error_msg = f"Color detection failed: {str(e)[:200]}"
        logger.warning("Color detection failed for clan %s: %s", clan_id, error_msg)
        await db.indexedclan.update(
            where={"id": clan_id},
            data={
                "colorDetectionStatus": "failed",
                "colorDetectionError": error_msg,
                "colorDetectionSourceUrl": motif_url,
                "colorsDetectedAt": now,
            },
        )
        return {"status": "failed", "error": error_msg}
