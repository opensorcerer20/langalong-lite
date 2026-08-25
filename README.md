# Tsumiki

A Japanese sentence-building app for English-speaking learners. An English prompt is shown; you assemble the Japanese sentence from a bank of tiles. The tile bank is deliberately oversupplied — roughly 3x the tiles needed, minimum 12 — so a correct sentence cannot be brute-forced by elimination.

18 sentences across two situations: **Bakery** (10) and **Train station** (8).

React and TypeScript, built with Vite. The app is organised so each piece can be read on its own: the Japanese content is inert data that imports nothing, the drill rules are pure functions that import no content, and the components are presentational — one file each, styles included.

## Running it

```
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | The full suite once |
| `npm run test:watch` | The suite in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Typecheck, then a production build into `dist/` |
| `npm run preview` | Serve the production build |

`dist/` is a folder of static files and deploys to any static host.

### The original prototype

`prototype/` holds the pre-React app — one `app.js`, one `index.html` with all the CSS in a `<style>` block, and no build step. It is kept for side-by-side comparison and is not part of the build. To run it, serve the repository root and open `/prototype/`:

```
python3 -m http.server 8000
```

It shares `fonts/`, `icons/` and `_ds/` with the React app, so it must be served from the repository root rather than from inside `prototype/`.

## Gameplay Overview

- Tap bank tiles to place them; tap a placed tile to send it back.
- **Check** validates the built string against the item's canonical answer plus its accepted alternates.
- **First miss** — silent retry: the answer line clears and a short status line appears, with no explanation.
- **Second miss** — the grammar note appears, explaining the particle or form at issue.
- **Third miss** — a "Show me the answer" button appears. Using it fills and locks the answer line, and forfeits the first-try credit.
- **Correct** — the status reads "Correct" and the same note is relabelled "Additional grammar tips".

The score on the set-complete screen is sentences built on the first try.

## The flow in detail, screen by screen

A full walkthrough of Set 01 — Bakery, naming the state field and the action behind everything on screen, so the flow can be traced without reading the code. Written to support deciding what a second language or a second drill mode would have to change; the last part collects the assumptions that are currently baked in.

Everything below is one scenario, one mode. Nowhere in the app is there a concept of "which mode am I in" — the translate drill is not a mode, it is the only thing the app does.

### The state behind every screen

All of it lives in one object in `src/state/appReducer.ts`, and the whole app is a function of it:

| Field | Type | What it means |
| --- | --- | --- |
| `screen` | `'home' \| 'drill'` | Which screen. The set-complete screen is not a third value — see `finished` |
| `scenario` | number | Index into `SCENARIOS`. Bakery is `0` |
| `item` | number | Index of the current sentence within that set, `0`–`9` for Bakery |
| `placed` | `number[]` | Positions in the tile bank the learner has tapped, in tap order |
| `misses` | number | Failed checks on the current sentence. Resets per sentence |
| `status` | `'idle' \| 'wrong' \| 'right' \| 'shown'` | How the last check went |
| `firstTry` | number | Sentences answered correctly with no prior miss. The score |
| `finished` | boolean | The set is over; show the set-complete screen instead of the drill |

`src/state/useTsumiki.ts` derives everything else from those eight fields — it never stores anything of its own:

| Derived | How | Used for |
| --- | --- | --- |
| `scenario`, `item` | Look up `SCENARIOS[scenario].items[item]` | The content on screen |
| `bank` | `buildBank(item, index, pools, TILE_MULTIPLIER)`, memoised per sentence | The tiles to choose from |
| `done` | `status` is `right` or `shown` | Locks the answer line; flips the primary button's job |
| `isLastItem` | `item === total - 1` | "Finish set" instead of "Next sentence" |
| `showNote` | `misses >= NOTE_AFTER_MISSES \|\| done` | Whether the grammar note is on screen |
| `showReveal` | `misses >= REVEAL_AFTER_MISSES && !done` | Whether "Show me the answer" is offered |
| `progress` | `(finished ? total : item) / total` | The rule under the header |

### Screen 1 — Home

Reached at launch, and by "← All" or "Choose another situation" from anywhere.

The header reads `Japanese · beginner` with a `Day 12` streak, and shows no back link — `App.tsx` passes `onBack` only while `screen === 'drill'`. The progress rule is forced to empty here regardless of drill state.

Below that, a band reading "Choose a situation" over "Build sentences you will actually need.", then one full-width row per entry in `SCENARIOS`. The Bakery row is built entirely from that scenario's own fields: `kicker` → `Set 01`, `items.length` → `10 sentences`, `name` → `Bakery`, `blurb` → "Asking for items, counting them, paying at the counter." A foot note explains that only the translate level exists so far.

**The one action.** Tapping the row dispatches `openScenario(0)`. That is a *full reset*, not a resume: the reducer returns `initialState` with `screen: 'drill'` and `scenario: 0`, so `item`, `misses`, `placed` and `firstTry` all go back to zero. Leaving a set halfway and re-entering it starts it again from sentence 1 with a zero score. There is no saved position anywhere — see the Cleanup section.

### Screen 2 — Drill

The header becomes `Bakery · 01` with a `← All` back link. The progress rule fills to `item / 10`, so it is empty on the first sentence, not one-tenth full.

**The prompt.** `Say this in Japanese — item 1 of 10` over the English sentence — for item 0, "One bread, please." The counter is one-based on screen, zero-based in state.

**The tile bank.** Generated once per sentence and memoised, so it is stable while the learner works. For Bakery item 0 the answer is 3 tiles, `TILE_MULTIPLIER` is 3, and the floor is 12 — so `max(12, ceil(3 × 3))` gives 12 tiles:

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tile | お願いします | パン | ている | 二つ | あります | 現金 | ください | 袋 | を | で | は | の |

Four of those are load-bearing. `パン` (1), `を` (8) and `ください` (6) spell the canonical answer. `お願いします` (0) is there because the item lists `パンをお願いします` as an accepted alternate — the generator segments each alternate and seeds any tile the canonical answer does not already supply, so every accepted answer is always physically buildable. The remaining eight are distractors drawn from the shared grammar pool (`ている`, `あります`, `で`, `は`, `の`) and Bakery's own vocabulary (`二つ`, `現金`, `袋`), which is what keeps a wrong tile plausible inside the scene rather than obviously foreign to it.

The order is deterministic, not random — arithmetic on the sentence's index — so the same sentence always presents the same bank in the same order.

**Placing a tile.** Tapping bank index 1 dispatches `tap(1)`, which appends `1` to `placed` and sets `status` back to `idle`, clearing any "not quite" message. The tile stays in the bank but turns invisible — hidden, not removed, so the remaining tiles never reflow under the learner's finger. `tap` is ignored if the tile is already placed, or once `done`.

**Removing a tile.** Tapping a tile on the answer line dispatches `untap(position)` — the position on the line, not the bank index, because the same tile can legitimately appear twice in one sentence. Also ignored once `done`.

**The answer line** shows the placed tiles followed by one short rule per tile still missing, so `ans.length` is visible as a shape before anything is typed. With nothing placed, item 0 shows three empty rules.

**Checking.** The primary button reads `Check` and is disabled while `placed` is empty. Tapping it dispatches `check`, which joins the placed tiles into one string and compares it against the canonical answer plus every alternate. Comparison is on the joined string, not on tiles — which is exactly what lets `パンをお願いします` be accepted even though it is built from a different set of tiles than `パンをください`.

**The miss ladder**, walked concretely on item 0:

| Misses | What happens | Driven by |
| --- | --- | --- |
| 0 | Nothing on screen yet | `status: 'idle'` |
| 1 | Answer line clears. Status reads "Not quite. Try again." No explanation | `status: 'wrong'`, `misses: 1` |
| 2 | Status becomes "Not yet — read the note", and the grammar note appears below, labelled **Grammar**: "を marks the direct object — the thing you are asking for. は would make it the topic…" | `showNote` — `misses >= NOTE_AFTER_MISSES` |
| 3 | A secondary "Show me the answer" button appears above the primary | `showReveal` — `misses >= REVEAL_AFTER_MISSES` |

Every wrong check clears `placed` entirely. The learner rebuilds rather than edits — a deliberate choice, not a side effect.

**Revealing.** `reveal` fills the answer line with the bank positions that spell the canonical answer — `[1, 8, 6]` for item 0 — and sets `status: 'shown'`. The line locks, the reveal button disappears, the note relabels to **Additional grammar tips**, and the status reads "Answer shown". It does not count as a miss, and it earns no score: `firstTry` is only ever incremented inside `check`, and only when `misses === 0`.

**Answering correctly.** `status: 'right'`, the status line reads "Correct", the note appears (or stays) labelled **Additional grammar tips**, and the answer line locks. `firstTry` increments only if this was a clean first attempt.

**Advancing.** Once `done`, the same primary button changes job — it now reads `Next sentence` and dispatches `next` instead of `check`. `next` clears `placed`, `misses` and `status` and increments `item`. On the last sentence the label is `Finish set` instead, and `next` sets `finished: true` while leaving `item` where it is.

### Screen 3 — Set complete

Not a third `screen` value: it is `screen === 'drill'` with `finished === true`, which is why the header still reads `Bakery · 01` and the back link still works. The progress rule reads 100%, because `progress` substitutes `total` for `item` once `finished`.

The screen shows `7 / 10` in large accent type over "built first try" — `firstTry` out of `items.length`. The wording matters: it is not sentences answered. A sentence missed once and then solved, or revealed, counts for nothing here.

Two actions. **Practise this set again** dispatches `restart`, which returns to `item: 0` and zeroes `firstTry` and `finished` while staying in the same scenario. **Choose another situation** dispatches `goHome`, which only changes `screen` — the drill state is left intact, though it never matters, because `openScenario` resets everything on the way back in.

### Every action in one table

| Action | Dispatched from | Effect | Ignored when |
| --- | --- | --- | --- |
| `openScenario(n)` | Home — scenario row | Full reset into scenario `n`, sentence 1, score 0 | never |
| `goHome()` | Header "← All"; done screen | `screen: 'home'`. Drill state untouched | never |
| `tap(bankIndex)` | Drill — bank tile | Appends to `placed`; clears `wrong` status | `done`, or already placed |
| `untap(position)` | Drill — placed tile | Removes that position from `placed` | `done` |
| `check()` | Drill — primary button | Right: `status: 'right'`, `firstTry++` if `misses === 0`. Wrong: `misses++`, `placed` cleared | `done`, or `placed` empty |
| `reveal()` | Drill — "Show me the answer" | Fills and locks the line, `status: 'shown'`. No score, no miss | `done` |
| `next()` | Drill — primary button once `done` | Clears the per-sentence fields; `item++`, or `finished: true` on the last | never |
| `restart()` | Done — "Practise this set again" | Back to sentence 1, score 0, same scenario | never |

### What this flow assumes

The parts that are Japanese-specific or single-mode, and would need attention before adding a language or a drill type. Roughly in order of how much would have to move.

**There is no mode dimension at all.** No field in `AppState`, no field on `Scenario`, no branch in `App.tsx`. Adding vocabulary recall or verb conjugation means introducing that concept from scratch — most naturally as a property of a scenario or of an item, with `DrillScreen` choosing a body from it. What is reusable regardless: `appReducer`'s miss ladder, scoring and advancing are about *attempts*, not about sentences, so a different drill body could sit on the same rules unchanged.

**There is no language dimension either.** `SCENARIOS` is a flat list of situations, and `Japanese · beginner` is a string literal in `App.tsx`. A second language needs a level above `SCENARIOS`, and every current import of it becomes a lookup.

**A tile is a fixed 2-tuple**, `[kana, romaji]` in `src/data/types.ts`. That hardcodes "script plus transliteration". A language needing no transliteration wastes the field; one wanting gender, article or stress marks has nowhere to put it.

**Answers are joined with no separator.** `buildString` concatenates tiles directly, which is right for Japanese and wrong for any language written with spaces — `パンをください` works, `dos cruasanes por favor` would come out as `doscruasanesporfavor`. The joiner would have to become a property of the language.

**Segmentation assumes no word delimiters.** `segmentLongestFirst` exists because alternates are written as unbroken strings and have to be matched longest-first against the vocabulary. In a spaced language the same job is a split on whitespace, and the longest-first subtlety disappears.

**Distractors come from exactly two pools** — the shared grammar list and the scenario's own words. That is the right shape for particle-and-conjugation confusion. A vocabulary drill would more likely want distractors that are semantically near the answer, which is a different selection rule inside `buildBank` rather than a different pool.

**A note is one prose string**, shown at a fixed point in the ladder. A conjugation drill probably wants structured data — stem, ending, rule — rather than a paragraph.

**Scoring is binary and per-set.** `firstTry` counts clean answers; nothing records which particle a learner keeps getting wrong, so nothing can adapt. The starred-progress and review ideas in the todo list all need per-item history, which does not exist yet.

**Progress is linear.** `item` is an index that only moves forward through a fixed array. Jumping around, or a set that adapts its order, both need `item` to stop being a position in a list.

**The Japanese font is hardcoded in a component.** `Tile.tsx` names `'Noto Sans JP'` in its stylesheet, and the vendored subset covers only the 102 glyphs the two current sets use. Both are per-language facts sitting inside a generic component.

## How the code is arranged

The one rule that shapes everything: **dependencies point one way, and language data is never imported by logic.**

```
components/  ──►  state/useTsumiki  ──►  state/appReducer  ──►  lib/       (pure, data-free)
                        │
                        └────────────►  data/                              (inert, logic-free)
