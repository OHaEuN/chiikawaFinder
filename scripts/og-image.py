#!/usr/bin/env python3
"""
링크를 공유했을 때 보이는 썸네일(1200x630)을 만든다.

카카오톡·슬랙·트위터가 og:image 로 읽는다. 사이트 색과 캐릭터를 그대로 쓴다.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("public/og.png")
CURSORS = Path("public/cursor")
SIZE = (1200, 630)
PINK = (255, 233, 239)
PINK_DEEP = (246, 188, 203)
TITLE_INK = (141, 79, 98)
BODY_INK = (184, 105, 127)
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

TITLE = "치이카와 파인더"
SUBTITLE = ["인물 · 온라인 콘텐츠 · 팝업 지도", "신상 굿즈 · 직구 계산기"]
TAG = "먼가 작은"

PAD = 44
INNER = 28
CHARACTER_H = 200
CHARACTERS = ("chiikawa", "hachiware", "usagi")


def font(size: int, index: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size, index=index)


def main() -> None:
    canvas = Image.new("RGB", SIZE, PINK)
    draw = ImageDraw.Draw(canvas)

    # 카드처럼 보이게 안쪽에 밝은 면을 깐다
    draw.rounded_rectangle((PAD, PAD, SIZE[0] - PAD, SIZE[1] - PAD), radius=40, fill=(253, 252, 251))

    # 캐릭터를 먼저 앉히고 남는 자리에 글을 넣는다. 글이 그림에 깔리지 않는다.
    faces = []
    for slug in CHARACTERS:
        face = Image.open(CURSORS / f"{slug}@2x.png").convert("RGBA")
        scale = CHARACTER_H / face.height
        faces.append(face.resize((round(face.width * scale), CHARACTER_H), Image.LANCZOS))
    gap = 18
    block = sum(f.width for f in faces) + gap * (len(faces) - 1)
    x = SIZE[0] - PAD - INNER - block
    top = (SIZE[1] - CHARACTER_H) // 2
    for face in faces:
        canvas.paste(face, (x, top), face)
        x += face.width + gap

    text_right = SIZE[0] - PAD - INNER - block - 40
    left = PAD + INNER + 32
    width = text_right - left

    # index 는 AppleSDGothicNeo.ttc 안의 굵기. 2=Bold, 0=Regular
    title_font = font(80, 2)
    while draw.textlength(TITLE, font=title_font) > width and title_font.size > 40:
        title_font = font(title_font.size - 2, 2)

    y = 212
    draw.text((left + 4, y - 52), TAG, font=font(34, 0), fill=PINK_DEEP)
    draw.text((left, y), TITLE, font=title_font, fill=TITLE_INK)
    y += title_font.size + 34
    for line in SUBTITLE:
        draw.text((left + 4, y), line, font=font(29, 0), fill=BODY_INK)
        y += 42

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(f"{OUT} {SIZE[0]}x{SIZE[1]} {OUT.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
