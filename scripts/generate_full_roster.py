#!/usr/bin/env python3
"""Generate the remaining Midnight Verdict comic roster through Aigram transit."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

from generate_slice_assets import API_URL, HEADERS, download_as_jpeg, generate

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "img" / "customers"
STYLE_RECORD = ROOT / "doc" / "direction-variant-generation.json"
RECORD_PATH = ROOT / "doc" / "roster-generation.json"

STYLE = (
    "Use the reference only for art direction, camera, convenience-store composition, line weight, halftone density "
    "and limited screenprint palette. Create a clearly different person with a distinct face, age, body shape, hair, "
    "clothing and pose. Bold adult supernatural graphic-novel panel, realistic adult proportions, strong dry-brush "
    "black ink contours, hand-drawn hatching, coarse halftone, off-register screenprint, deep aubergine, warm paper "
    "cream, acid yellow, counter green and a tiny vermilion accent. Cashier eye-level fixed camera, waist-up customer, "
    "clean convenience-store counter, readable hands and held objects, square 1024 panel, quiet family-friendly mystery. "
)

CUSTOMERS = [
    {
        "id": "lin",
        "prompt": "Lin, a tired East Asian middle-aged parent in a practical raincoat, holding a milk carton and two battery packs, gentle guarded expression, a child-drawn paper star tucked in one pocket.",
    },
    {
        "id": "omar",
        "prompt": "Omar, an older Middle Eastern taxi driver with a salt-and-pepper moustache and sturdy build, wearing a dark quilted driving vest, holding black coffee and windshield wipes, patient exhausted expression.",
    },
    {
        "id": "jun",
        "prompt": "Jun, a slim young adult university student with short tousled hair and round glasses, oversized moss jacket, holding instant noodles and a red correction pen, alert anxious expression.",
    },
    {
        "id": "eve",
        "prompt": "Eve, a confident Black woman in her thirties, amateur close-up magician wearing a plum blazer, holding a deck of cards and a bunch of bananas, dry theatrical expression.",
    },
    {
        "id": "hassan",
        "prompt": "Hassan, a broad South Asian night baker in his forties, rolled sleeves and flour-dusted dark apron, holding a bag of ice and a wrapped baguette, warm cheerful face.",
    },
    {
        "id": "rosa",
        "prompt": "Rosa, an older Latina florist with silver curls and a green utility coat, holding a tiny bouquet of night flowers and a box of salt, observant amused expression.",
    },
    {
        "id": "theo",
        "prompt": "Theo, a lanky white older janitor with a shaved head and rectangular glasses, reflective work jacket, holding yellow gloves and a sea sponge, politely suspicious expression.",
    },
    {
        "id": "tuesday",
        "prompt": "Mr Tuesday, a tall immaculate office worker in a charcoal overcoat with an old-fashioned tie, holding a desk calendar and canned peaches, expression too punctual and still.",
        "reveal": "Preserve this exact comic character and composition. His black shadow points in the opposite direction from every object, his desk calendar flips to a weekday that does not exist, and a single acid-yellow tracking tear crosses the panel. Calm wry expression, shadow breaks the upper panel border.",
    },
    {
        "id": "lumen",
        "prompt": "Lumen, a pale androgynous streetlight repair technician with cropped light hair, heavy violet utility coat, holding two dead bulbs and a paper cup, shy light-sensitive expression.",
        "reveal": "Preserve this exact comic character and composition. The overhead lamp turns into an acid-yellow halo crowded with stylized moth-wing shapes, while their face casts no halftone shadow and the freezer reflection is empty. One short horizontal tracking tear crosses the panel; calm nonviolent reveal.",
    },
    {
        "id": "echo",
        "prompt": "Echo, a cheerful East Asian karaoke host in a patterned aubergine shirt, holding a tiny portable speaker and lemon soda, expressive hands, smile arriving slightly too early.",
        "reveal": "Preserve this exact comic character and composition. Three offset black speech silhouettes leave the mouth before it opens, the portable speaker displays the reply first, and a short acid-yellow tracking tear crosses the frame. Shadow breaks one panel edge; playful family-friendly supernatural reveal.",
    },
    {
        "id": "paper",
        "prompt": "The Paper Guest, an elderly ambiguous book collector in a long forest-green coat, holding folded newspapers and a blank receipt roll, face mostly hidden by a wide soft hat, courteous still posture.",
        "reveal": "Preserve this exact comic character and composition. Their black shadow unfolds into layered paper sheets beyond the panel border, the blank receipt prints the cashier's name by itself, and one horizontal signal tear crosses the image. Acid-yellow impact rays point to the receipt; elegant nonviolent reveal.",
    },
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    direction = json.loads(STYLE_RECORD.read_text(encoding="utf-8"))
    anchor_url = next(asset["url"] for asset in direction["assets"] if asset["direction"] == "C" and asset["state"] == "normal")
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
        outputs.append({"id": customer["id"], "state": "normal", "file": str(normal_file.relative_to(ROOT)), "url": normal_url, "ref_url": anchor_url, "prompt": normal_prompt})
        time.sleep(2)
        if "reveal" in customer:
            step += 1
            reveal_prompt = STYLE + customer["reveal"]
            print(f"[{step}/{total}] {customer['id']} reveal", flush=True)
            reveal_url = generate(reveal_prompt, normal_url)
            reveal_file = OUT_DIR / f"{customer['id']}-revealed.jpg"
            download_as_jpeg(reveal_url, reveal_file)
            outputs.append({"id": customer["id"], "state": "revealed", "file": str(reveal_file.relative_to(ROOT)), "url": reveal_url, "ref_url": normal_url, "prompt": reveal_prompt})
            time.sleep(2)

    record = {
        "endpoint": API_URL,
        "origin": HEADERS["Origin"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "style_anchor_url": anchor_url,
        "assets": outputs,
    }
    RECORD_PATH.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Full roster and provenance saved.", flush=True)


if __name__ == "__main__":
    main()
