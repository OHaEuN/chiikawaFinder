#!/usr/bin/env python3
"""
캐릭터 얼굴로 마우스 커서 이미지를 만든다.

기본은 애니메이션 공식 사이트의 캐릭터 버튼, 호버는 극장판 공식 사이트의 캐릭터 아이콘을 쓴다.
각각 한 시리즈라 세 캐릭터의 그림체와 크기가 서로 맞는다. 둘 다 배경이 투명하다.
"""

import urllib.request
from pathlib import Path

from PIL import Image

OUT = Path("public/cursor")
SIZE = 40
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"

SLUGS = ("chiikawa", "hachiware", "usagi")

# 평소 표정. 캐릭터 뒤에 노란 원이 깔려 있어 벗겨 내야 한다.
IDLE = "https://www.anime-chiikawa.jp/images/characters/bt_chara_{n:02d}.png"
# 입을 크게 벌린 표정.
HOVER = "https://chiikawa.toho-movie.jp/atm/img/ch_icon_{n:02d}.webp"

HALO = (255, 245, 120)


def fetch(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return Image.open(response).convert("RGBA")


def drop_halo(image: Image.Image) -> None:
    """우사기 몸(255,241,203)과 섞이지 않게 노란 원 색만 좁게 집어 지운다."""
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a and abs(r - HALO[0]) < 12 and abs(g - HALO[1]) < 14 and abs(b - HALO[2]) < 40:
                pixels[x, y] = (0, 0, 0, 0)


def drop_name_plate(image: Image.Image) -> Image.Image:
    """그림 아래 빈 줄 하나를 두고 이름표가 따로 있다. 첫 덩어리만 남긴다."""
    alpha = image.getchannel("A")
    filled = [any(alpha.getpixel((x, y)) > 8 for x in range(image.width)) for y in range(image.height)]
    top = filled.index(True)
    bottom = next((y for y in range(top, image.height) if not filled[y]), image.height)
    return image.crop((0, top, image.width, bottom))


def to_square(image: Image.Image) -> Image.Image:
    """여백을 잘라 내고 정사각형 가운데에 놓는다. 그래야 커서 좌표가 어긋나지 않는다."""
    trimmed = image.crop(image.getbbox())
    side = max(trimmed.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2))
    return square


def save(image: Image.Image, name: str) -> None:
    for scale, suffix in ((1, ""), (2, "@2x")):
        image.resize((SIZE * scale, SIZE * scale), Image.LANCZOS).save(OUT / f"{name}{suffix}.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for index, slug in enumerate(SLUGS, start=1):
        idle = fetch(IDLE.format(n=index))
        drop_halo(idle)
        save(to_square(drop_name_plate(idle)), slug)

        hover = fetch(HOVER.format(n=index))
        save(to_square(drop_name_plate(hover)), f"{slug}-hover")
        print(f"{slug} 기본·호버 생성")


if __name__ == "__main__":
    main()
