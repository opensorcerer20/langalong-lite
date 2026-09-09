# Roadmap

[← README](../README.md)

Two lists at two levels of finish. **Planned** is decided work that hasn't been built. **Todo** is working notes — ideas in the order they occurred, not commitments.

## Planned

- **PWA support.** The prototype was installable and worked fully offline; the React app is not and does not. The service worker and manifest were left behind in `prototype/` during the conversion rather than being ported, to be re-added once the component tree settled. Vite hashes built filenames, so the hand-maintained precache list needs replacing with a generated one. Progress is already in IndexedDB rather than `localStorage` partly for this: a service worker can read the former and not the latter, which is what a daily reminder needs.
- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Spaced repetition.** The groundwork is in: every sentence and situation carries a stable id, attempts are written to IndexedDB as an append-only log, and each reviewable thing has a rolled-up row carrying the fields a scheduler needs — see [ARCHITECTURE.md](ARCHITECTURE.md#where-progress-lives). What is missing is the scheduler itself and the review queue in front of it. Every row is stamped `schedulerVersion: 0`, so the first real scheduler can find them all and initialise them by replaying the log rather than starting a learner from nothing. Keeping the log is what makes the choice of algorithm reversible — SM-2, an Anki variant and FSRS are all fitted against review history, and only rolled-up state would have foreclosed on all three.
- **The streak.** Deliberately left out of the storage schema for now: a streak is a property of the days a learner studied, not of what they answered, so it needs a session row rather than a review row. The "Day 12" in `App.tsx` is still static chrome and still the app's most conspicuous piece of debt.
- **Progress on the home screen** — per-situation completion, best score and the three-star system below. Needs a scenario row, also left out for now; the ids it would key on already exist.
- **Notifications** and the daily reminder.
- **Audio** playback of prompts, and a kana keyboard fallback.
- **A second language.** The content is already isolated behind a `LanguagePack` and the app reads one active pack, so a new language is a folder plus a registry entry — see [AUTHORING.md](AUTHORING.md#adding-a-language). What is still missing is an in-app picker and a font subset per pack; progress is already stored per language, since the pack code is the first segment of every storage key. Grammar itself is the open question — the drill teaches word order and particles, which suits Japanese; a language whose difficulty sits in conjugation or agreement may want a different exercise rather than the same one with different tiles.

- **The exercise modes and the scenario flow.** Decided, and now under way: vocabulary, particle practice and verb conjugation as their own exercises, then chained per situation as vocabulary → conjugation → particles → sentence building with a success screen between each. Phase 0 of that work is done and is invisible — `appReducer` no longer knows what a sentence is, every attempt records which exercise and situation it came from, and every sentence is tagged with the particles and conjugation patterns it teaches. What remains is the exercises themselves, an entry point per mode on the home screen, and the flow that chains them. Jumping straight to one section stays possible by design rather than being replaced by the flow.
- **Cross-scenario review and targeted remediation.** Once several situations are complete: a review mix drawn from all of them, and a dismissible "you keep mixing up は and が" suggestion when the per-tag error rate says so consistently rather than sporadically. The tags Phase 0 added are what makes the second one a query instead of a guess.

## Todo

Rough notes. These no longer wait on per-item history — it is recorded now — but several still need a scheduler or a UI in front of it. The learning-sequence notes that used to sit here have moved up into Planned, since they are being built.

- Osusume wa nan desu ka?: add alts, and add the note "this is the more natural phrasing as opposed to 'nani ga osusume desu ka'".
- For answers with alternates, give a chance to get the best answer.
- Clicking a tile that was placed removes only that tile, and the next tile clicked goes in that spot.
- Star system:
  - one star: finished with zero incorrect
  - two stars: finished with zero misses
  - three stars: finished all sections with zero misses
- Highlight incorrect tile(s) after 2nd incorrect answer, accounting for alternate answers
- Increased difficulty options
  - 1) (my current preference) totally based on scenarios, thus the content of each dictates difficulty directly
  - 2) more complex sentences or exercise formulation in code
  - 3) utilize user right/wrong frequency to determine what is difficult for player

## What the current design assumes

Moved here from `docs/FLOW.md`, which was deleted — the rest of that file re-narrated code that reads clearly on its own, and pinned generated output (one situation's exact tile bank) in prose, so it went stale on every content change. This part is design reasoning that cannot be recovered by reading the code, and it is what the exercise modes above will run into first. Roughly in order of how much would have to move.

**One exercise, but the rules no longer assume it.** `appReducer` imports nothing: `check` carries a boolean verdict and `reveal` carries the positions to fill, so the miss ladder, the first-try score and advancing through a set are stated in terms of *attempts* and would drive a vocabulary or conjugation exercise unchanged. Missing is the exercise itself and any way to choose one — no field in `AppState` says which mode is running, and `App.tsx` has no branch for it. Recording already runs ahead of the UI: every attempt carries `mode` (always `'sentence'` so far) and `scenarioId`, so a second exercise slots into the existing history rather than starting one of its own.

**A tile is a fixed 2-tuple** — `[text, reading]` in `src/data/types.ts`. The shape hardcodes "written form plus one latin-script reading". A language needing no transliteration wastes the second field; one wanting gender, article or stress marks has nowhere to put it.

**Distractors come from exactly two pools** — the pack's shared `grammar` and the situation's vocabulary. Right for particle-and-conjugation confusion. A vocabulary drill would want distractors semantically near the answer, which is a different selection rule inside `buildBank` rather than a different pool.

**A note is one prose string**, shown at a fixed point in the ladder (and now optional). A conjugation drill probably wants structured data — stem, ending, rule — rather than a paragraph.

**Scoring in the drill is binary and per-set.** `firstTry` counts clean answers and is all `AppState` knows; the reducer has no memory beyond the current set. Per-item history exists beside the drill rather than inside it — `useTsumiki` writes every check and reveal to IndexedDB, keyed by sentence, tile and tagged grammar point, and `appReducer` is deliberately unaware of it. Nothing **adapts** from it: the order of a set is a fixed walk through an array, and no scheduler reads the rows.

**No per-token attribution.** `checkAnswer` judges whole joined strings, so a wrong answer cannot say which part was wrong — which is why a miss records nothing against tiles or tags at all. Only successes and reveals propagate down, and they propagate to everything the sentence touched. "Keeps getting を wrong" is a query; "got を wrong *in this sentence*" is not.

**Progress is linear.** `item` is an index that only moves forward through a fixed array. Jumping around, or a set that adapts its order, both need `item` to stop being a position in a list.

**The font subset is per-language and hand-maintained.** `noto-sans-jp-subset.woff2` covers only the glyphs the current sets use, and is regenerated by hand when vocabulary is added — see [AUTHORING.md](AUTHORING.md#new-japanese-glyphs). A second non-latin language means a second subset and the same manual step.
