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
from typing import Optional

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
    # 꽃 장식이 y=294 까지 내려오고 눈썹이 295 부터다. 그 사이를 자른다.
    "chiikawa": (1.45, 0.50, 0.84),
    # 앞머리 윤곽선이 y=309 까지 내려와 눈썹과 붙어 있다. 눈썹은 코드로 따로 그린다.
    "hachiware": (1.45, 0.39, 0.84),
    # 눈썹 활이 y=285 부터다. 그 위는 꽃 장식이다.
    "usagi": (1.45, 0.855, 0.86),
}

# 이 색은 몸이다. 지우고 나면 눈·눈썹·볼·입만 남는다.
FADE_FROM = 26
FADE_TO = 62

# 머리 테두리 안쪽으로 이만큼 더 들어와야 테두리 잔상이 안 남는다.
INSET = 9
# 이 밝기 위를 맨 얼굴로 본다. 윤곽선·눈·눈썹은 이보다 어둡다.
PLAIN = 300


def face_region(image: Image.Image, seed: tuple[int, int]) -> set[int]:
    """
    얼굴 안쪽 픽셀을 찾는다.

    눈 사이에서 시작해 맨 얼굴 색을 따라 번진다. 진한 선에서 멈추므로
    머리 윤곽선 · 파란 앞머리 · 꽃 장식 바깥으로는 넘어가지 않는다.
    그 다음 안에 뚫린 구멍(눈·눈썹·볼·입)을 메우고, 테두리 잔상이 없게 안쪽으로 깎는다.

    줄마다 바깥에서 세어 들어오는 방식은 볼터치가 가장자리에 닿는 줄에서 얼굴을 통째로 지웠다.
    """
    width, height = image.size
    pixels = image.load()
    plain = [
        pixels[x, y][3] > 128 and sum(pixels[x, y][:3]) >= PLAIN
        for y in range(height)
        for x in range(width)
    ]
    index = lambda x, y: y * width + x

    def spread(starts: list[int], allowed: list[bool]) -> bytearray:
        seen = bytearray(width * height)
        stack = [i for i in starts if allowed[i]]
        for i in stack:
            seen[i] = 1
        while stack:
            i = stack.pop()
            x, y = i % width, i // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    j = index(nx, ny)
                    if not seen[j] and allowed[j]:
                        seen[j] = 1
                        stack.append(j)
        return seen

    skin = spread([index(*seed)], plain)

    # 구멍 메우기: 바깥에서 번져 닿지 않는 자리는 모두 얼굴 안이다.
    not_skin = [not v for v in skin]
    border = [index(x, y) for x in range(width) for y in (0, height - 1)]
    border += [index(x, y) for y in range(height) for x in (0, width - 1)]
    outside = spread(border, not_skin)
    inside = bytearray(1 if not outside[i] else 0 for i in range(width * height))

    # 테두리 쪽으로 INSET 만큼 깎는다.
    frontier = [
        i
        for i in range(width * height)
        if inside[i]
        and (
            i % width in (0, width - 1)
            or i // width in (0, height - 1)
            or not (inside[i - 1] and inside[i + 1] and inside[i - width] and inside[i + width])
        )
    ]
    for _ in range(INSET):
        nxt = []
        for i in frontier:
            inside[i] = 0
            x, y = i % width, i // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    j = index(nx, ny)
                    if inside[j]:
                        nxt.append(j)
        frontier = nxt

    return {i for i in range(width * height) if inside[i]}


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
        seed = (round(mid[0]), round(mid[1] - span * 0.42))
        region = face_region(leveled, seed)
        pixels = face.load()
        for y in range(face.height):
            for x in range(face.width):
                r, g, b, a = pixels[x, y]
                if (box[1] + y) * leveled.width + (box[0] + x) not in region:
                    pixels[x, y] = (r, g, b, 0)
                    continue
                distance = math.dist((r, g, b), fill)
                keep = (distance - FADE_FROM) / (FADE_TO - FADE_FROM)
                pixels[x, y] = (r, g, b, round(a * max(0.0, min(1.0, keep))))

        target = OUT / f"face-{slug}.png"
        face.save(target)
        eye_y = round(mid[1] - box[1])
        print(f"{slug}: {face.width}x{face.height} 눈간격 {round(span)} 눈높이 {eye_y} 몸색 {fill}")


if __name__ == "__main__":
    main()
