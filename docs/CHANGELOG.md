# Changelog

[← README](../README.md)

Notable changes, newest first. Entries record *why* and what carries forward, not every commit — `git log` has those.

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
