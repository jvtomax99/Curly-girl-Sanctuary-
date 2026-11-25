# SPEC: Curly Girl Sanctuary

*"Hey beautiful, Love the Curls."*

Draft, 2026-11-25, from Susan's "App Build Brief v2" (November 2026, 12
pages; the PDF is not in the repo). Lines marked TO FILL wait for Jose and
Susan. The brief calls its own quiz questions and several names
"proposed, owner to approve": nothing here is final until Jose says so.

## What it is and who it's for

A joyful, safe home for curly hair: take the quiz, get your Curly ID Card,
join the community, learn, and explore the Curl Lab.

- **Owner:** Susan. Jose builds it for her.
- **Real users:** curly girls (and boys) of every curl pattern, texture,
  shade and heritage, mostly on a phone. Minimum age: TO FILL (the brief
  asks for one; under 13 brings US children's privacy law, COPPA, so 13 is
  the usual floor, and 16 or 18 makes moderation simpler).
- **Who signs off:** TO FILL (Jose alone, or Susan for her words and looks).
- **Form:** a web app for now (Jose, 2026-11-25), phone first, with no
  server until a backend is picked before Phase 2. The brief says "mobile
  app" and mentions app store rules; an app-store version is a later
  decision.

## Principles (from the brief)

1. Joyful and welcoming. Bright, warm, retro with refined type. Every curl
   pattern and every heritage should see themselves in it.
2. Safe space first. Reporting, blocking and moderation are part of v1.
3. Privacy by choice. Heritage and anything personal are optional and
   controlled by the person.
4. Quick to start. The first quiz is 10 questions; the longer one lives in
   the Curl Lab and is optional.
5. Honest information. Health and vitamin content is educational, reviewed
   and sourced.

Heritage is central to the idea: it is part of the quiz, it shapes what
people can learn, and it is always optional to show. Curl results come from
the hair itself, never from heritage.

## How a person moves through the app

Intro video, end card ("Hey beautiful, Love the Curls"), quiz (10
questions), results (Curly ID Card). Then they choose:

- **Path A, Join the Sanctuary:** create account (5 fields), profile and
  Curl Kit, then Community, Learn, Curl Lab.
- **Path B, Just the quiz:** results with broad tips by hair type, and
  "Email my results" (optional). No account.

