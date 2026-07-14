#!/usr/bin/env python3
"""Generate B/C visual-direction comparison assets from the approved Mira anchor."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

from generate_slice_assets import API_URL, HEADERS, download_as_jpeg, generate

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "img"
SOURCE_RECORD = ROOT / "doc" / "gen-image-record.json"
RECORD_PATH = ROOT / "doc" / "direction-variant-generation.json"

B_NORMAL = (
    "Transform the reference into a late-1990s analog convenience-store surveillance-camera still. "
    "Preserve Mira as the same adult woman, navy work jacket, soup bowl and thermal receipt. "
    "Ceiling-corner CCTV viewpoint with a moderate 28mm wide-angle perspective, slightly high camera, "
    "monochrome phosphor green and dirty grey palette, crushed blacks, fluorescent light bloom, subtle "
    "horizontal scan lines, low frame-rate motion echo, practical store shelves and freezer, tense empty night. "
    "The image remains readable at phone size, her face and hands are clear, the counter is clean, and the frame "
    "feels like authentic security footage from a quiet family-friendly supernatural mystery. Square frame."
)

B_REVEAL = (
    "Preserve the exact same surveillance camera, Mira, navy jacket, soup bowl, receipt and store composition "
    "from the reference. Create the supernatural reveal as a single corrupted CCTV frame: her freezer reflection "
    "is delayed and faces the wrong direction, a second pale phosphor silhouette sits three frames behind her, "
    "and one horizontal tracking tear crosses the background. Her expression stays calm and dryly amused. "
    "Monochrome phosphor green, dirty grey, crushed blacks, restrained analog noise, clear phone-size silhouette, "
    "quiet family-friendly mystery, clean counter, square frame."
)

C_NORMAL = (
    "Transform the reference into a bold adult supernatural graphic-novel panel. Preserve Mira as the same adult "
    "woman, navy work jacket, soup bowl, thermal receipt and convenience-store counter. Strong dry-brush black ink "
    "contours, visible hand-drawn hatching, coarse halftone dots, off-register screenprint edges, realistic adult "
    "proportions, expressive but restrained face. Limited palette of deep aubergine, warm paper cream, acid yellow "
    "and a tiny vermilion accent. Flat theatrical composition, clear at phone size, authored indie comic, square panel."
)

C_REVEAL = (
    "Preserve the exact same graphic-novel Mira, navy jacket, soup bowl, receipt, counter, camera and limited palette "
    "from the reference. Create the supernatural reveal as a dramatic comic panel: her heavy black shadow separates "
    "from her body and pushes beyond a broken panel border, the freezer reflection is an empty halftone silhouette, "
    "and acid-yellow impact rays converge on the receipt. Her expression is wry and calm. Deep aubergine, paper cream, "
    "acid yellow and vermilion, thick dry-brush ink, coarse halftone, energetic but family-friendly, square panel."
)


def main() -> None:
    source = json.loads(SOURCE_RECORD.read_text(encoding="utf-8"))
    anchor_url = source["assets"][0]["url"]
    jobs = []
    for code, normal_prompt, reveal_prompt in (
        ("b", B_NORMAL, B_REVEAL),
        ("c", C_NORMAL, C_REVEAL),
    ):
        print(f"[{code.upper()} 1/2] normal", flush=True)
        normal_url = generate(normal_prompt, anchor_url)
        normal_file = OUT_DIR / f"customer-mira-{code}-normal.jpg"
        download_as_jpeg(normal_url, normal_file)
        time.sleep(2)
        print(f"[{code.upper()} 2/2] reveal", flush=True)
        reveal_url = generate(reveal_prompt, normal_url)
        reveal_file = OUT_DIR / f"customer-mira-{code}-revealed.jpg"
        download_as_jpeg(reveal_url, reveal_file)
        jobs.extend([
            {"direction": code.upper(), "state": "normal", "file": str(normal_file.relative_to(ROOT)), "url": normal_url, "ref_url": anchor_url, "prompt": normal_prompt},
            {"direction": code.upper(), "state": "revealed", "file": str(reveal_file.relative_to(ROOT)), "url": reveal_url, "ref_url": normal_url, "prompt": reveal_prompt},
        ])
        time.sleep(2)

    record = {
        "endpoint": API_URL,
        "origin": HEADERS["Origin"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "anchor_url": anchor_url,
        "assets": jobs,
    }
    RECORD_PATH.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Direction assets and provenance record saved.", flush=True)


if __name__ == "__main__":
    main()
