# Authoring

[← README](../README.md)

Content lives in `content/<code>/` — one shared core file, then one file per situation. Adding a situation is writing one new file and listing it; adding a sentence is editing one file. `src/data/assemblePack.ts` merges them, `src/data/loadPack.ts` expands the result into the pack the app drills.

## The layout

```
content/ja/
 ├─ core.json        shared: lexicon, grammar pool, particles, conjugations
 ├─ bakery.json      one situation + the readings only it needs   → Set 01
 ├─ station.json                                                  → Set 02
 ├─ restaurant.json                                               → Set 03
 └─ meeting.json                                                  → Set 04

        │  assemblePack()   merges the lexicons, rejects disagreements
        ▼
     PackFile
        │  loadPack()       text → [text, reading], teaches → tags
        ▼
   LanguagePack             what the drill reads
```

Set numbering comes from the order in `JA_CONTENT.scenarios` in `src/data/languages.ts`, not from the filenames. Reordering that list renumbers the sets.

### core.json

```json
{
  "code": "ja",
  "name": "Japanese",
  "joiner": "",
  "fontStack": "'Noto Sans JP'",
  "lexicon": { "を": "o", "ください": "kudasai" },
  "grammar": ["は", "が", "を", "に"],
  "particles": { "o": { "tile": "を", "gloss": "marks the direct object" } },
  "conjugations": { "masu": { "name": "polite non-past", "note": "Attach ます to the verb stem." } }
}
```

### A situation file

```json
{
  "id": "bakery",
  "name": "Bakery",
  "blurb": "At the counter.",
  "lexicon": { "パン": "pan", "ケーキ": "keeki" },
  "words": ["ケーキ"],
  "items": [{ "id": "01", "en": "Bread, please.", "ans": "パン|を|ください", "teaches": ["o"] }]
}
```

Required: `id`, `name`, `blurb`, `lexicon`, `items`. Optional: `words`.

### The lexicon rule

A reading is written once; everywhere else a tile is named by its text alone. Each situation file carries the readings only it needs, so adding one does not mean editing a shared file.

The merge is where the split costs something: **two files giving the same text different readings is an error**, not a silent win for one of them.

```
"友達" is read "tomodachi" already and "yuujin" in "meeting" —
a text carries one reading, so change whichever is wrong
```

Repeating a reading identically across files is fine and expected.

## Difficulty and display

`src/config.ts`:

```ts
export const TILE_MULTIPLIER = 3; /* distractor density, 1.5–4.5 */
export const NOTE_AFTER_MISSES = 2; /* misses before the grammar note appears */
export const REVEAL_AFTER_MISSES = 3; /* misses before "Show me the answer" appears */
export const SHOW_READING = true; /* the reading beneath the text on every tile */
```

## Adding a sentence

Append to a situation's `items`, and add any new text to that file's `lexicon`.

```json
{
  "id": "11",
  "en": "Please give me a bag.",
  "ans": "袋|を|ください",
  "alts": ["袋をお願いします"],
  "note": "Same frame as the first sentence. Only the noun changes.",
  "teaches": ["o"]
}
```

A short practice phrase needs only three fields:

```json
{ "id": "12", "en": "Two, please.", "ans": "二つ|ください" }
```

| Field | |
| --- | --- |
| `id` | Unique within its situation. **Permanent once shipped** — history is keyed on it, so editing one orphans everything recorded about that sentence. Ids may be non-contiguous; retire a deleted one rather than reusing it. Rewording `en`, fixing `ans` or adding an `alt` are all free. |
| `en` | The English prompt. |
| `ans` | The canonical answer, `\|` between tiles. Particles split out, conjugation endings as their own tile: `食べ\|たい`. Spaces around the separator are ignored. |
| `alts` | Optional. Other accepted answers, written whole. The bank segments each one and seeds any tile the canonical answer lacks, so every accepted answer is always buildable. |
| `note` | Optional. Shown after a second miss. A sentence teaching a particle or a form earns one; a short phrase usually has nothing to explain. Omit the field — never give it `""`. |
| `teaches` | Optional. What the sentence **teaches**, not what it contains — almost every sentence has です in it and almost none are about です. Particle and pattern ids in one flat list; the loader sorts them into the right buckets. |

Every text in `ans` must be in a lexicon — the situation's or core's. A missing one fails the build with the sentence named:

```
bakery 03 — "メロンパン" is not in the lexicon
```

## Adding a situation

**1. Write `content/ja/<id>.json`** in the shape above. `id` is lowercase, `:`-free, unique in the pack, and permanent for the same reason a sentence's is — it is only ever seen in a storage key, so it is free to differ from `name`.

