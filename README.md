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

## How a drill works

- Tap bank tiles to place them; tap a placed tile to send it back.
- **Check** validates the built string against the item's canonical answer plus its accepted alternates.
- **First miss** — silent retry: the answer line clears and a short status line appears, with no explanation.
- **Second miss** — the grammar note appears, explaining the particle or form at issue.
- **Third miss** — a "Show me the answer" button appears. Using it fills and locks the answer line, and forfeits the first-try credit.
- **Correct** — the status reads "Correct" and the same note is relabelled "Additional grammar tips".

The score on the set-complete screen is sentences built on the first try.

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