```

- **`src/data/`** is the Japanese. Content and types, no functions. Nothing here imports anything but its own types.
- **`src/lib/`** is the processing: bank generation, segmentation, answer checking, reveal placement. Pure functions that take the content they need as arguments and never import `data/`.
- **`src/state/appReducer.ts`** is every drill rule, as one pure reducer. It does not import content either — the `check` and `reveal` actions carry the item and bank in the action itself.
- **`src/state/useTsumiki.ts`** is the single seam where content, state and logic meet. It resolves the current scenario, item and tile bank and applies the config dials.
- **`src/components/`** are presentational: props in, callbacks out. Only `App` calls the hook. One file per component, with its styles in it.

### Styling

Styles are [StyleX](https://stylexjs.com) — Meta's web successor to React Native's `StyleSheet.create`. Each component ends with a `stylex.create({ … })` block holding only its own rules, so there is never a second file to open to find out what an element looks like:

```tsx
export function ProgressBar({ value }: ProgressBarProps) {
  return <div {...stylex.props(s.track)}>…</div>;
}

const s = stylex.create({
  track: { display: 'flex', height: 6, borderBottomWidth: 2 },
});
```

It compiles away entirely: `stylex.create` is replaced at build time with atomic class names and the CSS is extracted to `dist/assets/stylex.css`. Nothing ships at runtime.

Three consequences worth knowing before editing a stylesheet:

- **Longhands only.** `background`, `border` and `padding` shorthands are silently dropped — write `backgroundColor`, `borderWidth`/`borderStyle`/`borderColor`, `paddingTop`/`paddingRight`/… StyleX needs one property per atomic class. This bites quietly: the styles simply do not appear.
- **No descendant selectors and no attribute selectors.** Every rule sits on the element it applies to. A child that needs to vary picks its own style — see how `Tile` styles the romaji span for each variant rather than reaching down into it.
- **Conditions live inside the property, next to its resting value.** `borderColor: { default: …, ':hover:not(:disabled)': … }`. A hover-only style composed on afterwards would *replace* the resting value rather than add to it, because StyleX merges per property and the last style applied wins.

Values still come from the design system: `var(--color-accent)` and friends are ordinary strings to StyleX, so `_ds/…/styles.css` remains the single source of every colour and space, and its `.btn` and `.hr` stay plain global classes.

| Path | What it is |
| --- | --- |
| `src/data/types.ts` | `Tile`, `SentenceItem`, `Scenario` |
| `src/data/grammar.ts` | The 25 shared particles, endings and question words distractors draw on |
| `src/data/bakery.ts`, `src/data/station.ts` | One situation's sentences and vocabulary each |
| `src/data/scenarios.ts` | The situation list, in home-screen order |
| `src/config.ts` | The four difficulty and display dials |
| `src/lib/buildBank.ts` | The deterministic tile bank |
| `src/lib/segment.ts` | Splitting a written-out sentence back into tiles, longest match first |
| `src/lib/checkAnswer.ts` | Building the answer string and judging it |
| `src/lib/revealPlacement.ts` | Which bank positions spell the answer |
| `src/state/` | The reducer and the hook |
| `src/components/<Name>.tsx` | One component and its StyleX styles, in one file |
| `src/styles/shared.ts` | The two styles used by more than one component: `screen` and `kicker` |
| `src/styles/global.css` | The page ground — `html`, `body`, `button`. No element owns these, so they stay CSS |
| `src/styles/fonts.css` | The two `@font-face` rules |
| `tests/` | One file per component and per module, mirroring `src/` |
| `tests/fixtures/prototype-banks.json` | All 18 tile banks as the prototype generated them |
| `fonts/`, `icons/` | Vendored Archivo (latin) and Noto Sans JP, subset to the 102 kana and kanji in use. Both variable, wght 100–900, both OFL 1.1 with the license text alongside. Pulled in through the bundler, which is why there is no `public/` |
| `_ds/modernist-…/` | The Modernist design system. `styles.css` is imported unmodified and is the source of every color, space and radius token |
| `DESIGN.md` | The design document the app was built from |
| `prototype/` | The pre-React app, kept for reference |
| `Sentence Builder.dc.html`, `support.js` | The original Claude Design handoff the prototype was ported from. Not part of the app |

## Changing things

**Difficulty and display** — `src/config.ts`:

```ts
export const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
export const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
export const REVEAL_AFTER_MISSES = 3;  /* misses before "Show me the answer" appears */
export const SHOW_ROMAJI = true;       /* romaji beneath the kana on every tile */
```

**Adding a sentence** — push an object onto the items array in `src/data/bakery.ts` or `src/data/station.ts`:

```ts
{
  en: 'Please give me a bag.',
  ans: [['袋', 'fukuro'], ['を', 'o'], ['ください', 'kudasai']],
  alts: ['袋をお願いします'],
  note: 'Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes.',
}
```

`ans` is the canonical answer as `[kana, romaji]` tiles — particles split out, conjugation endings as their own tiles (食べ + たい). `alts` is optional and holds other accepted answers as plain strings; the bank generator segments each one and seeds any tile the canonical answer doesn't already supply, so every accepted answer is always buildable. `note` is required — it is what the learner sees after a second miss.

`npm test` checks all of this: that every item has a note, that every tile is a well-formed pair, and that every alternate is actually segmentable from the vocabulary in play. An alternate the tiles cannot spell is the failure mode worth guarding against — it would be accepted by the checker but impossible to build.

**Adding a situation** — write its items and words in a file beside `bakery.ts`, then add an entry to `SCENARIOS` in `src/data/scenarios.ts`. Nothing else changes. Distractors are drawn from `GRAMMAR` plus that situation's own `words`, so a wrong tile is always plausible within the scene.

**New Japanese glyphs** — the vendored `fonts/noto-sans-jp-subset.woff2` covers only the characters currently in use. Adding vocabulary with new kanji means regenerating it, or those glyphs fall back to the OS Japanese font:

```
curl -sG -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' \
     --data-urlencode 'family=Noto Sans JP:wght@100..900' \
     --data-urlencode 'text=<every JP character in the app>' \
     'https://fonts.googleapis.com/css2'
