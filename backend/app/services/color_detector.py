"""Detect dominant colors from clan motif images using Pillow.

Strategy:
  1. Download the motif image from motif_url.
  2. Extract RGBA pixels with position data.
  3. Filter out transparent, near-black, near-white, and desaturated pixels.
  4. Group remaining pixels into hue families (30-degree HSL buckets).
  5. Score each hue family by pixel count, saturation, and brightness.
  6. Primary = strongest hue family (main banner fill color).
  7. Secondary = strongest distinct hue family found preferentially in
     edge/border pixels (banner border color, not center icon).
  8. Representative color = brightest saturated member of the family
     (avoids muddy averaged blends).
"""

import colorsys
import logging
import re
from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO

import httpx
from PIL import Image

from app.core.database import db

logger = logging.getLogger(__name__)

# ── Thresholds ──
MIN_SATURATION = 0.08
MIN_LIGHTNESS = 0.04
MAX_LIGHTNESS = 0.94
HUE_BUCKET_SIZE = 30          # degrees
MIN_HUE_DISTANCE = 25         # degrees — secondary must differ from primary
EDGE_WEIGHT = 2.5             # border pixels count this many times more for secondary
EDGE_MARGIN_X = 3             # pixels from left/right edge
EDGE_MARGIN_Y = 2             # pixels from top/bottom edge
# Regex to strip size query params from motif URLs so we get full-size images
_SIZE_PARAM_RE = re.compile(r"[?&](w|h)=\d+", re.IGNORECASE)


def _full_size_motif_url(url: str) -> str:
    """Strip w= and h= query params from motif URLs to get the full-size image."""
    # Normalize HTML entities first
    cleaned = url.replace("&amp;", "&")
    # Remove w= and h= params
    cleaned = _SIZE_PARAM_RE.sub("", cleaned)
    # Clean up resulting URL artifacts (double &&, trailing ?&, etc.)
    cleaned = cleaned.replace("&&", "&").rstrip("?&")
    # If only ? remains after stripping, remove it
    if cleaned.endswith("?"):
        cleaned = cleaned[:-1]
    return cleaned


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _hue_distance(h1: float, h2: float) -> float:
    """Circular hue distance in degrees (0-180)."""
    d = abs(h1 - h2)
    return min(d, 360 - d)


def _pixel_quality_score(s: float, l: float) -> float:
    """Score a pixel by how visually meaningful it is. Higher = better."""
    # Prefer mid-lightness, high-saturation colors
    l_score = 1.0 - abs(l - 0.45) * 1.5   # peaks at L=0.45
    l_score = max(0.0, l_score)
    return s * l_score


def _light_representative(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    """Pick a representative color for the white/light family.

    Uses a high-percentile pixel by luminance to get a clean, bright white
    rather than a shadow-darkened gray.
    """
    if not pixels:
        return (255, 255, 255)
    sorted_by_lum = sorted(pixels, key=lambda p: 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2])
    # Pick 95th percentile — bright representative of the white family
    idx = min(len(sorted_by_lum) - 1, int(len(sorted_by_lum) * 0.95))
    return sorted_by_lum[idx]


