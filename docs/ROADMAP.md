# Roadmap

[← README](../README.md)

Three lists. **Planned** is work that could start as things stand. **Needs progress tracking again** is work that cannot, because the storage layer it assumed was removed in the 2026-09 scope reduction — see [CHANGELOG.md](CHANGELOG.md). **Todo** is working notes: ideas in the order they occurred, not commitments.

> **The scope of this app is one person practising Japanese on one phone.** Weigh anything below against that before starting it.

## Definite planned changes

- Fix issues found testing on phone
  - romaji hard to read, maybe make bold
  - need to keep check button / hint / etc at bottom of screen
- Osusume wa nan desu ka?: add alts, and add the note "this is the more natural phrasing as opposed to 'nani ga osusume desu ka'".
- For answers with alternates, give a chance to get the best answer.
- Clicking a tile that was placed removes only that tile, and the next tile clicked goes in that spot.
- Highlight incorrect tile(s) after 2nd incorrect answer, accounting for alternate answers

## Features not yet planned

- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Audio** playback of prompts, and a kana keyboard fallback.
- **A second language.** The content is already isolated behind a `LanguagePack` and the app reads one active pack, so a new language is a folder plus a registry entry — see [AUTHORING.md](AUTHORING.md#adding-a-language). What is missing is an in-app picker and a font subset per pack. Grammar itself is the open question: the drill teaches word order and particles, which suits Japanese; a language whose difficulty sits in conjugation or agreement may want a different exercise rather than the same one with different tiles.
- **The exercise modes.** Vocabulary, particle practice and verb conjugation as their own exercises, optionally chained per situation. Two things survive from the groundwork: `appReducer` states its rules in terms of attempts rather than sentences, and every sentence still carries the `teaches` tags an exercise would select on. Everything else — the exercises, an entry point per mode, the flow between them — is unbuilt.
- Star system:
  - one star: finished with zero incorrect
  - two stars: finished with zero misses
  - three stars: finished all sections with zero misses
- Increased difficulty options
  - 1) (my current preference) totally based on scenarios, thus the content of each dictates difficulty directly
  - 2) more complex sentences or exercise formulation in code
  - 3) utilize user right/wrong frequency to determine what is difficult for player


## Needs progress tracking again

Each of these wants a record of what the learner has done, which the app no longer keeps. Reinstating it means a storage layer again, sized to whatever is actually being shown rather than to a scheduler.

- **Spaced repetition.** A scheduler and a review queue. The previous groundwork — an append-only attempt log, rolled-up rows, `schedulerVersion` sentinels — is gone, but the reasoning survives: an algorithm choice stays reversible only if raw review history is kept, since SM-2, Anki variants and FSRS are all fitted against it.
- **The streak.** A property of the days studied, not of what was answered, so it needs its own record rather than a review row. Nothing is shown in the meantime; a hardcoded `Day 12` in the header was removed for asserting something false.
- **Progress on the home screen** — per-situation completion, best score and the three-star system below.
- **Notifications** and the daily reminder. The service worker makes this reachable with no page open, but it needs something to read.
- **Cross-scenario review and targeted remediation** — a review mix drawn from several situations, and a dismissible "you keep mixing up は and が" when the per-tag error rate says so consistently. The `teaches` tags make the second a query rather than a guess, once errors are recorded.

## What the current design assumes

Design reasoning that cannot be recovered by reading the code, and what the work above would run into first. Roughly in order of how much would have to move.

**One exercise, but the rules no longer assume it.** `appReducer` imports nothing: `check` carries a boolean verdict and `reveal` carries the positions to fill, so the miss ladder, the first-try score and advancing through a set are stated in terms of *attempts* and would drive a vocabulary or conjugation exercise unchanged. Missing is the exercise itself and any way to choose one — no field in `AppState` says which mode is running, and `App.tsx` has no branch for it.

**A tile is a fixed 2-tuple** — `[text, reading]` in `src/data/types.ts`. The shape hardcodes "written form plus one latin-script reading". A language needing no transliteration wastes the second field; one wanting gender, article or stress marks has nowhere to put it.

**Distractors come from exactly two pools** — the pack's shared `grammar` and the situation's vocabulary. Right for particle-and-conjugation confusion. A vocabulary drill would want distractors semantically near the answer, which is a different selection rule inside `buildBank` rather than a different pool.

**A note is one prose string**, shown at a fixed point in the ladder (and now optional). A conjugation drill probably wants structured data — stem, ending, rule — rather than a paragraph.

**Scoring is binary, per-set and forgotten on reload.** `firstTry` counts clean answers and is all `AppState` knows; the reducer has no memory beyond the current set, and nothing outside it keeps one. The order of a set is a fixed walk through an array, so nothing adapts.

**No per-token attribution.** `checkAnswer` judges whole joined strings, so a wrong answer cannot say which part was wrong. Anything wanting "keeps getting を wrong" needs the checker to attribute a miss to a tile first, which it cannot do today.

**Progress is linear.** `item` is an index that only moves forward through a fixed array. Jumping around, or a set that adapts its order, both need `item` to stop being a position in a list.

**The font subset is per-language and hand-maintained.** `noto-sans-jp-subset.woff2` covers only the glyphs the current sets use, and is regenerated by hand when vocabulary is added — see [AUTHORING.md](AUTHORING.md#new-japanese-glyphs). A second non-latin language means a second subset and the same manual step.
