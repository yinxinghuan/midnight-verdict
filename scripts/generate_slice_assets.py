#!/usr/bin/env python3
"""Generate the representative customer pair for Midnight Verdict.

Uses the mandatory Aigram transit endpoint. The first image establishes Mira's
face, wardrobe, camera, and light. The reveal uses its public result URL as an
img2img reference so the character remains consistent.
"""

from __future__ import annotations

import json
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

API_URL = "https://chat.aiwaves.tech/aigram/api/gen-image"
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "img"
RECORD_PATH = ROOT / "doc" / "gen-image-record.json"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://aigram.app",
    "Referer": "https://aigram.app/",
    "User-Agent": "Mozilla/5.0",
}

STYLE = (
    "live-action cinematic 35mm film still, photorealistic adult actor, natural human facial proportions and eyes, "
    "ordinary late-night convenience store seen from the cashier's eye-level viewpoint, "
    "credible everyday details, 50mm lens feeling, waist-up customer centered behind the counter, "
    "cold white fluorescent key light from upper left, subtle cyan freezer rim light from rear right, "
    "deep teal tiles and dark green counter, cream receipt paper, muted natural skin, "
    "restrained literary noir composition, family-friendly supernatural mystery, crisp readable silhouette, detailed face and hands, "
    "square 1024 by 1024 composition, no text, no letters, no logo, no watermark"
)

DISGUISED_PROMPT = (
    f"{STYLE}. Mira, an exhausted adult overnight delivery dispatcher in a practical muted navy work jacket, "
    "dark hair tied loosely back, realistic proportions, mildly awkward polite expression, "
    "holding a paper soup bowl and an old thermal receipt at the checkout counter. "
    "She looks entirely ordinary and human. A glass freezer door is visible behind her on the right. "
    "The store entrance behind her is closed and peaceful. The scene feels uncanny only through stillness and lighting. "
    "Her hands, clothes, soup bowl, receipt and the lower dark green counter are immaculate and completely clean. "
    "The lower 22 percent is an empty dark green counter surface. Subtle mature live-action mystery drama."
)

REVEALED_PROMPT = (
    f"{STYLE}. Preserve the exact same Mira face, body, navy work jacket, pose, soup bowl, camera, "
    "counter, and convenience-store composition from the reference image. The overhead fluorescent "
    "light has just gone dark, while the cyan freezer rim light reveals her supernatural identity: "
    "her human body remains calm and non-gory, but the freezer glass behind her clearly reflects the "
    "shelves, bowl and cashier while omitting Mira entirely; a thin impossible frost silhouette extends "
    "slightly behind her shoulders like a second colder outline; the soup makes silent bubbles. "
    "Her expression is dryly amused and calm. Strong cyan edge readability, subtle red receipt stamp accent. "
    "Her hands, clothes and the entire counter remain immaculate and clean. The closed store entrance remains peaceful. "
    "Subtle family-friendly supernatural mystery, live-action film still."
)


def generate(prompt: str, ref_url: str | None = None, retries: int = 3) -> str:
    payload: dict[str, str] = {"prompt": prompt}
    if ref_url:
        payload["ref_url"] = ref_url
    data = json.dumps(payload)
    last_error: Exception | None = None
    delays = (3, 8, 15)
    for attempt in range(retries):
        try:
            process = subprocess.run(
                [
                    "curl", "--fail-with-body", "--silent", "--show-error",
                    "--max-time", "360", "--request", "POST",
                    "--header", f"Content-Type: {HEADERS['Content-Type']}",
                    "--header", f"Origin: {HEADERS['Origin']}",
                    "--header", f"Referer: {HEADERS['Referer']}",
                    "--header", f"User-Agent: {HEADERS['User-Agent']}",
                    "--data-binary", data,
                    API_URL,
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            body = json.loads(process.stdout)
            url = body.get("url")
            if not url:
                raise RuntimeError(f"Generation response has no url: {body}")
            return str(url)
        except Exception as error:  # noqa: BLE001 - retain the final network error
            last_error = error
        if attempt < retries - 1:
            time.sleep(delays[attempt])
    raise last_error or RuntimeError("Image generation failed")


def download_as_jpeg(url: str, output: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".source", delete=False) as temp:
        source_path = Path(temp.name)
    try:
        subprocess.run(
            ["curl", "--fail", "--silent", "--show-error", "--location", "--max-time", "120", "--output", str(source_path), url],
            check=True,
        )
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92", str(source_path), "--out", str(output)],
            check=True,
            capture_output=True,
        )
    finally:
        source_path.unlink(missing_ok=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("[1/2] Generating Mira disguise...", flush=True)
    disguised_url = generate(DISGUISED_PROMPT)
    download_as_jpeg(disguised_url, OUT_DIR / "customer-mira-disguised.jpg")
    time.sleep(2)
    print("[2/2] Generating Mira reveal from disguise reference...", flush=True)
    revealed_url = generate(REVEALED_PROMPT, disguised_url)
    download_as_jpeg(revealed_url, OUT_DIR / "customer-mira-revealed.jpg")
    record = {
        "endpoint": API_URL,
        "origin": HEADERS["Origin"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "assets": [
            {"file": "public/img/customer-mira-disguised.jpg", "url": disguised_url, "prompt": DISGUISED_PROMPT},
            {"file": "public/img/customer-mira-revealed.jpg", "url": revealed_url, "ref_url": disguised_url, "prompt": REVEALED_PROMPT},
        ],
    }
    RECORD_PATH.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Assets and provenance record saved.", flush=True)


if __name__ == "__main__":
    main()
