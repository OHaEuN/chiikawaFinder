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
# 그림마다 따로 맞추면 귀가 긴 우사기만 얼굴이 작아진다.
# 한 시리즈에는 배율 하나를 쓰고, 여섯 장 모두 같은 칸에 담아 크기를 맞춘다.
WIDTH = 40
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


def save(image: Image.Image, name: str, ratio: float, canvas_height: int) -> None:
    """ratio 는 시리즈 공통 배율(px 당), canvas_height 는 여섯 장 공통 높이다."""
    width = round(image.width * ratio)
    height = round(image.height * ratio)
    for scale, suffix in ((1, ""), (2, "@2x")):
        canvas = Image.new("RGBA", (WIDTH * scale, canvas_height * scale), (0, 0, 0, 0))
        resized = image.resize((width * scale, height * scale), Image.LANCZOS)
        # 위를 맞춘다. 우사기 귀가 아래로 밀려 얼굴 위치가 들쭉날쭉해지는 걸 막는다.
        canvas.paste(resized, ((canvas.width - resized.width) // 2, 0))
        canvas.save(OUT / f"{name}{suffix}.png")


def collect(template: str, halo: bool) -> list[Image.Image]:
    images = []
    for index in range(1, len(SLUGS) + 1):
        image = fetch(template.format(n=index))
        if halo:
            drop_halo(image)
        art = drop_name_plate(image)
        images.append(art.crop(art.getbbox()))
    return images


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    series = {"": collect(IDLE, halo=True), "-hover": collect(HOVER, halo=False)}
    # 시리즈마다 원본 해상도가 달라 배율은 따로, 담기는 칸은 같이 쓴다.
    ratios = {suffix: WIDTH / max(i.width for i in images) for suffix, images in series.items()}
    canvas_height = max(
        round(image.height * ratios[suffix]) for suffix, images in series.items() for image in images
    )
    for suffix, images in series.items():
        for slug, image in zip(SLUGS, images):
            save(image, f"{slug}{suffix}", ratios[suffix], canvas_height)
    print(f"여섯 장 {WIDTH}x{canvas_height} 로 생성")


if __name__ == "__main__":
    main()
