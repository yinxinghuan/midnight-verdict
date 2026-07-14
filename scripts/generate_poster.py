#!/usr/bin/env python3
"""Generate the official Midnight Verdict poster through Aigram transit."""

from __future__ import annotations

import json
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from generate_slice_assets import API_URL, HEADERS, generate

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "poster.png"
RECORD = ROOT / "doc" / "poster-generation.json"

PROMPT = (
    "Square 1024x1024 professional narrative game poster in a bold adult supernatural pulp comic style. "
    "Inside a pristine late-night convenience store, a tired ordinary-looking female customer in a bright yellow raincoat "
    "stands centered under fluorescent light, while her enormous impossible black shadow splits into five different customer "
    "silhouettes on the teal freezer wall behind her. In the lower foreground, two clean graphic decision placards angle toward "
    "her like a choice: an acid-yellow card reading HUMAN on the left and a deep aubergine card reading NIGHT GUEST on the right. "
    "A narrow cream receipt separates the two cards. Strong dry-brush black ink contours, coarse halftone dots, hand-drawn hatching, "
    "slightly off-register screenprint, deep aubergine, warm paper cream, acid yellow and counter green. Crisp editorial layout with "
    "large unbroken flat-color areas and a clean cream lower border. Clear central face and decision conflict readable at thumbnail size, "
    "uncanny, clever and family-friendly. Put the exact large readable English title "
    "MIDNIGHT VERDICT across the top 22 percent in two lines, "
    "heavy condensed cream block lettering with black outline. Keep the bottom 18 percent as a simple clean cream border. "
    "No other words, no logo, no watermark, no UI screenshot, no 3D render, no photorealism."
)


def save_png(url: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".source", delete=False) as temp:
        source = Path(temp.name)
    try:
        subprocess.run(
            ["curl", "--fail", "--silent", "--show-error", "--location", "--max-time", "120", "--output", str(source), url],
            check=True,
        )
        subprocess.run(["sips", "-s", "format", "png", str(source), "--out", str(output)], check=True, capture_output=True)
    finally:
        source.unlink(missing_ok=True)


def main() -> None:
    print("Generating official poster through Aigram transit...", flush=True)
    url = generate(PROMPT)
    save_png(url, OUTPUT)
    RECORD.write_text(
        json.dumps(
            {
                "endpoint": API_URL,
                "origin": HEADERS["Origin"],
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "file": "public/poster.png",
                "url": url,
                "prompt": PROMPT,
                "source_type": "Aigram transit raster generation",
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print("Poster and provenance saved.", flush=True)


if __name__ == "__main__":
    main()
