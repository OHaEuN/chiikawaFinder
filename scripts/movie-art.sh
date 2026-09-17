#!/bin/bash
# 극장판 공식 사이트의 캐릭터 일러스트를 받아 이름표와 설명을 잘라낸다.
# 원본은 1080x1420 이고 위쪽 절반쯤이 그림, 아래는 이름표와 소개 글이다.
set -e
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"
BASE="https://chiikawa.toho-movie.jp/atm/img"
OUT="public/images/characters"
TMP=$(mktemp -d)

# slug:파일명
PAIRS="chiikawa:chii hachiware:hachi usagi:usagi momonga:momo kurimanju:kuri rakko:rakko shisa:shisa furuhonya:furuhon seiren:siren ningyo:mermaid shimajiro:shima"

for pair in $PAIRS; do
  slug="${pair%%:*}"
  name="${pair##*:}"
  curl -s -A "$UA" -o "$TMP/$name.webp" "$BASE/ch_$name.webp"
  # 그림 영역만 남긴다. 아래쪽 이름표와 설명 글을 잘라낸다.
  # 1420 높이 중 그림은 대략 y 120~800 이고 그 아래는 이름표와 설명이다.
  # cropOffset 은 음수가 위쪽이며, 앞에 공백을 둬야 옵션으로 읽히지 않는다.
  sips -s format png --cropToHeightWidth 680 860 --cropOffset " -100" 0 \
    "$TMP/$name.webp" --out "$TMP/$slug.png" > /dev/null
  cp "$TMP/$slug.png" "$OUT/movie-$slug.png"
  echo "$slug $(sips -g pixelWidth -g pixelHeight "$OUT/movie-$slug.png" | tail -2 | tr -d ' \n')"
done
rm -rf "$TMP"
