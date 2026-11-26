#!/usr/bin/env bash
# Cuts the intro film (public/intro/intro.mp4) and its first picture (public/intro/gate.webp).
#   tools/make-intro-film.sh <folder with the source files>
# The source files are not in the repo (CREDITS.md says where they came from). The folder needs:
#   k1.png   the still the film starts on (also the "Tap to start" picture)
#   v1.mp4 the morning mirror   v2.mp4 a curl escapes at the office   v3.mp4 evening, hair down, her phone
#   v4.mp4 wash day   v5.mp4 she walks into work with her curls out   music.mp3
# The cut: 14 s, 720 by 1280, 30 frames a second, music only. The app fades it to black
# itself when it ends (src/components/Opening.tsx), so the film holds its last picture.
set -euo pipefail
SRC="${1:?give the folder with the source files}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/intro"
mkdir -p "$OUT"
FIT="fps=30,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p"

# name, start in the source, length taken from the source, length in the film (seconds)
SHOTS=(
  "v1 ${V1:-0.2 3.2 3.0}"
  "v2 ${V2:-0.2 3.0 2.6}"
  "v3 ${V3:-1.0 2.6 2.4}"
  "v4 ${V4:-2.2 2.8 2.6}"
  "v5 ${V5:-0.0 3.4 3.4}"
)
LEN=14
MUSIC_FROM="${MUSIC_FROM:-0}"

inputs=(); filter=""; labels=""; n=0
for row in "${SHOTS[@]}"; do
  read -r name ss len out <<<"$row"
  frames=$(awk "BEGIN{printf \"%d\", $out*30+0.5}")
  speed=$(awk "BEGIN{print $out/$len}")
  inputs+=(-ss "$ss" -t "$len" -i "$SRC/$name.mp4")
  filter+="[$n:v]setpts=(PTS-STARTPTS)*$speed,$FIT,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=$frames,setpts=PTS-STARTPTS[v$n];"
  labels+="[v$n]"; n=$((n+1))
done
filter+="${labels}concat=n=$n:v=1:a=0,trim=duration=$LEN,format=yuv420p[v];"
inputs+=(-i "$SRC/music.mp3")
filter+="[$n:a]atrim=start=$MUSIC_FROM,asetpts=PTS-STARTPTS,afade=t=in:d=0.12,loudnorm=I=-16:TP=-1.5,afade=t=out:st=$(awk "BEGIN{print $LEN-0.5}"):d=0.5,atrim=0:$LEN[a]"

ffmpeg -v error -y "${inputs[@]}" -filter_complex "$filter" -map "[v]" -map "[a]" \
  -c:v libx264 -profile:v high -level 3.1 -pix_fmt yuv420p -preset slow -b:v "${VBITRATE:-1700k}" -maxrate 2800k -bufsize 5600k \
  -g 60 -c:a aac -b:a 128k -ar 44100 -movflags +faststart -t $LEN "$OUT/intro.mp4"

# The gate's picture: the still the first shot was made from, so the tap brings it to life.
ffmpeg -v error -y -i "$SRC/k1.png" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libwebp -quality 82 "$OUT/gate.webp"
ls -l "$OUT"
