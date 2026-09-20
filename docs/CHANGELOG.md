# Changelog

[← README](../README.md)

Notable changes, newest first. Entries record *why* and what carries forward, not every commit — `git log` has those.

## 2026-09-20 — Scope cut back to one person drilling Japanese

The app had grown scaffolding for things that were never built: a progress database for a spaced-repetition scheduler, three unwritten exercise modes, and a test suite larger than the app. All of it was removed. The drill itself, the content, the language-pack layer and offline support are untouched.

| | Before | After |
| --- | --- | --- |
| `src/` | 44 files, 3,661 lines | 36 files, 2,468 lines |
| Tests | 38 files, 384 tests | 19 files, 212 tests |
| Dev dependencies | `fake-indexeddb` | removed |

**Progress tracking is gone, not disabled.** `src/storage/` (IndexedDB, both `ProgressStore`s, `ContentSource`), `lib/progress.ts` and `lib/keys.ts` are deleted. Every check used to write an attempt row, plus indirect rows for each tile, particle and pattern in the sentence — and nothing ever read any of it back. A reload now starts a fresh session, which was already true of the score and the current set. `main.tsx` renders with `LANGUAGE` directly rather than opening a repository first, so the "Not saving" header notice went with it.

**`teaches` stays, deliberately.** The tags name grammar for a future exercise. Nothing reads them, but `loadPack` still checks every id against the pack's particle and conjugation registries, so the data cannot rot while it waits.

**Tests now cover what is noticeable while practising.** Per-component tests went — `App.test` and `DrillScreen.test` already drive those components through real content. So did the loader unit tests, since a broken pack throws at import and fails everything. What stays: whole drills, content integrity, bank generation, answer checking, and the service worker.

**`npm run import` and `npm run font` hung after finishing.** StyleX's dev-server hook starts an HMR poll that is only cleared when a listening http server closes, and `vite-node` never listens. The hook is now kept only for `npm run dev`; the scripts run with `--mode script`. Vitest had the same hang and the same workaround, keyed on `test` alone.

**Comments were cut throughout.** The rule: state the decision or the trap, never how the platform works in general, and never the history of how the code got here.

## 2026-09-18 — The app installs and works offline

The prototype was installable; the React conversion dropped the manifest and service worker in `prototype/` and never ported them. Both are back, generated rather than hand-written.

```
tools/pwa.ts   a Vite plugin, no dependency added
  ├─ icons, hashed
  ├─ manifest.webmanifest   fixed name, hashed icon urls inside
  └─ sw.js                  fixed name, precache list inlined
```

**The precache list could not be ported.** Vite hashes filenames, so the prototype's hand-written 12-entry list was unportable by construction — it is now derived from what the build emitted. The cache name is a hash of that list, so every build is a new cache and `activate` drops the old one. `prototype/sw.js` used a hand-bumped `tsumiki-v3`, one forgotten edit away from serving a stale app forever.

**Offline came free.** `content/ja/*.json` is statically imported, so the lessons are inside the JS bundle. Precaching the shell precaches them; there was no content cache to design.

**Every url is relative**, precache entries included, so one build runs at a domain root or under a subpath. That is what makes GitHub Pages at a project path work, and it is why `base: './'` is load-bearing rather than tidy.

**Scope was cut halfway through, deliberately.** The original plan had an update-prompt component, an install-prompt component and an offline-verification script. For one user on one device, Chrome's own install button and a one-line `skipWaiting()` do the same work — so those three were dropped rather than built. `skipWaiting()` is safe here only because the build is a single bundle with no code splitting; a lazy import would change that, and the comment in `src/sw.ts` says so.

iOS meta tags were left out — the target is Android, where they do nothing. Recorded in [MAINTENANCE.md](MAINTENANCE.md) with what breaks if that changes.

## 2026-09-17 — StyleX moves to the first-party plugin

The exact `0.18.3` pin was load-bearing, not caution. `unplugin-stylex` (third-party) depends on `@stylexjs/babel-plugin: ^0.18.2` while its peer range on the runtime is a wide `"0.x"` — so bumping the runtime alone would have installed cleanly and silently paired a 0.19 runtime with a 0.18 compiler.

