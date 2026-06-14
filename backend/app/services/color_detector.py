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
from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO

import httpx
from PIL import Image

from app.core.database import db

logger = logging.getLogger(__name__)

# ── Thresholds ──
MIN_SATURATION = 0.08
MIN_LIGHTNESS = 0.06
MAX_LIGHTNESS = 0.94
HUE_BUCKET_SIZE = 30          # degrees
MIN_HUE_DISTANCE = 40         # degrees — secondary must differ from primary
EDGE_WEIGHT = 2.5             # border pixels count this many times more for secondary
EDGE_MARGIN_X = 3             # pixels from left/right edge
EDGE_MARGIN_Y = 2             # pixels from top/bottom edge


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

    # ── Step 1: Classify pixels by position and extract HSL ──
    hue_families: dict[int, dict] = defaultdict(lambda: {
        "all_pixels": [],
        "edge_pixels": [],
        "center_pixels": [],
        "total_quality": 0.0,
        "edge_quality": 0.0,
    })

    for i, (r, g, b, a) in enumerate(raw_pixels):
        if a < 128:
            continue

        h_val, l_val, s_val = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)

        # Filter uninteresting pixels
        if s_val < MIN_SATURATION:
            continue
        if l_val < MIN_LIGHTNESS or l_val > MAX_LIGHTNESS:
            continue

        hue_deg = h_val * 360
        bucket = int(hue_deg // HUE_BUCKET_SIZE) * HUE_BUCKET_SIZE
        quality = _pixel_quality_score(s_val, l_val)

        x = i % w
        y = i // w
        is_edge = (x < EDGE_MARGIN_X or x >= w - EDGE_MARGIN_X or
                   y < EDGE_MARGIN_Y or y >= h - EDGE_MARGIN_Y)

        fam = hue_families[bucket]
        fam["all_pixels"].append((r, g, b))
        fam["total_quality"] += quality

        if is_edge:
            fam["edge_pixels"].append((r, g, b))
            fam["edge_quality"] += quality
        else:
            fam["center_pixels"].append((r, g, b))

    if not hue_families:
        raise ValueError("No usable saturated pixels found in image")

    # ── Step 2: Score each hue family for primary selection ──
    # Primary = main banner fill, scored by total pixel count * quality
    family_scores: list[tuple[int, float, dict]] = []
    for bucket, fam in hue_families.items():
        count = len(fam["all_pixels"])
        score = fam["total_quality"] * (count ** 0.5)  # sqrt weighting avoids huge families dominating
        family_scores.append((bucket, score, fam))
        rep = _best_representative(fam["all_pixels"])
        rep_hex = _rgb_to_hex(*rep)
        logger.info(
            "  Hue %d-%d: count=%d edge=%d center=%d score=%.1f rep=%s",
            bucket, bucket + HUE_BUCKET_SIZE, count,
            len(fam["edge_pixels"]), len(fam["center_pixels"]),
            score, rep_hex,
        )

    family_scores.sort(key=lambda x: -x[1])

    primary_bucket = family_scores[0][0]
    primary_fam = family_scores[0][2]
    primary_rep = _best_representative(primary_fam["all_pixels"])
    primary_hex = _rgb_to_hex(*primary_rep)

    logger.info("Selected PRIMARY: hue %d, color %s", primary_bucket, primary_hex)

    # ── Step 3: Select secondary — prefer edge/border colors ──
    # Secondary = banner border color, must be hue-distinct from primary
    # Edge pixels get a weight boost
    secondary_hex = None
    secondary_reason = "none"

    for bucket, _score, fam in family_scores[1:]:
        if _hue_distance(bucket + HUE_BUCKET_SIZE / 2,
                         primary_bucket + HUE_BUCKET_SIZE / 2) < MIN_HUE_DISTANCE:
            continue

        edge_count = len(fam["edge_pixels"])
        center_count = len(fam["center_pixels"])
        total_count = len(fam["all_pixels"])

        # Score with edge weighting — border colors get boosted
        edge_boosted_score = (
            fam["edge_quality"] * EDGE_WEIGHT + fam["total_quality"]
        )

        if total_count < 3:
            continue  # Skip tiny artifact clusters

        # Prefer this family if it has meaningful edge presence
        if edge_count > 0 or total_count >= 10:
            rep = _best_representative(
                fam["edge_pixels"] if edge_count >= 3 else fam["all_pixels"]
            )
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
