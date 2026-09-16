# Architecture

[← README](../README.md)

How the code is arranged, why the layers point the way they do, and the StyleX rules worth knowing before editing a stylesheet. What the current design assumes — and what a second exercise or language would run into — is in [ROADMAP.md](ROADMAP.md#what-the-current-design-assumes).

## The one rule

**Dependencies point one way, and language data is never imported by logic.**

```
components/  ──►  state/useTsumiki  ──►  state/appReducer            (pure, imports nothing)
                        │
                        ├────────────►  lib/                         (pure, data-free)
                        │
                        ├────────────►  data/                        (content + its loader)
                        │
                        └────────────►  storage/                     (async, side effects)
```

- **`src/data/`** is the loader for the language packs: the types they take, `assemblePack.ts`, which merges the authored files in `content/` into one, and `loadPack.ts`, which expands that into a `LanguagePack`. The content itself lives in `content/` and is inert. `loadPack` is the one piece of logic here, and it reaches into `lib/` for `getVocabIn` — an edge but not a cycle, since `lib/` imports only *types* from `data/` and never content.
- **`src/lib/`** is the processing: bank generation, segmentation, answer checking, reveal placement, key composition, and the roll-up arithmetic that turns an attempt into a progress row. Pure functions that take the content they need as arguments and never import `data/`.
- **`src/state/appReducer.ts`** is every drill rule, as one pure reducer. It imports nothing at all — `check` carries a boolean verdict and `reveal` carries the bank positions to fill, so judging an answer happens at the seam where the content already is. That is what makes the rules exercise-agnostic: nothing in them knows what a sentence is.
- **`src/storage/`** is persistence: IndexedDB, and the interfaces that hide it. It is the only layer with side effects, and like `data/` it is reached only through the seam.
- **`src/state/useTsumiki.ts`** is the single seam where content, state, logic and storage meet. It resolves the current scenario, item and tile bank, applies the config dials, judges what the learner built, and writes down the result. It judges rather than the reducer because a store write cannot wait for a re-render: it has to know the verdict before it dispatches, so it decides once and passes it on.
- **`src/components/`** are presentational: props in, callbacks out. Only `App` calls the hook. One file per component, with its styles in it.

`appReducer`, `lib/` and `data/` never import `storage/`. That is what keeps every drill rule synchronously testable without opening a database — and if `tests/state/appReducer.test.ts` ever needs a change to accommodate storage, the seam has leaked.

## Language packs

The Japanese is authored in `content/ja/` — a shared `core.json` plus one file per situation — merged by `assemblePack` and expanded by `loadPack` into a `LanguagePack`. `src/data/languages.ts` imports the files, runs both, holds the registry, and names which pack is active. Nothing outside `content/` and `languages.ts` names Japanese.

```
content/ja/core.json        shared lexicon, grammar, particles, conjugations
content/ja/bakery.json  ─┐  one situation + the readings only it needs
content/ja/station.json  ├──►  assemblePack()  ──►  PackFile  ──►  loadPack()  ──►  LanguagePack
content/ja/…            ─┘     merges lexicons,       authored        expands
                               rejects disagreements   shape
```

Splitting per situation means adding one is writing one file rather than editing a shared one in three places. The cost is that two files can disagree about a reading, which `assemblePack` throws on rather than silently resolving — progress is keyed on the text, so taking one reading over the other would attach history to a word that now reads differently.

**Authored and runtime shapes differ on purpose** — the first is optimised for writing by hand, the second for being read by the drill:

```
AUTHORED (content/ja/*.json)       RUNTIME (LanguagePack)
lexicon: { "パン": "pan" }   ─┐
                              ├──►  ans: [["パン","pan"], ["を","o"]]
ans: "パン|を"               ─┘
teaches: ["o", "tai"]         ──►  tags: { particles:["o"], conjugations:["tai"] }
(list position)               ──►  kicker: "Set 01"
items[].ans + words[]         ──►  words: [every content tile, deduped]
```

A reading is written once, in a lexicon. That turns "a text reads one way per pack" from a rule a test enforces into a property of the files' shape. See [AUTHORING.md](AUTHORING.md) for the fields.

There is no schema library. A pack is compiled into the bundle, so `resolveJsonModule` type-checks it against `PackFile`, `loadPack` throws on what types cannot express, and `tests/data/packFileKeys.test.ts` catches the one gap left — a typo'd *optional* key, which is legal TypeScript and silently drops the field. If content ever arrives at runtime instead, it becomes untrusted input and zod is the right answer.

A pack carries its own content — a grammar pool, its particles and conjugation patterns, and a list of scenarios — plus the two things the rest of the app cannot infer about a language:

- **`joiner`** — what sits between tiles when they are joined into a sentence, and what is skipped when one is segmented back. Empty for Japanese, which is written without spaces; `' '` for a space-separated language. This is the only genuinely script-dependent rule in the app, which is why it is declared rather than assumed: `buildString`, `isCorrect`, `segmentLongestFirst` and `buildBank` all take it as a required argument, so no caller can inherit Japanese's assumption by accident.
- **`fontStack`** — the face target-language text is drawn in. StyleX values are static, so the family cannot be interpolated into a rule: the pack sets `--font-target` on the app root through `PhoneColumn`, and `Tile`'s rule reads the variable. `global.css` carries a fallback for a pack that omits one.

Scenarios belong to the pack, not to the app. Another language's situations may look nothing like Japanese's — see [AUTHORING.md](AUTHORING.md#adding-a-language).

## Where progress lives

Progress is kept in **IndexedDB**, in a database called `tsumiki`. Nothing schedules reviews yet; what exists is the record a scheduler will need, collected from the first session because observations cannot be recreated after the fact.

### Why IndexedDB and not localStorage

The shortcut is tempting and wrong, for four reasons in descending order of how much they settle it:

- **A service worker cannot read `localStorage`.** It can read IndexedDB. PWA support and the daily reminder are both on [ROADMAP.md](ROADMAP.md), and both need progress readable with no page open. This alone decides it.
- **`localStorage` is synchronous** and blocks rendering on every read. Per-item history grows without bound, and a tile tap is not a good moment to block.
- **It is string-only and roughly 5 MB**, so storing history means serialising and reparsing the whole blob on every write.
- **No indexes.** "Which items are due" is a range query over an index, not a full scan of a parsed blob.

### The schema

Two stores that matter, keyed by strings composed in `src/lib/keys.ts` — `ja:item:bakery:01` for a sentence, `ja:tile:パン` for vocabulary, `ja:particle:o` and `ja:conjugation:tai` for the grammar points a sentence teaches. Ids are local to their parent and qualified here, so nothing inside `content/ja/` has to name Japanese.

A particle deliberately does **not** reuse its tile key. Knowing the word を and knowing when を is the right particle are different things, and a drill built to teach the second would be scored against the first if they shared a row. Vocabulary goes the other way on purpose: a future vocabulary exercise writes to the same `ja:tile:*` row the sentence drill already writes to, because those are evidence about the same thing differing only in directness — which `viaItem` already records.

- **`attempts`** is an **append-only log**: one row per check or reveal, never updated. This is the load-bearing decision. SM-2, Anki's variants and FSRS are all either parameterised or trained on review logs, so keeping only rolled-up state would make changing scheduler mean starting every learner from zero. Keeping the log means any future scheduler can be fitted against real history.
- **`schedule`** is one row per reviewable thing, rolled up from that log by `rollUp()` in `src/lib/progress.ts`. It is a cache, not a source of truth — every row can be rebuilt by replaying its attempts.

`schedule` rows carry the scheduling fields already (`dueAt`, `intervalDays`, `ease`, `stability`, `difficulty`) but nothing writes them, and **`schedulerVersion` is `0` on every row**. That sentinel is the mechanism: a scheduler shipping as version 1 finds every row still at 0 and initialises it from the log, rather than starting a learner from nothing.

Every attempt also carries **`mode`** — which exercise produced it — and **`scenarioId`**. Both are a separate axis from the key's unit and neither is recoverable afterwards, which is why they are taken now: a `ja:tile:パン` row can legitimately come from the sentence drill or from a vocabulary exercise, and a tile key does not say what situation it was answered in.

Rows written before those fields existed simply lack them, because IndexedDB stores values rather than rows against a schema. `hydrateAttempt` in `src/lib/progress.ts` repairs them on the way out of the store: a row with no `mode` is `'sentence'`, which is provably right because nothing else could have written it. That is why adding these fields needed no `DB_VERSION` bump.

### Two limits worth knowing

- A **tile or tag row is indirect evidence**, marked by `viaItem`. Building a sentence correctly does not establish that each tile in it was known, nor that the learner picked は for the reason the sentence is about, and a scheduler should be able to weight these differently from a direct review.
- There is **no per-token attribution**. `checkAnswer` compares whole joined strings, so on a wrong answer nothing knows *which* part was wrong — which is why a wrong answer records nothing against tiles or tags at all, and why a settled sentence gives everything below it the same outcome.

### When it is not there

IndexedDB can genuinely be unavailable: some private-browsing modes, site data blocked, quota exhausted, or an upgrade blocked by another tab. `openRepository` falls back to the in-memory store and reports `durable: false`, so the drill keeps working and the app knows it is not saving. The migration ladder in `storage/db.ts` is written as an array from version 1 on purpose — adding a rung later is a line; retrofitting the ladder once databases exist in the wild is not.

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

It compiles away entirely: `stylex.create` is replaced at build time with atomic class names and the CSS is extracted to `dist/assets/stylex.css`. Nothing ships at runtime.

Three consequences worth knowing before editing a stylesheet:

- **Longhands only.** `background`, `border` and `padding` shorthands are silently dropped — write `backgroundColor`, `borderWidth`/`borderStyle`/`borderColor`, `paddingTop`/`paddingRight`/… StyleX needs one property per atomic class. This bites quietly: the styles simply do not appear.
- **No descendant selectors and no attribute selectors.** Every rule sits on the element it applies to. A child that needs to vary picks its own style — see how `Tile` styles the reading span for each variant rather than reaching down into it.
- **Conditions live inside the property, next to its resting value.** `borderColor: { default: …, ':hover:not(:disabled)': … }`. A hover-only style composed on afterwards would *replace* the resting value rather than add to it, because StyleX merges per property and the last style applied wins.

Values still come from the design system: `var(--color-accent)` and friends are ordinary strings to StyleX, so `_ds/…/styles.css` remains the single source of every colour and space, and its `.btn` and `.hr` stay plain global classes.

## File map

| Path | What it is |
| --- | --- |
| `src/data/types.ts` | `Tile`, `SentenceItem`, `Scenario`, `Particle`, `ConjugationPattern`, `LanguagePack` — the runtime shapes, shared by every pack |
| `src/data/languages.ts` | Loads the packs, holds the registry, and names which one the app is drilling |
| `content/<code>/core.json` | A language's shared lexicon, grammar pool, particles and conjugation patterns |
| `content/<code>/<id>.json` | One situation: its sentences, its extra distractors, and the readings only it needs |
| `src/data/assemblePack.ts` | Merging the core file and the situation files into one `PackFile` |
| `src/data/loadPack.ts` | The authored shapes, and expanding one into a `LanguagePack` |
| `src/config.ts` | The four difficulty and display dials |
| `src/lib/buildBank.ts` | The deterministic tile bank |
| `src/lib/segment.ts` | Splitting a written-out sentence back into tiles, longest match first |
| `src/lib/checkAnswer.ts` | Building the answer string and judging it |
| `src/lib/revealPlacement.ts` | Which bank positions spell the answer |
| `src/lib/keys.ts` | Composing and parsing the keys progress is stored against |
| `src/lib/tags.ts` | The one derived tag: which words a sentence uses, as opposed to which grammar it teaches |
| `src/lib/progress.ts` | What is recorded about a learner, and how one attempt folds into it |
| `src/storage/db.ts` | Opening IndexedDB, the migration ladder, promise wrappers |
| `src/storage/idbProgressStore.ts`, `memoryProgressStore.ts` | The two `ProgressStore`s, held to one contract by the same test suite |
| `src/storage/moduleContentSource.ts` | Content from the compiled packs — the only file in `storage/` reading `data/` |
| `src/storage/index.ts` | Assembles the repository and owns the fallback |
| `src/state/` | The reducer and the hook |
| `src/components/<Name>.tsx` | One component and its StyleX styles, in one file |
| `src/styles/shared.ts` | The two styles used by more than one component: `screen` and `kicker` |
| `src/styles/global.css` | The page ground — `html`, `body`, `button`. No element owns these, so they stay CSS |
| `src/styles/fonts.css` | The two `@font-face` rules |
| `tests/` | One file per component and per module, mirroring `src/` |
| `fonts/`, `icons/` | Vendored Archivo (latin) and Noto Sans JP, subset to exactly the kana and kanji in use — `fonts/noto-sans-jp-subset.txt` records which. Both variable, wght 100–900, both OFL 1.1 with the license text alongside. Pulled in through the bundler, which is why there is no `public/` |
| `_ds/modernist-…/` | The Modernist design system. `styles.css` is imported unmodified and is the source of every color, space and radius token |
| `scripts/` | `npm run import` (check a situation file) and `npm run font` (regenerate the JP subset), plus the pure halves both are tested through |
| `prototype/DESIGN.md` | The design document the app was built from |
| `prototype/` | The pre-React app, kept for reference — see [MAINTENANCE.md](MAINTENANCE.md) |

## Tests

```
npm test
```

**Unit tests build their own fixtures rather than borrowing shipped sentences**; only `tests/data/` and the two integration tests below read the real content, and they do it deliberately. A unit test that reaches into `LANGUAGE.scenarios[0].items[5]` for a convenient example fails when content is edited and reports it as a bug in the code under test. `tests/components/DrillScreen.test.tsx` shows the pattern.

Most are ordinary unit tests, but these are worth knowing about:

- **`tests/storage/progressStore.test.ts`** is one contract suite run over both `ProgressStore` implementations. The in-memory store is not only a test double — it is what a learner actually gets when IndexedDB will not open — so the two behaving differently would be a real bug. IndexedDB itself is polyfilled with `fake-indexeddb` rather than mocked, because upgrade paths, transaction lifetimes and key ranges are exactly where its bugs live.
- **`tests/storage/drillIntegration.test.tsx`** plays a real drill through the real components into a real database and reads the rows back, which is the only test that would catch the two halves being wired together wrongly.
- **`tests/lib/buildBank.test.ts`** tests the generator by its properties rather than against a recorded output: the same item and index give the same bank, every answer tile is present, no text repeats, an alternate's missing tiles are seeded. It used to pin all 18 banks tile for tile against a fixture of what the prototype produced; that was removed, because it asserted fidelity to frozen code and failed on every content change — adding a sentence or a vocabulary word reshuffles banks by design.
- **`tests/components/App.test.tsx`** plays real drills through the real content: the miss ladder, the reveal forfeiting first-try credit, finishing a set and reading the score.
- **`tests/data/loadPack.test.ts`** and **`tests/data/packFileKeys.test.ts`** cover the authored-to-runtime expansion and the unknown-key check, both against small inline fixtures rather than the shipped pack.
- **`tests/data/languages.test.ts`** runs the content-integrity checks over every pack in `LANGUAGES`, so a language added later inherits the whole net without writing it again. What is true of one language only — its particles, its empty joiner, its font — lives in `tests/data/ja.test.ts` instead. One of these checks guards an arrangement that would otherwise drift silently: that every declared particle carries the same tile the grammar pool holds.
