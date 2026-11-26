#!/usr/bin/env bash
# Cuts the intro film (public/intro/intro.mp4) and its first picture (public/intro/gate.webp).
#   tools/make-intro-film.sh <folder with the source files>
# The source files are not in the repo (CREDITS.md says where they came from). The folder needs:
#   k1-door.png   the painted still the film starts on (also the "Tap to start" picture)
#   v1.mp4 she waves   v2.mp4 her curls bounce   v3.mp4 she opens the door
#   v4.mp4 friends inside   v5.mp4 everyone together   music.mp3
# The cut: 12.2 s, 720 by 1280, 30 frames a second, music only. The app fades it to black
# itself when it ends (src/components/Opening.tsx), so the film holds its last picture.
set -euo pipefail
SRC="${1:?give the folder with the source files}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/intro"
mkdir -p "$OUT"
FIT="fps=30,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p"

# name, start in the source, length taken from the source, length in the film (seconds)
SHOTS=(
  "v1 ${V1:-0.0 2.7 2.6}"
  "v2 ${V2:-0.5 1.5 1.2}"
  "v3 ${V3:-0.5 4.5 3.2}"
  "v4 ${V4:-0.6 2.4 2.2}"
  "v5 ${V5:-0.5 3.2 3.0}"
)
LEN=12.2
MUSIC_FROM="${MUSIC_FROM:-1.9}"   # the track's quiet first two seconds are left out

inputs=(); filter=""; labels=""; n=0
for row in "${SHOTS[@]}"; do
  read -r name ss len out <<<"$row"
  frames=$(awk "BEGIN{printf \"%d\", $out*30+0.5}")
  speed=$(awk "BEGIN{print $out/$len}")
  inputs+=(-ss "$ss" -t "$len" -i "$SRC/$name.mp4")
  filter+="[$n:v]setpts=(PTS-STARTPTS)*$speed,$FIT,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=$frames,setpts=PTS-STARTPTS[v$n];"
  labels+="[v$n]"; n=$((n+1))
done
# join; a short cream bloom carries the step through the door (the cut from v3 to v4)
DOOR=$(awk 'BEGIN{t=0} {t+=$1} END{print t}' <<<"$(for r in "${SHOTS[@]:0:3}"; do read -r _ _ _ o <<<"$r"; echo "$o"; done)")
filter+="${labels}concat=n=$n:v=1:a=0,trim=duration=$LEN[j];"
filter+="color=0xFFF3DD:s=720x1280:r=30:d=$LEN,format=rgba,fade=t=in:st=$(awk "BEGIN{print $DOOR-0.3}"):d=0.3:alpha=1,fade=t=out:st=$DOOR:d=0.35:alpha=1[w];"
filter+="[j][w]overlay=enable='between(t,$(awk "BEGIN{print $DOOR-0.3}"),$(awk "BEGIN{print $DOOR+0.35}"))',format=yuv420p[v];"
inputs+=(-i "$SRC/music.mp3")
filter+="[$n:a]atrim=start=$MUSIC_FROM,asetpts=PTS-STARTPTS,afade=t=in:d=0.12,loudnorm=I=-16:TP=-1.5,afade=t=out:st=$(awk "BEGIN{print $LEN-0.5}"):d=0.5,atrim=0:$LEN[a]"

ffmpeg -v error -y "${inputs[@]}" -filter_complex "$filter" -map "[v]" -map "[a]" \
  -c:v libx264 -profile:v high -level 3.1 -pix_fmt yuv420p -preset slow -b:v "${VBITRATE:-1700k}" -maxrate 2800k -bufsize 5600k \
  -g 60 -c:a aac -b:a 128k -ar 44100 -movflags +faststart -t $LEN "$OUT/intro.mp4"

# The gate's picture: the still the first shot was made from, so the tap brings it to life.
ffmpeg -v error -y -i "$SRC/k1-door.png" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libwebp -quality 82 "$OUT/gate.webp"
ls -l "$OUT"
