# Architecture

[← README](../README.md)

How the code is arranged, why the layers point the way they do, and the StyleX rules worth knowing before editing a stylesheet. What the current design assumes — and what a second exercise or language would run into — is in [ROADMAP.md](ROADMAP.md#what-the-current-design-assumes).

## The one rule

**Dependencies point one way, and language data is never imported by logic.**

```
main.tsx  ──►  components/  ──►  state/useTsumiki  ──►  state/appReducer   (pure, imports nothing)
   │                                    │
   └─ LANGUAGE                          ├────────────►  lib/               (pure, data-free)
                                        │
                                        └────────────►  data/              (content + its loader)
```

- **`src/data/`** is the loader for the language packs: the types they take, `assemblePack.ts`, which merges the authored files in `content/` into one, and `loadPack.ts`, which expands that into a `LanguagePack`. The content itself lives in `content/` and is inert. `loadPack` is the one piece of logic here, and it reaches into `lib/` for `getVocabIn` — an edge but not a cycle, since `lib/` imports only *types* from `data/` and never content.
- **`src/lib/`** is the processing: bank generation, segmentation, answer checking, reveal placement. Pure functions that take the content they need as arguments and never import `data/`.
- **`src/state/appReducer.ts`** is every drill rule, as one pure reducer. It imports nothing at all — `check` carries a boolean verdict and `reveal` carries the bank positions to fill, so judging an answer happens at the seam where the content already is.
- **`src/state/useTsumiki.ts`** is the single seam where content, state and logic meet. It resolves the current scenario, item and tile bank, applies the config dials, and judges what the learner built.
- **`src/components/`** are presentational: props in, callbacks out. Only `App` calls the hook. One file per component, with its styles in it.

**Nothing is saved.** The app keeps no progress: a reload starts a fresh session. The IndexedDB layer that recorded attempts for a future scheduler was removed in the 2026-09 scope reduction — see [CHANGELOG.md](CHANGELOG.md).

## Language packs

The Japanese is authored in `content/ja/` — a shared `core.json` plus one file per situation — merged by `assemblePack` and expanded by `loadPack` into a `LanguagePack`. `src/data/languages.ts` imports the files, runs both, holds the registry, and names which pack is active. Nothing outside `content/` and `languages.ts` names Japanese.

```
content/ja/core.json        shared lexicon, grammar, particles, conjugations
content/ja/bakery.json  ─┐  one situation + the readings only it needs
content/ja/station.json  ├──►  assemblePack()  ──►  PackFile  ──►  loadPack()  ──►  LanguagePack
content/ja/…            ─┘     merges lexicons,       authored        expands
                               rejects disagreements   shape
```

Splitting per situation means adding one is writing one file rather than editing a shared one in three places. The cost is that two files can disagree about a reading, which `assemblePack` throws on rather than silently resolving — otherwise a word would show one romaji in one situation and another elsewhere.

**Authored and runtime shapes differ on purpose** — the first is optimised for writing by hand, the second for being read by the drill:

```
AUTHORED (content/ja/*.json)       RUNTIME (LanguagePack)
lexicon: { "パン": "pan" }   ─┐
                              ├──►  ans: [["パン","pan"], ["を","o"]]
ans: "パン|を"               ─┘
teaches: ["o", "tai"]         ──►  tags: { particles:["o"], conjugations:["tai"] }   (unused)
(list position)               ──►  lessonNum: "01"
items[].ans + words[]         ──►  words: [every content tile, deduped]
```

A reading is written once, in a lexicon. That turns "a text reads one way per pack" from a rule a test enforces into a property of the files' shape. See [AUTHORING.md](AUTHORING.md) for the fields.

There is no schema library. A pack is compiled into the bundle, so `resolveJsonModule` type-checks it against `PackFile`, `loadPack` throws on what types cannot express, and `tests/data/packFileKeys.test.ts` catches the one gap left — a typo'd *optional* key, which is legal TypeScript and silently drops the field. If content ever arrives at runtime instead, it becomes untrusted input and zod is the right answer.

A pack carries its own content — a grammar pool, its particles and conjugation patterns, and a list of scenarios — plus the two things the rest of the app cannot infer about a language:

- **`joiner`** — what sits between tiles when they are joined into a sentence, and what is skipped when one is segmented back. Empty for Japanese, which is written without spaces; `' '` for a space-separated language. This is the only genuinely script-dependent rule in the app, which is why it is declared rather than assumed: `buildString`, `isCorrect`, `segmentLongestFirst` and `buildBank` all take it as a required argument, so no caller can inherit Japanese's assumption by accident.
- **`fontStack`** — the face target-language text is drawn in. StyleX values are static, so the family cannot be interpolated into a rule: the pack sets `--font-target` on the app root through `PhoneColumn`, and `Tile`'s rule reads the variable. `global.css` carries a fallback for a pack that omits one.

Scenarios belong to the pack, not to the app. Another language's situations may look nothing like Japanese's — see [AUTHORING.md](AUTHORING.md#adding-a-language).

**`teaches` is authored but unread.** Each sentence names the particles and patterns it teaches, and `loadPack` checks those ids against the pack's registries. Nothing in the app uses the result. It is kept so the data stays correct for a later exercise — see [ROADMAP.md](ROADMAP.md).

## Styling

Styles are [StyleX](https://stylexjs.com) — Meta's web successor to React Native's `StyleSheet.create`. Each component ends with a `stylex.create({ … })` block holding only its own rules, so there is never a second file to open to find out what an element looks like:

```tsx
export function ProgressBar({ value }: ProgressBarProps) {
  return <div {...stylex.props(s.track)}>…</div>;
}

const s = stylex.create({
  track: { display: 'flex', height: 6, borderBottomWidth: 2 },
});
```

It compiles away entirely: `stylex.create` is replaced at build time with atomic class names and the CSS is appended to the app's own CSS asset, after the design system. Nothing ships at runtime.

Three consequences worth knowing before editing a stylesheet:

- **Longhands only.** `background`, `border` and `padding` shorthands are silently dropped — write `backgroundColor`, `borderWidth`/`borderStyle`/`borderColor`, `paddingTop`/`paddingRight`/… StyleX needs one property per atomic class. This bites quietly: the styles simply do not appear.
- **No descendant selectors and no attribute selectors.** Every rule sits on the element it applies to. A child that needs to vary picks its own style — see how `Tile` styles the reading span for each variant rather than reaching down into it.
- **Conditions live inside the property, next to its resting value.** `borderColor: { default: …, ':hover:not(:disabled)': … }`. A hover-only style composed on afterwards would *replace* the resting value rather than add to it, because StyleX merges per property and the last style applied wins.

Values still come from the design system: `var(--color-accent)` and friends are ordinary strings to StyleX, so `_ds/…/styles.css` remains the single source of every colour and space, and its `.btn` and `.hr` stay plain global classes.

## Offline and installing

The app installs from a web manifest and opens offline from a precached shell. Both are emitted by `tools/pwa.ts`, a Vite plugin — there is no `public/` directory and no PWA dependency.

```
tools/pwa.ts          emits, at build time
  ├─ icons, hashed        →  dist/assets/icon-…png
  ├─ manifest.webmanifest →  fixed name, hashed icon urls inside
  └─ sw.js                →  fixed name, precache list inlined

src/sw.ts             the worker. transpiled alone, imports nothing
src/lib/precache.ts   bundle filenames → the list, and the cache name
src/pwa.ts            registers it, in production only
```

**Precaching the shell precaches the lessons.** `content/ja/*.json` is statically imported, so the packs are inside the JS bundle. There is no separate content cache, and no runtime fetch of content to make offline-safe.

**The cache name is a hash of the precache list.** The list carries Vite's content hashes, so every build is a new cache and `activate` drops the ones that no longer match. `prototype/sw.js` used a hand-bumped `tsumiki-v3` constant, which was one forgotten edit away from serving a stale app forever.

**Every url is relative** — `start_url`, `scope`, the icon `src`s and the precache entries. `caches.addAll()` resolves them against the worker's own location, so one build runs at a domain root or under a subpath. This is the same constraint `base: './'` exists for, and it is what lets the app deploy to a GitHub Pages project path.

**The worker calls `skipWaiting()`.** A new build takes over on next launch rather than waiting for every tab to close, which an installed app rarely gets. That is safe here only because the build is a single bundle with no code splitting: a running page already holds its JS and CSS and requests no further chunks. A lazy import would make it unsafe.

**Registration is production-only, and gives up quietly.** In dev a cache-first worker serves back the file you just fixed. Outside a secure context `navigator.serviceWorker` is simply absent — plain http to a phone on the LAN — and the app runs without offline support rather than failing.

## Judging the answer line

**Wrong tiles are always worked out against the canonical answer, never an alternate.** Highlighting wrong tiles should always compare against the same right answer to avoid confusion over multiple attempts. A learner most of the way to an alternate sees its extra tiles marked too.

**Alignment is a longest-common-subsequence walk, not a position-by-position comparison.** One tile left out early would otherwise shift every later tile and mark the whole line wrong. Each step of the walk:

```
line[i] === want[j]          -> both advance; the tile is accounted for
skipping want[j] scores better -> the answer wants a tile the line lacks; nothing marked
otherwise                    -> line[i] is marked wrong
past the end of want         -> everything left on the line is wrong
```

## File map

| Path | What it is |
| --- | --- |
| `src/data/types.ts` | `Tile`, `SentenceItem`, `Scenario`, `Particle`, `ConjugationPattern`, `LanguagePack` — the runtime shapes, shared by every pack |
| `src/data/languages.ts` | Loads the packs, holds the registry, and names which one the app is drilling |
| `content/<code>/core.json` | A language's shared lexicon, grammar pool, particles and conjugation patterns |
| `content/<code>/<id>.json` | One situation: its sentences, its extra distractors, and the readings only it needs |
| `src/data/assemblePack.ts` | Merging the core file and the situation files into one `PackFile` |
| `src/data/loadPack.ts` | The authored shapes, and expanding one into a `LanguagePack` |
| `src/config.ts` | The difficulty and display dials |
| `src/lib/buildBank.ts` | The deterministic tile bank |
| `src/lib/segment.ts` | Splitting a written-out sentence back into tiles, longest match first |
| `src/lib/checkAnswer.ts` | Building the answer string and judging it |
| `src/lib/revealPlacement.ts` | Which bank positions spell the answer |
| `src/lib/diffAnswer.ts` | Which positions on the answer line are wrong, against the canonical answer |
| `src/lib/tags.ts` | Which words a sentence uses, which is what its distractors are built from |
| `src/state/` | The reducer and the hook |
| `src/components/<Name>.tsx` | One component and its StyleX styles, in one file |
| `src/lib/precache.ts` | The precache list and the cache name derived from it |
| `src/sw.ts` | The service worker. Imports nothing; transpiled on its own |
| `src/pwa.ts` | Registers the worker, and drops a foreign one controlling the page |
| `tools/pwa.ts` | The Vite plugin emitting the manifest, the icons and `sw.js` |
| `src/styles/shared.ts` | The two styles used by more than one component: `screen` and `kicker` |
| `src/styles/global.css` | The page ground — `html`, `body`, `button`. No element owns these, so they stay CSS |
| `src/styles/fonts.css` | The two `@font-face` rules |
| `tests/` | Behaviour that would be noticeable in the app; not one file per component |
| `fonts/`, `icons/` | Vendored Archivo (latin) and Noto Sans JP, subset to exactly the kana and kanji in use — `fonts/noto-sans-jp-subset.txt` records which. Both variable, wght 100–900, both OFL 1.1 with the license text alongside. Pulled in through the bundler, which is why there is no `public/` |
| `_ds/modernist-…/` | The Modernist design system. `styles.css` is imported unmodified and is the source of every color, space and radius token |
| `scripts/` | `npm run import` (check a situation file) and `npm run font` (regenerate the JP subset), plus the pure halves both are tested through |
| `prototype/DESIGN.md` | The design document the app was built from |
| `prototype/` | The pre-React app, kept for reference — see [MAINTENANCE.md](MAINTENANCE.md) |

## Tests

```
npm test
```

**The suite covers what would be noticeable while practising**, not every component in isolation. The 2026-09 scope reduction cut it from 38 files to 18; per-component tests went, because `App.test` and `DrillScreen.test` already drive those components.

**Unit tests build their own fixtures rather than borrowing shipped sentences.** Only `tests/data/` reads the real content. A unit test reaching into `LANGUAGE.scenarios[0].items[5]` for a convenient example fails when content is edited and reports it as a bug in the code under test.

The ones worth knowing about:

- **`tests/components/App.test.tsx`** plays real drills through the real content: the miss ladder, the reveal, finishing a set and reading the score.
- **`tests/components/DrillScreen.test.tsx`** covers a sentence with no note, which `App.test` never reaches.
- **`tests/data/languages.test.ts`** runs the content-integrity checks over every pack in `LANGUAGES`, so a language added later inherits the whole net. Two of them guard arrangements that would otherwise drift silently:
  - every declared particle carries the same tile the grammar pool holds;
  - the revealed answer spells the canonical one from the generated bank, keeping the index fallbacks in `revealPlacement.ts` and `checkAnswer.ts` from firing in front of a learner.
- **`tests/data/packFileKeys.test.ts`** catches a typo'd optional key in the content, which TypeScript cannot see.
- **`tests/lib/buildBank.test.ts`** tests the generator by its properties: same item and index give the same bank, every answer tile is present, no text repeats, an alternate's missing tiles are seeded.
- **`tests/pwa.test.ts`** states the registration behaviour, which is invisible in the app until the next visit.
