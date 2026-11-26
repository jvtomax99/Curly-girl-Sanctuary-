#!/usr/bin/env bash
# Cuts the intro film (public/intro/intro.mp4) and its first picture (public/intro/gate.webp).
#   tools/make-intro-film.sh <folder with the source files>
# The source files are not in the repo (CREDITS.md says where they came from). The folder needs:
#   k1.png   the painting the film starts on (also the "Tap to start" picture)
#   v1.mp4 she smiles at the door and twirls a curl   v2.mp4 her curls bounce, close up
#   v3.mp4 friends laughing inside   v4.mp4 everyone together   music.mp3
# The cut: 15 s, 1080 by 1920, 30 frames a second, music only.
#   0.0  v1   3.0  v2   5.0  the app scene   9.4  v3   12.0  v4   15.0 end
# The app scene's picture is only the end of v2, held, blurred and slowly drawn closer: the app
# itself draws the curl picker and the Curly ID Card over it as real text
# (src/components/FilmApp.tsx). If a time here changes, change APP in src/components/Opening.tsx.
# The app fades the film to black itself when it ends, so the film holds its last picture.
set -euo pipefail
SRC="${1:?give the folder with the source files}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/intro"
mkdir -p "$OUT"
W=1080; H=1920
FIT="fps=30,scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,setsar=1,format=yuv420p"

# name, start in the source, length taken from the source, length in the film (seconds)
SHOTS=(
  "v1 ${V1:-0.2 3.2 3.0}"
  "v2 ${V2:-0.3 2.0 2.0}"
  "PLATE 0 0 4.4"
  "v3 ${V3:-1.2 2.6 2.6}"
  "v4 ${V4:-1.9 3.1 3.0}"
)
LEN=15
MUSIC_FROM="${MUSIC_FROM:-0}"

inputs=(); filter=""; labels=""; n=0
for row in "${SHOTS[@]}"; do
  read -r name ss len out <<<"$row"
  frames=$(awk "BEGIN{printf \"%d\", $out*30+0.5}")
  if [ "$name" = PLATE ]; then
    # the last picture of v2's part, blurred, a little brighter and warmer, drawn closer by 6%
    read -r _ pss plen _ <<<"${SHOTS[1]}"
    inputs+=(-ss "$(awk "BEGIN{print $pss+$plen-0.05}")" -t 0.04 -i "$SRC/v2.mp4")
    filter+="[$n:v]$FIT,gblur=sigma=26,eq=brightness=0.03:saturation=1.18,loop=loop=$frames:size=1:start=0,trim=end_frame=$frames,"
    filter+="scale=w='$W*(1+0.06*n/$frames)':h=-2:eval=frame,crop=$W:$H,setpts=N/30/TB,setsar=1[v$n];"
  else
    speed=$(awk "BEGIN{print $out/$len}")
    inputs+=(-ss "$ss" -t "$len" -i "$SRC/$name.mp4")
    filter+="[$n:v]setpts=(PTS-STARTPTS)*$speed,$FIT,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=$frames,setpts=PTS-STARTPTS[v$n];"
  fi
  labels+="[v$n]"; n=$((n+1))
done
filter+="${labels}concat=n=$n:v=1:a=0,trim=duration=$LEN,format=yuv420p[v];"
inputs+=(-i "$SRC/music.mp3")
filter+="[$n:a]atrim=start=$MUSIC_FROM,asetpts=PTS-STARTPTS,afade=t=in:d=0.12,loudnorm=I=-16:TP=-1.5,afade=t=out:st=$(awk "BEGIN{print $LEN-0.5}"):d=0.5,atrim=0:$LEN[a]"

ffmpeg -v error -y "${inputs[@]}" -filter_complex "$filter" -map "[v]" -map "[a]" \
  -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -preset slow -b:v "${VBITRATE:-3000k}" -maxrate 5500k -bufsize 11000k \
  -g 60 -c:a aac -b:a 128k -ar 44100 -movflags +faststart -t $LEN "$OUT/intro.mp4"

# The gate's picture: the painting the first shot was made from, so the tap brings it to life.
ffmpeg -v error -y -i "$SRC/k1.png" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libwebp -quality 86 "$OUT/gate.webp"
ls -l "$OUT"
