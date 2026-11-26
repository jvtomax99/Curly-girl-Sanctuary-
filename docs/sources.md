# Sources

Every hair-care or health claim in the app (Learn, the quiz's
explanations, quiz-only tips, the Curl Lab) cites a source id from this
list. No source, no claim. Prefer primary sources: peer-reviewed papers,
dermatology and trichology bodies, government health agencies (for
vitamins, for example the NIH Office of Dietary Supplements fact sheets).
A brand's marketing is not a source for a health claim. The app's copy of
this list is `src/data/sources.ts`: change both together.

| Id | Source | Link | Checked | Used for |
|---|---|---|---|---|
| S1 | "An Overview on Hair Porosity", Dr. Amber Evans, New York Society of Cosmetic Chemists (blog with references, 2020) | https://www.nyscc.org/blog/an-overview-on-hair-porosity/ | 2026-11-25 | Quiz question 2: what porosity is, low and high signs ("takes a significant amount of time to wet and dry", "absorbs water and dries quickly"); home tests "have limitations but can potentially give a general idea"; the spray check ("High porosity hair should adsorb the water more quickly than lower porosity hair, which would instead have visible beads of water and a longer dry time"), checked 2026-11-26 |
| S2 | "Hair porosity tests are a lie", Michelle Wong (PhD chemist), Lab Muffin Beauty Science, 2026 | https://labmuffin.com/hair-porosity-tests-are-a-lie/ | 2026-11-25 | Quiz question 2: why home tests are only a rough guide ("These tests actually check for damage to the surface of hair") |
| S3 | "6 curly hair care tips from dermatologists", American Academy of Dermatology | https://www.aad.org/public/everyday-care/hair-scalp-care/hair/curly-hair-care | 2026-11-25 | Curly and coily tips: wash only when needed, condition all your hair, detangle wet, pineapple or loose braid for sleep |
| S4 | "10 hair care habits that can damage your hair", American Academy of Dermatology | https://www.aad.org/public/everyday-care/hair-scalp-care/hair/habits-that-damage-hair | 2026-11-25 | Comb textured hair damp with a wide-tooth comb; conditioner after every shampoo; towel wrap; lowest heat setting |
| S5 | "Hairstyles that pull can lead to hair loss", American Academy of Dermatology | https://www.aad.org/public/diseases/hair-loss/causes/hairstyles | 2026-11-25 | Loosen tight styles; see a dermatologist for hair loss |
| S6 | "How to treat dandruff", American Academy of Dermatology | https://www.aad.org/public/diseases/hair-and-scalp-problems/dandruff-how-to-treat | 2026-11-25 | See a dermatologist for flaking that doesn't go away |

## Gaps

- No source found that gives tips for wavy (type 2) hair on its own; wavy
  results get the all-hair tips (S4, S5) until one is found.
- No controlled study of the home float test was found (2026-11-25); the
  quiz does not teach it. Question 2 teaches the spray check instead (S1),
  marked as a rough idea only (S1, S2).