**2. Check it.** Nothing is written; this reports what the file would add and then loads the pack it would make.

```
npm run import -- content/ja/cafe.json
```

```
  situation     cafe "Café" → Set 05
  sentences     7
  lexicon       +11 new, 6 already present
  reused        10 tiles already in the grammar pool
  first taught  te-form
  extra words   お水, 魚, メニュー

  Not listed in src/data/languages.ts yet — add it there to drill it.

  ✓ the pack loads with it
```

Safe to run before or after wiring it in — a file already in the pack stands in for itself rather than colliding.

**3. List it** in `src/data/languages.ts`. Position decides the set number:

```ts
scenarios: [JA_BAKERY, JA_STATION, JA_RESTAURANT, JA_MEETING, JA_CAFE],
```

**4. Regenerate the font subset** if the situation introduced new kanji — see below.

**5. `npm test`**, then `npm run format` if you hand-wrote the JSON.

### `words` is for extras only

Distractors come from the pack's `grammar` plus the situation's vocabulary, and that vocabulary is *derived from the situation's own answers*. List only what no answer supplies — the spare counters and near-miss nouns that make a wrong tile plausible in the scene. A word already covered is dropped silently, so a new sentence never turns an existing entry into an error.

There is no `kicker` field. `Set 01`, `Set 02` … follow from list position.

## Adding a particle or a conjugation pattern

Both live in `core.json`, keyed by id. **An id is permanent once shipped** — progress is stored against `ja:particle:o` and `ja:conjugation:tai`.

```json
"particles":    { "ni":  { "tile": "に", "gloss": "marks a destination or a point in time" } },
"conjugations": { "tai": { "name": "want to", "note": "Attach たい to the verb stem: 食べ + たい." } }
```

A particle's `tile` must also be in the `grammar` pool — the pool is what feeds distractors into the drill, so a particle missing from it is never offered as a wrong answer. Adding or reordering a pool entry reshuffles the generated banks, which is harmless: banks are generated per render and never stored.

Only add a pattern a sentence actually teaches. A pattern nothing is tagged with is a row that can never be scored, and it reads later as a gap in the learner's knowledge rather than a gap in the content.

## What `npm test` checks

Ids unique and `:`-free, tags that resolve, tiles well formed, notes not blank, one reading per text, every declared particle carrying the tile the grammar pool holds, and every alternate actually segmentable from the tiles in play. That last one is the failure worth guarding — an alternate the bank cannot spell would be accepted by the checker and impossible to build.

## Adding a language

A language is a folder plus a registry entry. Nothing in `lib/`, `state/` or `components/` changes — none of them knows what language is loaded.

1. **`content/<code>/`** — `core.json` plus one file per situation.
2. **`src/data/languages.ts`** — import the files, `assemblePack` and `loadPack` them, add the pack to `LANGUAGES`, and point `LANGUAGE` at it to drill it.
3. **`tests/data/<code>.test.ts`** — whatever is true of that language alone, following `ja.test.ts`. The integrity checks in `languages.test.ts` pick the new pack up automatically.

Two fields are worth getting right, because they are what the rest of the app cannot work out for itself:

- **`joiner`** — `""` for a language written without spaces, `" "` for one written with them. It decides how tiles are joined into the sentence that gets judged, and how an `alts` string is segmented back into tiles. Wrong, and correct answers are marked wrong.
- **`fontStack`** — the face target-language text is drawn in, reaching `Tile` through the `--font-target` custom property. A latin-script language can use `var(--font-body)` and add no font at all; another script wants an `@font-face` in `src/styles/fonts.css` and its family named here.

**Situations belong to the language.** Start from whatever is worth drilling in it — there is no obligation to mirror Japanese's bakery and train station. `particles` and `conjugations` may start as `{}`.

Grammar notes, prompts and every other piece of UI copy stay in English — the app teaches an English speaker, whatever the target language is.

## New Japanese glyphs

`fonts/noto-sans-jp-subset.woff2` covers only the characters currently in use. Adding vocabulary with new kanji means regenerating it, or those glyphs fall back to the OS Japanese font — which reads as one tile in a bank being subtly the wrong shape.

```
npm run font
```

It derives the character set from the whole pack — notes, glosses and blurbs put Japanese on screen just as answers do — downloads the one variable woff2 Google Fonts cuts for exactly those characters, and writes `fonts/noto-sans-jp-subset.txt` beside it recording what the subset covers. So "is 肉 in there?" is a grep rather than a question about a binary.

```
grep -o 肉 fonts/noto-sans-jp-subset.txt
```

Skipping it does not break the build.
