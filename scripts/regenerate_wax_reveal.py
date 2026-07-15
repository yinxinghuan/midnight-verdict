#!/usr/bin/env python3
"""Repair Wax Guest reveal identity continuity through Aigram transit."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from generate_roster_expansion import STYLE
from generate_slice_assets import download_as_jpeg, generate

ROOT = Path(__file__).resolve().parents[1]
RECORD_PATH = ROOT / "doc" / "roster-expansion-2-generation.json"
OUTPUT_PATH = ROOT / "public" / "img" / "customers" / "wax-revealed.jpg"

PROMPT = STYLE + (
    "STRICT CHARACTER CONTINUITY: preserve the exact same older androgynous candle restorer from the reference, "
    "including the completely bald smooth shaved head with absolutely no hair, same long narrow face, eyes, nose, "
    "burgundy workshop smock, cream gloves, pose, hands, three candles, wax tin, camera and store composition. "
    "Pale wax streams upward from the counter into the unlit candles. Each wick casts a flame-shaped black shadow "
    "despite producing no light. The smock edge becomes sculpted wax folds, non-gory. Acid-yellow heat lines point "
    "upward and one black wax silhouette breaks the panel border. Calm family-friendly supernatural reveal, no text."
)


def main() -> None:
    record = json.loads(RECORD_PATH.read_text(encoding="utf-8"))
    normal = next(asset for asset in record["assets"] if asset["id"] == "wax" and asset["state"] == "normal")
    reveal_url = generate(PROMPT, normal["url"])
    download_as_jpeg(reveal_url, OUTPUT_PATH)
    repaired = {
        "id": "wax", "state": "revealed", "file": str(OUTPUT_PATH.relative_to(ROOT)),
        "url": reveal_url, "ref_url": normal["url"], "prompt": PROMPT,
        "regenerated_at": datetime.now(timezone.utc).isoformat(),
    }
    record["assets"] = [
        repaired if asset["id"] == "wax" and asset["state"] == "revealed" else asset
        for asset in record["assets"]
    ]
    RECORD_PATH.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Wax reveal regenerated with bald identity lock.", flush=True)


if __name__ == "__main__":
    main()
