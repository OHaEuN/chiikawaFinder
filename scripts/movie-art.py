#!/usr/bin/env python3
"""
극장판 공식 사이트의 캐릭터 일러스트를 받아 이름표와 소개 글을 잘라낸다.

원본은 1080x1420 이고 위쪽에 그림, 아래쪽에 이름표와 설명이 있다.
sips 의 cropOffset 은 값이 그대로 반영되지 않아 쓰지 않는다. 좌표를 직접 지정한다.
"""

import urllib.request
from pathlib import Path

from PIL import Image

BASE = "https://chiikawa.toho-movie.jp/atm/img"
OUT = Path("public/images/characters")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"

# slug: 원본 파일명
CHARACTERS = {
    "chiikawa": "chii",
    "hachiware": "hachi",
    "usagi": "usagi",
    "momonga": "momo",
    "kurimanju": "kuri",
    "rakko": "rakko",
    "shisa": "shisa",
    "furuhonya": "furuhon",
    "seiren": "siren",
    "ningyo": "mermaid",
    "shimajiro": "shima",
}

# 눈금을 올려 재 보니 그림은 y 0~820 안에 들어간다. 이름표는 850 부터 시작한다.
CROP = (100, 0, 980, 820)


def fetch(name: str) -> Image.Image:
    request = urllib.request.Request(f"{BASE}/ch_{name}.webp", headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return Image.open(response).convert("RGBA")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, name in CHARACTERS.items():
        image = fetch(name)
        cropped = image.crop(CROP)
        target = OUT / f"movie-{slug}.png"
        cropped.save(target)
        print(f"{slug} {cropped.width}x{cropped.height} {target.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
