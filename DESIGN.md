# DESIGN: Curly Girl Sanctuary

From Susan's brief v2 (November 2026): colors sampled from her original
store illustration and Curly ID Card, fonts matched to her reference image.
Status: draft. `docs/design-rules.md` still asks for a template decision,
1 to 3 reference sites run through the taste skill, and a sample page Jose
approves before this is used everywhere. Keep every value in one place
(CSS variables or a theme file) once the stack exists.

## Colors

| Token | Name | Hex | Use |
|---|---|---|---|
| `--sunset-orange` | Sunset Orange | #E86326 | Brand primary: backgrounds, illustration, large headings |
| `--tangerine` | Tangerine | #F18B25 | Primary buttons (Cocoa text) |
| `--peach` | Peach | #F28551 | Soft backgrounds, header bands |
| `--coral-pink` | Coral Pink | #E44B52 | Accents, ID card |
| `--soft-coral` | Soft Coral Pink | #EE5D62 | The pink in the intro sequence |
| `--mustard` | Mustard | #E3A441 | Chips, highlights, Holy Grail |
| `--cream` | Cream | #F7D192 | Cards and the ID card face |
| `--teal` | Teal | #2AA08B | Illustration, floors, decoration |
| `--palm-green` | Palm Green | #466B4F | Leaves, dark banners |
| `--olive` | Olive | #969B60 | Leaf accents, borders |
| `--cream-light` | Cream Light (added) | #FFF3DD | Main screen background |
| `--cocoa` | Cocoa (added) | #5A2A1E | All body text and outlines |
| `--deep-teal` | Deep Teal (added) | #1B7A69 | Secondary buttons (white text) |
| `--white` | White | #FFFFFF | Text on Deep Teal and Soft Coral; answer cards |
| `--black` | Black | #000000 | Only the opening's fade to black |
| `--cocoa-line` | Cocoa at 18% | rgba(90, 42, 30, 0.18) | Thin rules between Curly ID Card rows |

## Text and background pairs

Only the "all text" pairs carry body text. Ratios are from the brief;
re-measure any new pair before using it.

| Text on background | Ratio | Allowed |
|---|---|---|
| Cocoa on Cream Light | 10.7:1 | All text (body) |
| Cocoa on Tangerine | 4.7:1 | All text (primary button) |
| Cocoa on Mustard | 5.4:1 | All text (chips, Holy Grail) |
| White on Deep Teal | 5.2:1 | All text (secondary button) |
| Cream Light on Palm Green | 5.5:1 | All text (dark banners) |
| Cocoa on White | 11.8:1 | All text (answer cards; measured 2026-11-25) |
| Cocoa on Cream | 8.1:1 | All text (picked answers, the ID card; measured 2026-11-25) |
| Cocoa on Peach | 4.6:1 | All text (the video placeholder; measured 2026-11-25) |
| White on Soft Coral | 3.3:1 | Large or bold only (intro sequence) |
| Cocoa on Sunset Orange | 3.5:1 | Large or bold only (headers on orange) |
| Sunset Orange on Cream Light | 3.1:1 | Large or bold only (decoration, not text) |

## Fonts

All three suggestions are Google Fonts (Open Font License), so they can be
bundled as WOFF2 in the public repo. Final pick: TO FILL (Susan approves
the matches; fonts in AI-made images may not be real fonts).

- **Opening serif** ("Hey beautiful," and "Love the"): Playfair Display or
  Bodoni Moda.
- **Script** ("Curls" only): Yellowtail, Satisfy or Kaushan Script.
- **App sans** (everything else): Montserrat or Josefin Sans.
- Normal letter case and spacing for body text; wide-spaced capitals for
  small labels and headings.

## Shapes and look

- Flat, rounded shapes, thin Cocoa outlines, leaf borders.
- The Curly ID Card keeps its chunky retro lettering: a Coral Pink and
  Tangerine diagonal block with "Curly ID Card" in Mustard letters outlined
  and shadowed in Cocoa (decoration, large and bold only; the outline
  carries the contrast), the rows on Cream. The shared picture
  (`src/cardImage.ts`) repeats these colors as hex codes, because a canvas
  can't read CSS variables: change both together.
- Cream Light for reading screens; bright orange, pink and teal for
  headers, the splash and illustration, so hair photos stay the stars.
- Photos show real curls in every texture and shade.
- Pills for chips and filters (selected: Mustard or Cream fill with a
  Sunset Orange outline); cards on Cream Light with an Olive or Cocoa
  outline; primary buttons Tangerine with Cocoa text, secondary Deep Teal
  with white text.
- Bottom bar: Community, Learn, Curl Lab, Profile; the current tab's dot in
  Sunset Orange.

## Motion

Playful and short, always with a reduce-motion version (cross-fades
instead of slides). Opening timings: fade to black about 1.5 s, black to
Soft Coral Pink about 2 s, the two lines slide in over 1.5 to 2 s at the
same time. Holy Grail's carpet roll-out is optional.

## Sizes (Phase 1, `src/styles.css`)

- Corners: 16 px cards (`--radius`), 14 px answer cards, pills 999 px.
- Outline: 1.5 px Cocoa (`--line`); a picked answer gets 3 px Sunset
  Orange on Cream (or Mustard for chips).
- Tap targets: 48 px buttons (`--tap`), never under 44 px.
- Type: body 17 px; question titles 24 px, 800 weight; labels 13 px caps
  with 0.14em spacing; inputs 16 px.
- The Curly ID Card has a 6 px Cocoa drop shadow (flat, no blur).
- Wider than a phone: the app stays a 480 px column.

## Still to add

A spacing scale as tokens, and the parts later phases need (bottom bar,
forms, feed cards).
