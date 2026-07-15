#!/usr/bin/env python3
"""Generate the v1.2 Midnight Verdict roster expansion through Aigram transit."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

from generate_slice_assets import API_URL, HEADERS, download_as_jpeg, generate

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "img" / "customers"
STYLE_RECORD = ROOT / "doc" / "direction-variant-generation.json"
RECORD_PATH = ROOT / "doc" / "roster-expansion-generation.json"

STYLE = (
    "Use the reference only for art direction, cashier-eye-level camera, convenience-store composition, line weight, "
    "halftone density and limited screenprint palette. Create a clearly different adult person with a distinct face, "
    "age, body shape, hair, clothing and pose. Bold adult supernatural graphic-novel panel, realistic adult proportions, "
    "strong dry-brush black ink contours, hand-drawn hatching, coarse halftone, off-register screenprint, deep aubergine, "
    "warm paper cream, acid yellow, counter green and a tiny vermilion accent. Waist-up customer behind the same clean "
    "convenience-store counter, readable face, hands and held objects, square 1024 panel, quiet family-friendly mystery, "
    "no readable text, no logo, no watermark. "
)

CUSTOMERS = [
    {
        "id": "nia",
        "prompt": "Nia, a capable Black woman emergency nurse in her late thirties, navy scrubs under a reflective rain shell, holding a glucose drink, a strip of small birthday candles and a folded foil blanket, tired kind expression.",
    },
    {
        "id": "farah",
        "prompt": "Farah, a Middle Eastern woman puppet repairer in her fifties with silver-streaked curls and a patched plum work coat, holding a friendly cloth fox hand puppet, a spool of thread and a bag of cat food, amused observant expression.",
    },
    {
        "id": "mateo",
        "prompt": "Mateo, a compact Latino locksmith in his forties with close-cropped hair and round safety glasses, moss utility vest covered in key tags, holding an oversized ring of keys and peppermint gum, patient deadpan expression.",
    },
    {
        "id": "anika",
        "prompt": "Anika, a young South Asian amateur astronomer with a long braid, mustard knit cap and deep green field jacket, holding a folded star chart, red-filter flashlight and sunflower seeds, bright sleep-deprived expression.",
    },
    {
        "id": "seam",
        "prompt": "The Seam Guest, an elegant older East Asian alterations tailor with severe bobbed silver hair, long aubergine coat and cream measuring tape, holding black thread and a neatly folded forest-green jacket, perfectly composed expression.",
        "reveal": "Preserve this exact character, face, wardrobe, pose, camera and store composition. The folded jacket opens into an impossible deep corridor of repeating convenience-store shelves, loose black thread stitches the character's shadow to the counter by itself, and the freezer reflection shows only an empty clothes hanger. The coat lining and shadow break the comic panel edge with acid-yellow impact rays. Elegant, nonviolent, family-friendly supernatural reveal; no gore and no readable text.",
    },
    {
        "id": "rain",
        "prompt": "The Rain Collector, an androgynous municipal weather observer in a teal waterproof coat and soft brim hat, holding a transparent folded umbrella and an empty glass sample bottle, calm rain-soaked posture while the store itself is dry.",
        "reveal": "Preserve this exact character, face, wardrobe, pose, camera and store composition. Hundreds of rain droplets rise upward from the coat and umbrella toward the ceiling, while a tiny storm cloud rains inside the sealed glass sample bottle. A perfectly dry black shadow spreads beyond the wet figure and breaks the upper panel border; acid-yellow impact rays point to the inverted rain. Calm, nonviolent, family-friendly supernatural reveal; no gore and no readable text.",
    },
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    direction = json.loads(STYLE_RECORD.read_text(encoding="utf-8"))
    anchor_url = next(
        asset["url"]
        for asset in direction["assets"]
        if asset["direction"] == "C" and asset["state"] == "normal"
    )
    outputs = []
    total = len(CUSTOMERS) + sum(1 for customer in CUSTOMERS if "reveal" in customer)
    step = 0
    for customer in CUSTOMERS:
        step += 1
        normal_prompt = STYLE + customer["prompt"]
        print(f"[{step}/{total}] {customer['id']} normal", flush=True)
        normal_url = generate(normal_prompt, anchor_url)
        normal_file = OUT_DIR / f"{customer['id']}-normal.jpg"
        download_as_jpeg(normal_url, normal_file)
        outputs.append({
            "id": customer["id"],
            "state": "normal",
            "file": str(normal_file.relative_to(ROOT)),
            "url": normal_url,
            "ref_url": anchor_url,
            "prompt": normal_prompt,
        })
        time.sleep(2)
        if "reveal" not in customer:
            continue
        step += 1
        reveal_prompt = STYLE + customer["reveal"]
        print(f"[{step}/{total}] {customer['id']} reveal", flush=True)
        reveal_url = generate(reveal_prompt, normal_url)
        reveal_file = OUT_DIR / f"{customer['id']}-revealed.jpg"
        download_as_jpeg(reveal_url, reveal_file)
        outputs.append({
            "id": customer["id"],
            "state": "revealed",
            "file": str(reveal_file.relative_to(ROOT)),
            "url": reveal_url,
            "ref_url": normal_url,
            "prompt": reveal_prompt,
        })
        time.sleep(2)

    record = {
        "endpoint": API_URL,
        "origin": HEADERS["Origin"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "style_anchor_url": anchor_url,
        "assets": outputs,
    }
    RECORD_PATH.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Roster expansion and provenance saved.", flush=True)


if __name__ == "__main__":
    main()