Bottom bar: Community, Learn, Curl Lab, Profile (the Profile tab is the
brief's suggestion). No Shop in v1.

## Features in v1, and when each is done

- **Opening.** Intro video slot (placeholder until Susan's script); it
  fades to black (about 1.5 s), black to Soft Coral Pink (about 2 s);
  "Hey beautiful," slides up and "Love the Curls" slides down, slowly
  (1.5 to 2 s), in white, serif with "Curls" in script; the words fade
  and only a centred "Start the quiz" stays. Small "Skip" on the video and
  "Already a member? Log in" (both suggested; Jose to confirm). Reduce
  motion: cross-fades instead of slides.
  Done when: a first visit plays the sequence with those timings and one
  tap on "Start the quiz" opens question 1 with no account; Skip reaches
  the button at any moment; with reduce motion on, nothing slides.
- **Quiz.** 10 questions, one per screen, progress bar, Back, answers
  saved as the person goes. Proposed questions (Susan to approve): 1 curl
  pattern (picture picker, 2A to 4C), 2 porosity (simple test explained,
  with "not sure"), 3 strand thickness (fine, medium, coarse), 4 density
  (how much scalp you can see), 5 heritage (multi-select with "Mixed",
  "Not sure yet", "Prefer not to say" plus Susan's list; an optional text
  box for traditions; "Show heritage on my profile" switch, off), 6 how
  often you wash, 7 scalp (oily, balanced, dry, not sure), 8 biggest
  struggle, 9 main goal, 10 traditions you are curious to learn from.
  Done when: all 10 answer on a 390 px phone, Back keeps answers, closing
  the app mid-quiz and reopening resumes at the same question, and heritage
  can be skipped.
- **Curly ID Card (results).** Hair type (2A to 4C), porosity (Low,
  Medium, High), thickness, density, scalp; heritage only if shared. Keeps
  the chunky retro lettering. Buttons: "Join the Sanctuary" and "No thanks,
  just the quiz".
  Done when: the card shows the person's answers, heritage appears only
  with the switch on, and the card can be shared as an image.
- **Quiz only.** Broad tips for the hair type (each tip sourced), "Email
  my results" at the very bottom. No account. The email is used only to
  send the results unless the person opts in to more.
  Done when: tips show for every type 2A to 4C, the email arrives with the
  card, and without the opt-in the address is not kept after sending.
- **Sign-up and log in.** First name, last name, email, curly username
  (unique), password, Join; guidelines accepted at sign-up; age check;
  email verification, password reset, log in, delete account.
  Done when: each of those works end to end with a made-up account, and
  deleting an account removes the person's profile, kit, posts and answers.
- **Profile.** Favorite curl pic (if skipped, the default curly avatar:
  petal-like curls, glossy eyes, a warm smile, in several skin tones),
  @curlyname, Curly ID Card with scalp type, heritage only if chosen, Edit
  profile, Share. Visibility per item: favorite curl pic, Curly ID Card,
  heritage, Curl Kit, scalp type; each Only me, Community or Everyone;
  heritage starts as Only me.
  Done when: each setting changes who can see that item, checked with a
  second made-up account and a logged-out visitor, and the server refuses
  the hidden item (not just the screen).
- **Curl Kit.** Go-to products typed in with suggestions (brand, name,
  type; "Add your own" when missing), tools from a list, how I dry (air
  dry, diffuse, both). Everything optional. Visible to others by default,
  shareable by link. A moderator tool merges duplicate products.
  Done when: typing "hyd" suggests matching products with member counts, a
  new product can be added, the kit opens from a shared link, and merging
  two duplicates moves every kit to the one product.
- **Hair Posts.** Photo posts tagged Best Day or Hot Mess, with comments
  and reactions.
  Done when: a post with a photo and tag appears in the feed, takes
  comments and reactions, and can be reported, hidden by block or mute,
  and removed by the owner.
- **Tutorials.** Members upload how-to videos tagged by curl pattern. May
  slip to v2 if video cost is high (open question).
  Done when: TO FILL after the cost decision.
- **Ask the Sanctuary.** Product reviews with the reviewer's curl profile
  attached automatically. Filters: curl pattern, product, heritage (only
  when the reviewer chose to show it). Supplements are not reviewable.
  Done when: filtering by 3B and a product shows only matching reviews,
  heritage never shows or filters for a reviewer who hid it, and a
  supplement can't be posted as a review.
- **Learn: Around the World.** Care traditions by country or region, curl
  textures, each place's popular curl products (names only). Starts with a
  few pages. Contributors credited by name.
  Done when: the first pages (how many: TO FILL) each list sources and a
  contributor.
- **Learn: Culturally ambiguous and mixed curls** (working name). Care
  suggestions by culture and texture, driven by the person's quiz results.
  Done when: TO FILL with the first content.
- **Learn: Holy Grail.** The red carpet: a coral pink carpet on Cream
  Light, velvet-rope posts, product cards arriving along it; "Loved across
  all patterns"; a Tools tab. Each card: photo, one line on why it works, a
  pattern badge. A tap opens the product page: why it works, how to use
  it, reviews by curl pattern from Ask the Sanctuary. Susan picks the
  list. Optional carpet roll-out animation, with reduce motion. No buy
  links.
  Done when: every product on Susan's list has a card and a page, and the
  Tools tab works.
- **Learn: Nutrition and Vitamins** (working name). Education only, a note
  at the top of the section and on every page, reviewed by a qualified
  person (dietitian, pharmacist or doctor) with sources listed, a Watch
  out box (safe upper limit, medicine interactions, pregnancy and nursing,
  lab-test interference such as biotin), evidence label (strong, some,
  limited). No dosing, no affiliate links, no suggestions from quiz
  results.
  Done when: every page has all of the above and a named reviewer's
  sign-off; pages without it stay off the live app.
- **Curl Lab (first modules).** The longer quiz in short modules of 2 to 3
  minutes: routine and goals, products you use, scalp (going deeper),
  lifestyle and budget. One question per screen, any question skippable,
  answers editable, retake any module. Finished modules add goal tags and
  badges to the profile; progress ("Your Curly ID is 60% complete") shows
  on the profile; a gentle nudge to refresh after a few months. The
  profile shows only the simple scalp type; deeper scalp answers stay
  private, and itching or hair loss point to a doctor.
  Done when: finishing a module shows the lab report and adds its tags to
  the profile, a retake replaces the answers, and deeper scalp answers are
  unreadable by anyone else (checked on the server).
- **Safety.** Report, block, mute, remove content; guidelines accepted at
  sign-up; moderation tools for the owner (a queue of reports, remove,
  warn, ban). App stores require this for user content.
  Done when: a report reaches the queue, the owner can act on it, and a
  blocked member's posts and comments disappear for the blocker.
- **Privacy.** Privacy policy and terms, health-related answers private by
  default, minimum age, delete account.
  Done when: both documents are linked at sign-up and in Profile, and a
  lawyer has reviewed the health-related answers (the brief asks for this
  before launch).

## Not in v1

- The Shop, buy links on Holy Grail or Learn, affiliate links.
- Notifications (v2, optional: replies and comments; wash-day reminders
  only if people want them, opt-in).
- Follows and a personalized feed, group spaces, premium tier, contributor
  tools for Learn (all v2).
- Direct messages.

## Later

- **Version 2:** more Curl Lab modules; follows and a personalized feed;
  optional notifications; group spaces by curl type or heritage; premium
  tier; contributor tools for Learn.
- **After that:** the Shop (by curl pattern, tools, a cruelty-free filter
  backed by a verifiable source); buy links; direct messages; stylist and
  salon directory; brand collaborations; product box or subscription,
  store tie-ins, live events.
- **Earning before the Shop** (the brief's ideas, owner decisions): the
  quiz as a simple web page that collects emails; affiliate links and
  codes in Instagram and TikTok bios; printable Curly ID Card, routine
  guide, Curl Kit checklist; paid consultations or workshops; print on
  demand. Every paid link labelled ("Affiliate link: we may earn a
  commission"), sponsored posts labelled, picks never changed for
  commission. Amazon Associates inside an app needs Amazon's approval
  first and must open links outside the app's own browser.

## Decisions waiting (Jose)

1. **Backend, before Phase 2.** Decided 2026-11-25: a web app for now,
   no server. Accounts with email verification, photo (and maybe video)
   uploads, per-item privacy, filters, moderation and delete-account all
   need a server and a database. Options to compare then, with prices
   checked on the day: Supabase (sign-in, database with per-row privacy
   rules, file storage; Claude's pick), Firebase (as in Interp), or a phone
   app for the app stores (Apple charges a yearly developer fee, Google a
   one-time one, and both review the app). Also: whether the host's free
   plan allows a business app.
   **"Email my results" needs an outside email service**, so with no
   server Phase 1 offers saving and sharing the Curly ID Card instead, and
   the email button waits for the backend (Jose to confirm in the Phase 1
   plan).
2. **Phase order** (below): the brief lists all of v1 at once; this spec
   proposes building it in phases, quiz first.
3. **Tutorials video in v1 or v2** (storage cost).
4. **Curl Lab: all four modules in v1, or the first ones.**
5. **Log in link and Skip on the opening** (both suggested).
6. **Names** for the mixed curls section and the vitamins section.
7. **Minimum age, who moderates reports, who signs off.**
8. **Asset budget** (`docs/assets.md`, section 1).

## Needed from Susan

- Final fonts (or approval of the matches), logo and app icon files.
- Original files of the store illustration and Curly ID Card (add 4A to
  4C, porosity Low, Medium, High, a Scalp row).
- Final 10 quiz questions and the heritage list.
- Intro video script and footage (later).
- Learn contributors, the first country or region pages, and a qualified
  reviewer for the vitamin pages.
- Holy Grail list (products and tools) with photos.
- A starter list of curl products (brand, name, type) as a spreadsheet,
  for Curl Kit suggestions.
- Default avatar artwork (petal curls, glossy eyes, warm smile) in several
  skin tones.
- Community guidelines, privacy policy and terms; minimum age; who
  moderates reports.
- App name and store listing text.

## Phases

Proposed order (Jose to approve). Each phase is a big feature: compare 2
or 3 similar apps, plan mode, his OK, then build.

| # | Phase | Status |
|---|---|---|
| 0 | Web app chosen (2026-11-25); DESIGN.md sample page approved in the Phase 1 plan | Started |
| 1 | Opening, quiz, Curly ID Card, quiz-only results with broad tips (no server; save and share the card; "Email my results" waits for the backend) | Not started |
| 2 | Backend picked; accounts, profile, visibility settings, Curl Kit, delete account, privacy policy and terms | Not started |
| 3 | Learn: Holy Grail, Around the World starter pages, mixed curls, vitamins (behind the reviewer) | Not started |
| 4 | Community with safety: Hair Posts, Ask the Sanctuary, report, block, mute, moderation queue (Tutorials if kept in v1) | Not started |
| 5 | Curl Lab first modules | Not started |
| 6 | Launch readiness: lawyer review of health answers, store listing, test group | Not started |

Why this order: Phase 1 works on its own and starts the email list the
brief suggests for launch; Learn gives people a reason to join before the
community has members; community comes once moderation can ship with it.
