#!/usr/bin/env python3
"""
3D 캐릭터 머리에 입힐 얼굴 그림을 만든다.

인형 사진에서 오려 내면 털 결과 조명이 같이 딸려 와 얼룩이 남는다.
극장판 공식 일러스트는 색이 평평해서 몸 색만 지우면 얼굴 무늬가 깨끗하게 남는다.

머리가 기울어 그려진 캐릭터가 있어 두 눈이 수평이 되게 먼저 돌린다.
출력은 눈 중점이 가로 가운데 오도록 자른 투명 PNG다. 좌표는 아래 표로 찍힌다.
"""

import math
from pathlib import Path

from PIL import Image

SOURCE = Path("public/images/characters")
OUT = Path("public/images/hero")

# 두 눈 중심 (원본 880x820 기준). 격자를 그려 눈으로 재고 표시해 확인한 값이다.
EYES = {
    "chiikawa": ((360, 378), (523, 378)),
    "hachiware": ((372, 362), (537, 392)),
    "usagi": ((335, 455), (487, 397)),
}

# 자를 범위. 눈 사이 거리를 1로 본 배수다.
# 머리 윤곽선이 들어오면 얼굴에 검은 테가 생기고, 위를 너무 잡으면 꽃 장식이 딸려 온다.
BOX = {
    # 눈썹이 바로 꽃 장식 아래라 위쪽 여유가 거의 없다.
    "chiikawa": (1.28, 0.50, 0.82),
    # 파란 앞머리는 3D 가 따로 덮는다. 그 아래부터만 쓴다.
    "hachiware": (1.16, 0.38, 0.76),
    # 눈썹이 이마를 크게 가로질러 위를 넉넉히 잡아야 한다.
    "usagi": (1.20, 0.82, 0.78),
}

# 이 색은 몸이다. 지우고 나면 눈·눈썹·볼·입만 남는다.
FADE_FROM = 26
FADE_TO = 62


def body_color(image: Image.Image, eye_mid: tuple[int, int], span: float) -> tuple[int, int, int]:
    """두 눈 사이 한가운데 위쪽은 언제나 맨 얼굴이다. 거기 색을 몸 색으로 본다."""
    x, y = eye_mid
    return image.getpixel((x, round(y - span * 0.42)))[:3]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, (left, right) in EYES.items():
        image = Image.open(SOURCE / f"movie-{slug}.png").convert("RGBA")
        span = math.dist(left, right)
        mid = ((left[0] + right[0]) / 2, (left[1] + right[1]) / 2)
        angle = math.degrees(math.atan2(right[1] - left[1], right[0] - left[0]))

        # 눈이 수평이 되게 눈 중점을 축으로 돌린다.
        leveled = image.rotate(angle, resample=Image.BICUBIC, center=mid)

        half_width, above, below = BOX[slug]
        box = (
            round(mid[0] - span * half_width),
            round(mid[1] - span * above),
            round(mid[0] + span * half_width),
            round(mid[1] + span * below),
        )
        face = leveled.crop(box)

        fill = body_color(leveled, (round(mid[0]), round(mid[1])), span)
        pixels = face.load()
        for y in range(face.height):
            for x in range(face.width):
                r, g, b, a = pixels[x, y]
                distance = math.dist((r, g, b), fill)
                keep = (distance - FADE_FROM) / (FADE_TO - FADE_FROM)
                pixels[x, y] = (r, g, b, round(a * max(0.0, min(1.0, keep))))

        target = OUT / f"face-{slug}.png"
        face.save(target)
        eye_y = round(mid[1] - box[1])
        print(f"{slug}: {face.width}x{face.height} 눈간격 {round(span)} 눈높이 {eye_y} 몸색 {fill}")


if __name__ == "__main__":
    main()
