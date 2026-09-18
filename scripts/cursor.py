#!/usr/bin/env python3
"""
캐릭터 얼굴로 마우스 커서 이미지를 만든다.

기본 커서는 극장판 공식 사이트의 캐릭터 아이콘을 쓴다. 이미 배경이 투명이라 벗겨 낼 필요가 없다.
누를 수 있는 곳 위에서는 표정이 다른 일러스트로 바뀐다. 이쪽은 원형 배지라 원을 벗겨 내야 한다.
둘 다 목 아래를 잘라 얼굴만 남긴다.
"""

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("public/cursor")
SIZE = 40
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"

MOVIE_ICON = {
    "chiikawa": "https://chiikawa.toho-movie.jp/atm/img/ch_icon_01.webp",
    "hachiware": "https://chiikawa.toho-movie.jp/atm/img/ch_icon_02.webp",
    "usagi": "https://chiikawa.toho-movie.jp/atm/img/ch_icon_03.webp",
}

# 표정이 다른 일러스트. 흰 원 안에 캐릭터가 들어간 배지라 원을 벗겨 낸다.
HOVER_BADGE = {
    "chiikawa": "https://chiikawa-biyori.com/wp-content/uploads/2026/07/chiikawa.png",
    "hachiware": "https://chiikawa-biyori.com/wp-content/uploads/2026/04/hachiware.png",
    "usagi": "https://chiikawa-biyori.com/wp-content/uploads/2026/04/usagi.png",
}

FLOOD_TOLERANCE = 26
# 배지 일러스트는 전신이라 위에서 이만큼만 남기면 얼굴이 된다.
HEAD_RATIO = 0.84


def fetch(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return Image.open(response).convert("RGBA")


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


def is_leaf(pixel: tuple[int, int, int, int]) -> bool:
    """목에 두른 풀잎의 연둣빛. 이 색이 나오는 줄부터 아래는 얼굴이 아니다."""
    r, g, b, a = pixel
    return a > 80 and g > 150 and g - r > 25 and g - b > 45


def cut_above_leaves(image: Image.Image) -> Image.Image:
    width, height = image.size
    for y in range(height):
        leaves = sum(1 for x in range(0, width, 2) if is_leaf(image.getpixel((x, y))))
        if leaves > width * 0.05:
            return image.crop((0, 0, width, y))
    return image


def build_default(slug: str) -> None:
    icon = fetch(MOVIE_ICON[slug])
    # 아이콘에는 캐릭터와 이름표가 함께 들어 있다. 위쪽 덩어리만 쓴다.
    alpha = icon.getchannel("A")
    filled = [
        any(alpha.getpixel((x, y)) > 8 for x in range(0, icon.width, 2)) for y in range(icon.height)
    ]
    top = filled.index(True)
    bottom = next((y for y in range(top, icon.height) if not filled[y]), icon.height)
    save(to_square(cut_above_leaves(icon.crop((0, top, icon.width, bottom)))), slug)


def build_hover(slug: str) -> None:
    badge = fetch(HOVER_BADGE[slug])
    width, height = badge.size

    # 모서리에서 번지게 하면 배경에 그러데이션이 있을 때 색이 남는다. 원 바깥을 통째로 지운다.
    # 원을 조금 줄여야 흰 원과 색 배경 사이의 테두리까지 함께 사라진다.
    edge = round(min(width, height) * 0.045)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).ellipse((edge, edge, width - 1 - edge, height - 1 - edge), fill=255)
    badge.putalpha(mask)

    # 원 안쪽 가장자리에서 번지면 캐릭터 윤곽에서 멈춰 흰 원만 지워진다.
    inset = round(min(width, height) * 0.08)
    for point in (
        (width // 2, inset),
        (inset, height // 2),
        (width - inset, height // 2),
        (width // 2, height - inset),
    ):
        ImageDraw.floodfill(badge, point, (0, 0, 0, 0), thresh=FLOOD_TOLERANCE)

    box = badge.getbbox()
    head = badge.crop((box[0], box[1], box[2], box[1] + round((box[3] - box[1]) * HEAD_RATIO)))
    save(to_square(head), f"{slug}-hover")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in MOVIE_ICON:
        build_default(slug)
        build_hover(slug)
        print(f"{slug} 기본·호버 생성")


if __name__ == "__main__":
    main()