def _dark_representative(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    """Pick a representative color for the dark/black family.

    Uses the median pixel by luminance to get a clean, typical dark color
    rather than an outlier with color tint.
    """
    if not pixels:
        return (0, 0, 0)
    sorted_by_lum = sorted(pixels, key=lambda p: 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2])
    return sorted_by_lum[len(sorted_by_lum) // 2]


def _best_representative(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    """Pick the brightest, most saturated pixel as the representative color.

    This avoids muddy averaged blends from compression artifacts.
    """
    if not pixels:
        return (128, 128, 128)

    def _quality(p: tuple[int, int, int]) -> float:
        _h, l, s = colorsys.rgb_to_hls(p[0] / 255, p[1] / 255, p[2] / 255)
        return _pixel_quality_score(s, l)

    best = max(pixels, key=_quality)
    return best


def extract_colors_from_image(image_data: bytes) -> tuple[str, str]:
    """Extract primary and secondary colors from image bytes.

    Returns (primary_hex, secondary_hex).
    Raises ValueError if no usable colors found.
    """
    img = Image.open(BytesIO(image_data))
    rgba = img.convert("RGBA")
    w, h = rgba.size
    raw_pixels = list(rgba.getdata())

    logger.info("Color detection: image %dx%d, %d total pixels", w, h, len(raw_pixels))

    # Scale edge margins proportionally to image size
    edge_x = max(EDGE_MARGIN_X, int(w * 0.08))
    edge_y = max(EDGE_MARGIN_Y, int(h * 0.12))

    # ── Step 1: Classify pixels by position and extract HSL ──
    hue_families: dict[int, dict] = defaultdict(lambda: {
        "all_pixels": [],
        "edge_pixels": [],
        "center_pixels": [],
        "total_quality": 0.0,
        "edge_quality": 0.0,
    })

    # Track dark/black and light/white pixels separately — they may be intentional
    dark_pixels: list[tuple[int, int, int]] = []
    dark_edge_pixels: list[tuple[int, int, int]] = []
    light_pixels: list[tuple[int, int, int]] = []
    light_edge_pixels: list[tuple[int, int, int]] = []
    opaque_count = 0

    for i, (r, g, b, a) in enumerate(raw_pixels):
        if a < 128:
            continue
        opaque_count += 1

        x = i % w
        y = i // w
        is_edge = (x < edge_x or x >= w - edge_x or
                   y < edge_y or y >= h - edge_y)

        h_val, l_val, s_val = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)

        # Collect dark pixels (near-black, low-sat darks)
        if l_val < 0.15 and s_val < 0.3:
            dark_pixels.append((r, g, b))
            if is_edge:
                dark_edge_pixels.append((r, g, b))
            continue

        # Collect light/white pixels (low-sat, medium-to-high lightness)
        # This catches white banners even with shadow gradients darkening them
        if s_val < 0.12 and l_val > 0.40:
            light_pixels.append((r, g, b))
            if is_edge:
                light_edge_pixels.append((r, g, b))
            continue

        # Filter low-saturation grays (not dark/white — just muddy mid-tones)
        if s_val < MIN_SATURATION:
            continue
        if l_val < MIN_LIGHTNESS:
            continue

        hue_deg = h_val * 360
        bucket = int(hue_deg // HUE_BUCKET_SIZE) * HUE_BUCKET_SIZE
        quality = _pixel_quality_score(s_val, l_val)

        fam = hue_families[bucket]
        fam["all_pixels"].append((r, g, b))
        fam["total_quality"] += quality

        if is_edge:
            fam["edge_pixels"].append((r, g, b))
            fam["edge_quality"] += quality
        else:
            fam["center_pixels"].append((r, g, b))

    # If dark pixels represent >= 15% of opaque pixels, treat as intentional color
    DARK_BUCKET = -1  # sentinel bucket for dark/black family
    if opaque_count > 0 and len(dark_pixels) / opaque_count >= 0.15:
        dark_ratio = len(dark_pixels) / opaque_count
        # If dark dominates (>=55%), it's the main banner fill → high quality so it wins primary
        # If dark is present but not dominant, it's likely just border/outline → lower quality
        per_pixel_q = 0.45 if dark_ratio >= 0.55 else 0.06
        dark_quality = len(dark_pixels) * per_pixel_q
        hue_families[DARK_BUCKET] = {
            "all_pixels": dark_pixels,
            "edge_pixels": dark_edge_pixels,
            "center_pixels": [p for p in dark_pixels if p not in dark_edge_pixels],
            "total_quality": dark_quality,
            "edge_quality": dark_quality * (len(dark_edge_pixels) / max(1, len(dark_pixels))),
        }
        logger.info("  Dark/black family: %d pixels (%.0f%% of opaque)", len(dark_pixels), 100 * len(dark_pixels) / opaque_count)

    # If light/white pixels represent >= 15% of opaque pixels, treat as intentional color
    LIGHT_BUCKET = -2  # sentinel bucket for white/light family
    if opaque_count > 0 and len(light_pixels) / opaque_count >= 0.15:
        light_ratio = len(light_pixels) / opaque_count
        # Check if light family is larger than the biggest colored hue family
        max_colored_count = max(
            (len(f["all_pixels"]) for f in hue_families.values()), default=0
        )
        light_is_dominant = len(light_pixels) > max_colored_count * 1.4
        # High quality when light is truly the dominant family (more than any single color)
        per_pixel_q = 0.45 if light_is_dominant else 0.06
        light_quality = len(light_pixels) * per_pixel_q
        hue_families[LIGHT_BUCKET] = {
            "all_pixels": light_pixels,
            "edge_pixels": light_edge_pixels,
            "center_pixels": [p for p in light_pixels if p not in light_edge_pixels],
            "total_quality": light_quality,
            "edge_quality": light_quality * (len(light_edge_pixels) / max(1, len(light_pixels))),
        }
        logger.info("  Light/white family: %d pixels (%.0f%% of opaque)", len(light_pixels), 100 * len(light_pixels) / opaque_count)

    if not hue_families:
        raise ValueError("No usable saturated pixels found in image")

    total_classified = sum(len(f["all_pixels"]) for f in hue_families.values())
    min_family_size = max(30, int(total_classified * 0.01))  # at least 1% of pixels or 30

    # ── Step 2: Score each hue family for primary selection ──
    # Primary = main banner fill, scored by total pixel count * quality
    family_scores: list[tuple[int, float, dict]] = []
    for bucket, fam in hue_families.items():
        count = len(fam["all_pixels"])
        score = fam["total_quality"] * (count ** 0.5)  # sqrt weighting avoids huge families dominating
        family_scores.append((bucket, score, fam))
        rep = _best_representative(fam["all_pixels"])
        rep_hex = _rgb_to_hex(*rep)
        if bucket == DARK_BUCKET:
            label = "DARK"
        elif bucket == LIGHT_BUCKET:
            label = "LIGHT"
        else:
            label = f"Hue {bucket}-{bucket + HUE_BUCKET_SIZE}"
        logger.info(
            "  %s: count=%d edge=%d center=%d score=%.1f rep=%s",
            label, count,
            len(fam["edge_pixels"]), len(fam["center_pixels"]),
            score, rep_hex,
        )

    family_scores.sort(key=lambda x: -x[1])

    primary_bucket = family_scores[0][0]
    primary_fam = family_scores[0][2]
    if primary_bucket == DARK_BUCKET:
        primary_rep = _dark_representative(primary_fam["all_pixels"])
    elif primary_bucket == LIGHT_BUCKET:
        primary_rep = _light_representative(primary_fam["all_pixels"])
    else:
        primary_rep = _best_representative(primary_fam["all_pixels"])
    primary_hex = _rgb_to_hex(*primary_rep)

    logger.info("Selected PRIMARY: hue %d, color %s", primary_bucket, primary_hex)

    # ── Step 3: Select secondary — prefer edge/border colors ──
    # Secondary = banner border color, must be hue-distinct from primary
    # Edge pixels get a weight boost
    secondary_hex = None
    secondary_reason = "none"

    for bucket, _score, fam in family_scores[1:]:
        # Dark/light families are always distinct from colored families (and each other)
        if bucket >= 0 and primary_bucket >= 0 and _hue_distance(
            bucket + HUE_BUCKET_SIZE / 2,
            primary_bucket + HUE_BUCKET_SIZE / 2,
        ) < MIN_HUE_DISTANCE:
            continue

        edge_count = len(fam["edge_pixels"])
        center_count = len(fam["center_pixels"])
        total_count = len(fam["all_pixels"])

        # Score with edge weighting — border colors get boosted
        edge_boosted_score = (
            fam["edge_quality"] * EDGE_WEIGHT + fam["total_quality"]
        )

        if total_count < min_family_size:
            continue  # Skip tiny artifact clusters

        # For light/dark families as secondary: only use if they represent
        # a meaningful portion of the image, not just anti-aliasing artifacts
        if bucket in (DARK_BUCKET, LIGHT_BUCKET):
            family_ratio = total_count / max(1, total_classified)
            if family_ratio < 0.20:
                continue

        # Prefer this family if it has meaningful edge presence
        if edge_count > 0 or total_count >= 10:
            # Use all pixels for representative color (best saturation/brightness)
            # Edge weighting is for family selection, not color representation
            if bucket == DARK_BUCKET:
                rep = _dark_representative(fam["all_pixels"])
            elif bucket == LIGHT_BUCKET:
                rep = _light_representative(fam["all_pixels"])
            else:
                rep = _best_representative(fam["all_pixels"])
            secondary_hex = _rgb_to_hex(*rep)
            secondary_reason = (
                f"hue {bucket}, edge={edge_count}, center={center_count}, "
                f"score={edge_boosted_score:.1f}"
            )
            break

    if secondary_hex is None:
        # Fallback: use a lightness-shifted variant of primary
        h_p, l_p, s_p = colorsys.rgb_to_hls(
            primary_rep[0] / 255, primary_rep[1] / 255, primary_rep[2] / 255
        )
        alt_l = max(0.15, l_p - 0.25) if l_p > 0.5 else min(0.85, l_p + 0.25)
        alt_r, alt_g, alt_b = colorsys.hls_to_rgb(h_p, alt_l, s_p)
        secondary_hex = _rgb_to_hex(int(alt_r * 255), int(alt_g * 255), int(alt_b * 255))
        secondary_reason = "lightness-shifted primary (no distinct hue family found)"

    logger.info("Selected SECONDARY: %s (%s)", secondary_hex, secondary_reason)

    return primary_hex, secondary_hex


async def detect_clan_colors(clan_id: str, motif_url: str) -> dict:
    """Download motif image for a clan, detect colors, and store them.

    Returns a summary dict with status and detected colors.
    """
    now = datetime.now(timezone.utc)
    full_url = _full_size_motif_url(motif_url)
    logger.info("Color detection for clan %s: %s → %s", clan_id, motif_url, full_url)

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(full_url)

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
