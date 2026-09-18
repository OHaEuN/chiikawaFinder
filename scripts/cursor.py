#!/usr/bin/env python3
"""
캐릭터 얼굴로 마우스 커서 이미지를 만든다.

기본 커서는 극장판 일러스트의 얼굴, 누를 수 있는 곳을 가리킬 때는 표정이 다른 얼굴을 쓴다.
배경은 모서리에서 번져 나가는 방식으로 지운다. 색을 통째로 지우면 캐릭터의 흰 부분까지 날아간다.
"""

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("public/cursor")
SOURCE = Path("public/images/characters")
SIZE = 40
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"

# 표정이 다른 얼굴. 치이카와파크 얼굴 접시 상품으로, 얼굴만 나오고 배경이 희다.
HOVER_FACE = {
    "chiikawa": "4571609367710_1",
    "hachiware": "4571609367727_1",
    "usagi": "4571609367734_1",
}
SHOP_CDN = "https://cdn.shopify.com/s/files/1/0626/7142/1681/files"

# 극장판 일러스트에서 머리만 남기는 비율. 아래쪽 풀잎 목도리를 잘라 낸다.
HEAD_RATIO = 0.74
FLOOD_TOLERANCE = 26


def strip_background(image: Image.Image) -> Image.Image:
    """네 모서리에서 번져 나가며 배경만 투명하게 만든다."""
    canvas = image.convert("RGBA")
    width, height = canvas.size
    for corner in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
        ImageDraw.floodfill(canvas, corner, (0, 0, 0, 0), thresh=FLOOD_TOLERANCE)
    return canvas


def to_square(image: Image.Image) -> Image.Image:
    """여백을 잘라 내고 정사각형 가운데에 놓는다. 그래야 커서 좌표가 어긋나지 않는다."""
    trimmed = image.crop(image.getbbox())
    side = max(trimmed.width, trimmed.height)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2))
    return square


def save(image: Image.Image, name: str) -> None:
    for scale, suffix in ((1, ""), (2, "@2x")):
        image.resize((SIZE * scale, SIZE * scale), Image.LANCZOS).save(OUT / f"{name}{suffix}.png")


def build_default(slug: str) -> None:
    source = strip_background(Image.open(SOURCE / f"movie-{slug}.png"))
    box = source.getbbox()
    head = source.crop((box[0], box[1], box[2], box[1] + round((box[3] - box[1]) * HEAD_RATIO)))
    save(to_square(head), slug)


def build_hover(slug: str) -> None:
    url = f"{SHOP_CDN}/{HOVER_FACE[slug]}.jpg"
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        photo = Image.open(response)
    save(to_square(strip_background(photo)), f"{slug}-hover")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in HOVER_FACE:
        build_default(slug)
        build_hover(slug)
        print(f"{slug} 기본·호버 생성")


if __name__ == "__main__":
    main()
