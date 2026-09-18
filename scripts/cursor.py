#!/usr/bin/env python3
"""
캐릭터 얼굴로 마우스 커서 이미지를 만든다.

원본은 배경이 단색이라 그 색을 투명으로 바꾸고, 캐릭터가 꽉 차도록 여백을 잘라 낸다.
브라우저 커서는 32px 안팎이 가장 또렷해 두 배 크기까지만 만든다.
"""

from pathlib import Path

from PIL import Image

SOURCE = Path("public/images/characters")
OUT = Path("public/cursor")
SIZE = 40
# 배경색과 이 정도까지 차이나면 배경으로 본다. 그림의 흰색은 테두리가 있어 살아남는다.
BACKGROUND_TOLERANCE = 18


def to_cursor(slug: str) -> None:
    image = Image.open(SOURCE / f"movie-{slug}.png").convert("RGBA")
    pixels = image.load()
    background = pixels[2, 2][:3]

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            near = abs(r - background[0]) + abs(g - background[1]) + abs(b - background[2])
            if near <= BACKGROUND_TOLERANCE:
                pixels[x, y] = (r, g, b, 0)

    trimmed = image.crop(image.getbbox())
    # 정사각형 안에 넣어야 커서 좌표가 어긋나지 않는다.
    side = max(trimmed.width, trimmed.height)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2))

    for scale, suffix in ((1, ""), (2, "@2x")):
        square.resize((SIZE * scale, SIZE * scale), Image.LANCZOS).save(OUT / f"{slug}{suffix}.png")
    print(f"{slug} {trimmed.width}x{trimmed.height} → {SIZE}px, {SIZE * 2}px")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in ("chiikawa", "hachiware", "usagi"):
        to_cursor(slug)


if __name__ == "__main__":
    main()
