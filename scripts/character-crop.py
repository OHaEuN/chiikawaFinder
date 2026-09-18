#!/usr/bin/env python3
"""
공식 프로필이 없는 인물은 원작 만화 페이지에서 받아 온다.
페이지를 통째로 쓰면 카드에서 누가 누군지 알아볼 수 없어 해당 칸만 잘라 낸다.

좌표는 내려받은 원본 해상도 기준이고, 눈으로 칸을 찾아 잰 값이다.
"""

import json
from pathlib import Path

from PIL import Image

DATA = Path("src/data/characters.json")
IMAGES = Path("public/images/characters")

# slug: (왼쪽, 위, 오른쪽, 아래)
PANELS = {
    "erai-yoroi-san": (124, 770, 690, 1430),
    "ippon-tsuno-chan": (12, 626, 182, 888),
    "kusa-no-yoroi": (609, 790, 993, 999),
    "kyojin": (295, 8, 628, 288),
    "hebi-no-okimono": (398, 148, 630, 302),
    "medusa": (220, 380, 720, 670),
}


def main() -> None:
    characters = json.loads(DATA.read_text(encoding="utf-8"))
    for character in characters:
        box = PANELS.get(character["slug"])
        if not box or not character.get("image"):
            continue
        source = Path("public" + character["image"])
        if source.stem.endswith("-panel"):
            continue
        target = IMAGES / f"{character['slug']}-panel.png"
        Image.open(source).convert("RGB").crop(box).save(target)
        character["image"] = f"/images/characters/{target.name}"
        print(f"{character['slug']} {box[2] - box[0]}x{box[3] - box[1]}")
    DATA.write_text(json.dumps(characters, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
