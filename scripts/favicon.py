#!/usr/bin/env python3
"""
사이트 아이콘을 치이카와 얼굴 그림에서 만든다.

원본은 가로가 더 넓어서 정사각형 가운데에 놓고 여백을 둔다.
탭에서 16px 로 줄어들 때 테두리가 잘리지 않을 만큼만 띄운다.
"""

from pathlib import Path

from PIL import Image

SOURCE = Path("public/images/chiikawa-face.png")
OUT = Path("public")

# 얼굴이 정사각형 안에서 차지할 비율. 꽉 채우면 작은 크기에서 테두리가 붙어 뭉갠다.
FILL = 0.88
PNG_SIZES = {"icon.png": 512, "icon-192.png": 192, "apple-icon.png": 180}
ICO_SIZES = [16, 32, 48]


def square(size: int) -> Image.Image:
    face = Image.open(SOURCE).convert("RGBA")
    inner = round(size * FILL)
    scale = min(inner / face.width, inner / face.height)
    resized = face.resize((round(face.width * scale), round(face.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def main() -> None:
    for name, size in PNG_SIZES.items():
        square(size).save(OUT / name)
        print(f"{name} {size}x{size}")
    # ico 는 여러 크기를 한 파일에 담는다. 브라우저가 쓰는 크기를 골라 간다.
    square(max(ICO_SIZES)).save(OUT / "favicon.ico", sizes=[(s, s) for s in ICO_SIZES])
    print(f"favicon.ico {ICO_SIZES}")


if __name__ == "__main__":
    main()