```

then download the single `woff2` the returned CSS points at, over `fonts/noto-sans-jp-subset.woff2`. The browser User-Agent is required: without it Google Fonts serves TrueType across nine static weights instead of one variable woff2.

## Tests

```
npm test
```

270 tests. Most are ordinary unit tests, but two are worth knowing about:

- **`tests/lib/buildBank.test.ts`** checks the generated tile bank against `tests/fixtures/prototype-banks.json`, which holds all 18 banks exactly as the original `app.js` produced them. The bank is deterministic — no RNG, just arithmetic on the item's index — so any change to the draw stride or the shuffle shows up here as a diff rather than as a silently different app.
- **`tests/components/App.test.tsx`** plays real drills through the real content: the miss ladder, the reveal forfeiting first-try credit, finishing a set and reading the score.

## Credits

The idea, the product decisions and the architecture are the author's. Two Claude tools were used to build it:

- **Claude Design** produced the Modernist design system in `_ds/`, the design document in `DESIGN.md`, and the `Sentence Builder.dc.html` design component the app was ported from — the visual system, the screen structure and the drill rules as specified.
- **Claude Code** ported that component to the PWA now in `prototype/`, and then converted that prototype to the React and TypeScript app in `src/`.

### Fonts

Both typefaces are vendored as subsets in `fonts/` and are used under the SIL Open Font License 1.1. The full license text ships alongside them.

| Font | Copyright | License |
| --- | --- | --- |
| Archivo | Omnibus-Type — The Archivo Project Authors | [OFL 1.1](fonts/OFL-Archivo.txt) |
| Noto Sans JP | Adobe, with Reserved Font Name 'Source' | [OFL 1.1](fonts/OFL-NotoSansJP.txt) |

## Not built yet

- **PWA support.** The prototype was installable and worked fully offline; the React app is not and does not. The service worker and manifest were left behind in `prototype/` during the conversion rather than being ported, to be re-added once the component tree settled. Vite hashes built filenames, so the hand-maintained precache list needs replacing with a generated one.
- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Persistence** — progress and the streak are not stored between sessions. The "Day 12" streak is static chrome.
- **Notifications** and the daily reminder.
- **Audio** playback of prompts, and a kana keyboard fallback.

### If you installed the prototype

The prototype registered a cache-first service worker at the repository root. If you loaded it from a served origin, that worker is still installed and will serve the old cached shell over the new app. Unregister it in DevTools → Application → Service Workers.

## Cleanup

Debt carried over from the conversions — the plain-JS PWA prototype to React, then CSS Modules to StyleX. None of it is broken; all of it is a thing that was deliberately deferred and should not be discovered by surprise later. Roughly in order of how likely it is to bite.

**Static chrome pretending to be real data.** `STREAK = 'Day 12'` is a hardcoded literal in `src/components/App.tsx`. Nothing is persisted between sessions, so the streak, the first-try score and which set you were on all reset on reload. The streak is the worst of these because it silently asserts something false to the learner — a real streak needs storage before the number means anything.

**A display string doing double duty as an identifier.** `App.tsx` builds the drill header with `scenario.kicker.replace('Set ', '')`, so `Set 01` becomes `01`. That works only while every kicker starts with exactly `"Set "`. Rename one and the header quietly shows the whole string instead. `kicker` is serving as both the home-screen label and the header's set number; those should be two fields on `Scenario`.

**Defensive fallbacks that hide real inconsistencies.** `revealPlacement.ts` returns index `0` for an answer tile missing from the bank, and `checkAnswer.ts` skips a placed index the bank cannot resolve. Both guard against content and bank drifting apart — which `buildBank` currently makes impossible, since it seeds the answer's own tiles first. As written, a genuine inconsistency would render a wrong sentence and call it the answer. Decide whether these should throw instead.

**Two copies of the Japanese.** `prototype/app.js` carries its own full copy of all 18 sentences. They match today — 10 and 8 on both sides — but nothing enforces it, so editing `src/data/` silently drifts the prototype. `tests/fixtures/prototype-banks.json` was generated from the prototype's copy, so drift would eventually leave the parity test checking against stale content. Either declare the prototype a frozen artifact and stop treating it as a reference, or delete it once the React version is trusted enough.

**Dead weight at the repository root.** `Sentence Builder.dc.html` and `support.js` are the original Claude Design handoff — 91 KB, tracked, referenced by nothing that runs. `DESIGN.md` supersedes them as the record of intent.

**Orphaned icons.** `icons/` holds four files; the React app references only `icon-192.png`, as the favicon. The 512, maskable-512 and 180 variants exist for the web manifest, which now lives in `prototype/`. Keep them — re-adding PWA support needs them — but they are not currently in use by anything you build.

**Untracked `.DS_Store` files** at the repository root and in `_ds/`. Gitignored, so harmless, but still on disk.

**StyleX is pinned to 0.18.3.** `unplugin-stylex` depends on `@stylexjs/babel-plugin: ^0.18.2`, which resolves below the current StyleX 0.19. Revisit when the plugin catches up or StyleX ships first-party Vite support. Related: every `npm run dev` and `npm test` prints `[plugin:unplugin-stylex] context method emitFile() is not supported in serve mode`. It is cosmetic — the plugin falls back to runtime style injection, which is normal StyleX dev behaviour — but recurring warnings train you to stop reading warnings.

**`DESIGN.md` is stale in a confusing way.** Its "Not built yet" list includes "Real PWA plumbing: manifest, service worker, offline lesson cache" — written before the prototype existed. The prototype then built exactly that, and the React conversion dropped it again. The line is accidentally true for the wrong reason, which is worse than being plainly wrong.

## Dev notes

### Todo

- Osusume wa nan desu ka?: add alts and add note: "this is the more natural phrasing as opposed to "nani ga osusume desu ka"
- for answers with alternates, give chance to get best answer
- clicking on tile that was place removes only that tile, and next tile clicked goes in that spot
- rough sequence for learning (ask for claude feedback)
  - learn vocabulary
  - learn how to use particles
  - learn verb conjugation
  - learn sentences
- user can jump around as desired
- star system
  - one star: finished with zero incorrect
  - two star: finished with zero misses
  - three star: finished all sections with zero misses
- todo: vocab before building sentences
- todo: basic particle learning
- todo: verb conjugation learning