`@stylexjs/unplugin` is first-party and pins the compiler *exactly*, which removes the mismatch the pin existed to prevent. Runtime, unplugin and babel-plugin are now all `0.19.1`.

| | Before | After |
| --- | --- | --- |
| CSS assets | `index.css` + `stylex.css` | one, StyleX appended after the design system |
| JS bundle | 251.18 kB | 228.02 kB |
| `emitFile()` warning | every `dev` and `test` | gone |

The CSS is provably unchanged: 217 rules before and after, atomic class names identical, the only four differences lightningcss value normalisation (`-0.03em` → `-.03em`, `transparent` → `#0000`).

**One upstream bug had to be worked around.** The plugin's `configureServer` starts an HMR poll that Vitest never clears, hanging every run 10s on exit. `vite.config.ts` strips that hook in test mode — see [MAINTENANCE.md](MAINTENANCE.md#cleanup).

## 2026-09-12 — The docs catch up, and a formatter arrives

Housekeeping after the rewrite, in four parts. None of it changes what the app does; the production bundle came out byte-identical through the formatting pass.

**The docs described an app that no longer existed.** Every one of them still said content lived in a single `src/data/ja.json` — see the entry below, which is where that stopped being true. `AUTHORING.md` was the one that mattered: it is the guide you follow to add a situation, and it was wrong about the file layout, wrong about the steps, and still told you to run a hand-built `curl` that `npm run font` had replaced. Rewritten and then walked end to end on a throwaway situation, which is how two errors in the rewrite itself were caught.

**The app stopped making claims it could not support.** A hardcoded `Day 12` streak is gone rather than left standing until there is a session row to derive one from; `openRepository`'s `durable` flag now reaches the header, so a session that will be forgotten says so; and two pieces of copy promising an unbuilt "response level" now describe what the app actually does.

**One third-party request removed.** The vendored design system `@import`ed Archivo from Google Fonts, which the app's own `@font-face` rules already won the match against — so nothing rendered from it, but the request fired on every load and blocked first paint. That is the single deliberate modification to `_ds/`, recorded in [MAINTENANCE.md](MAINTENANCE.md) because a re-export would silently restore it.

**ESLint and Prettier, neither of which existed.** Deliberately narrow: `tsc` already runs strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, so the rules that earn their place are the React ones. It found two real things immediately — a `useRef(Date.now())` called during render, and a character class bounded by U+F900 whose visual twin at U+8C48 would have silently widened it by twenty thousand code points.

## 2026-09-07 — One content file per situation

`ja.json` had become the file you edit for everything, and adding a situation meant touching a shared lexicon in three places while hoping nobody else was in there.

```
content/ja/core.json      shared: lexicon, grammar pool, particles, conjugations
content/ja/bakery.json ─┐ one situation + the readings only it needs
content/ja/station.json ├──►  assemblePack()  ──►  PackFile  ──►  loadPack()
content/ja/…           ─┘
```

Adding a situation is now writing one file and listing it in `src/data/languages.ts`, where position decides the set number.

**What the split costs, and why it is worth paying.** Two files can now disagree about how a text reads. `assemblePack` throws on that rather than picking a winner, because progress is keyed on the text — quietly taking one reading over the other would attach a learner's history to a word that now reads differently. Repeating a reading identically across files is fine and expected.

`npm run import -- content/ja/<id>.json` reports what a candidate would add and then loads the pack it would make, which is the same throw the app boots on. It is safe before or after wiring the file in: a file already in the pack stands in for itself rather than colliding.

## 2026-09-05 — Content moves to JSON, and the tests stop pinning it

Adding sentences and situations used to cost more than writing them. Three things caused it, and all three are gone.

### How the pieces fit now

```
src/data/ja.json          authored content — one file per language
        │
        ▼  loadPack()     expands authored shapes into runtime ones
src/data/languages.ts     loads the packs, holds the registry
        │
        ▼  LanguagePack
state/useTsumiki          the seam: content + config + storage meet here
        │
        ├──► lib/         pure, takes content as arguments
        ├──► appReducer   pure, imports nothing
        └──► components/  presentational
```

Everything below `useTsumiki` is unchanged. The migration stopped at the seam by design — `lib/`, `state/appReducer` and `components/` never knew what language was loaded, and still don't.

**`loadPack` is the whole of the new machinery.** It exists because the shape that is good to write by hand is not the shape the drill wants to read:

```
AUTHORED (ja.json)                  RUNTIME (LanguagePack)
lexicon: { "パン": "pan" }    ─┐
                               ├──►  ans: [["パン","pan"], ["を","o"]]
ans: "パン|を"                ─┘
teaches: ["o", "tai"]          ──►  tags: { particles:["o"], conjugations:["tai"] }
(list position)                ──►  kicker: "Set 01"
items[].ans + words[]          ──►  words: [every content tile, deduped]
```

The lexicon is the load-bearing idea: a reading is written **once**, and everywhere else a tile is named by its text. "A text reads one way per pack" stopped being a rule a test enforces and became a property of the file's shape.

### What now guards content

| | |
| --- | --- |
| `tsc` | Missing required fields, wrong types — `resolveJsonModule` checks `ja.json` against `PackFile` |
| `loadPack` throws | A text not in the lexicon, an empty tile between separators, a `teaches` id declared nowhere. Names the sentence: `bakery 03 — "メロンパン" is not in the lexicon` |
| `packFileKeys.test.ts` | Typo'd **optional** keys — `"nte"` for `"note"` is legal TypeScript and silently drops the field |
| `languages.test.ts` | Content integrity over any pack: ids unique and `:`-free, tags resolve and are actually shown, every alternate buildable from the bank |

No schema library. A pack is compiled into the bundle, so it is build-time input. If content ever arrives at runtime — fetched, or out of IndexedDB — that flips and zod becomes the right answer.

### What was removed

- **`tests/fixtures/prototype-banks.json`** — pinned all 18 tile banks against output from the frozen `prototype/`. Adding a sentence, a word or a situation failed it, and `AUTHORING.md` had to tell you *not* to add a particle tile because of it. `buildBank` is now tested by its properties.
- **The pinned situation list** in `ja.test.ts` — asserted the app ships exactly `Bakery` and `Train station`.
- **`Particle.confusedWith`, `ConjugationPattern.verbGroups`, `VerbGroup`** — read by nothing but their own tests, authored for exercises that do not exist. `confusedWith` required symmetry, so adding one particle obliged you to edit others.
- **`docs/FLOW.md`** — re-narrated code that reads clearly and pinned one situation's exact tile bank in prose. Its "what this design assumes" section survives in [ROADMAP.md](ROADMAP.md#what-the-current-design-assumes).
- **Unit tests borrowing shipped content** — `buildBank`, `HomeScreen` and `useTsumiki` tests reached into `LANGUAGE.scenarios[0].items[5]` for convenient examples, so editing a sentence failed a test about something else. They own their fixtures now.

### The one behaviour change

Bakery's distractor pool grew from 24 words to 26. `クロワッサン` and `メロンパン` appear in its answers but were missing from the hand-written `words` list, so neither could ever be offered as a wrong tile. Deriving the list closed that gap. Train station's list was already complete and is unchanged.

### Carried forward

- **Ids are permanent.** Progress is keyed on `ja:item:bakery:01`, `ja:particle:o`, `ja:conjugation:tai`. Rewording a prompt, fixing an answer or adding an alternate is free; renumbering orphans a learner's history.
- **`note` and `teaches` are optional.** A short practice phrase is `{ "id", "en", "ans" }` and nothing more. Without a note, none renders and the status line stops promising one.
- **`words` is extras only.** A situation's answer vocabulary is derived; list only what no answer supplies. A redundant entry is dropped silently, so a new sentence never turns an existing one into an error.
- **Tests own their fixtures.** Only `tests/data/` and the two integration tests read shipped content, deliberately.

### Numbers

| | Before | After |
| --- | --- | --- |
| Content files | 7 `.ts` (460 lines) | 1 `.json` |
| Bakery `words` | 24 `[text, reading]` pairs | 11 texts |
| Readings per word | once per occurrence | once, in the lexicon |
| `docs/` | 484 lines | 397 |
| Tests | 297 | 335 |

Adding a third situation and two sentences — verified, then reverted — touched `ja.json` and nothing else.
