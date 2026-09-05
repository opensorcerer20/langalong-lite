# Authoring

[← README](../README.md)

All content lives in one file per language — `src/data/ja.json`. Adding sentences, situations, particles and patterns means editing that file and nothing else. `src/data/loadPack.ts` expands it into the pack the app drills.

## The shape

```
ja.json
 ├─ code, name, joiner, fontStack
 ├─ lexicon        { text → reading }     every reading, written once
 ├─ grammar        [ text, … ]            shared distractor pool
 ├─ particles      { id → { tile, gloss } }
 ├─ conjugations   { id → { name, note } }
 └─ scenarios[]
     ├─ id, name, blurb
     ├─ words[]     extra distractors only — answer vocabulary is derived
     └─ items[]
         ├─ id, en, ans
         └─ alts?, note?, teaches?
```

**The lexicon is the rule that makes the rest work.** A reading is written once there; everywhere else a tile is named by its text alone. So `パン` cannot be `pan` in one place and `pann` in another — there is only one place.

## Difficulty and display

`src/config.ts`:

```ts
export const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
export const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
export const REVEAL_AFTER_MISSES = 3;  /* misses before "Show me the answer" appears */
export const SHOW_READING = true;      /* the reading beneath the text on every tile */
```

## Adding a sentence

Append to a situation's `items`:

```json
{
  "id": "11",
  "en": "Please give me a bag.",
  "ans": "袋|を|ください",
  "alts": ["袋をお願いします"],
  "note": "Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes.",
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
| `ans` | The canonical answer, `\|` between tiles. Particles split out, conjugation endings as their own tile: `食べ\|たい`. Spaces around the separator are ignored, so `"パン \| を"` is fine. |
| `alts` | Optional. Other accepted answers, written whole. The bank segments each one and seeds any tile the canonical answer lacks, so every accepted answer is always buildable. |
| `note` | Optional. Shown after a second miss. A sentence teaching a particle or a form earns one; a short phrase usually has nothing to explain, and filler is worse than nothing. Omit the field — never give it `""`. |
| `teaches` | Optional. What the sentence **teaches**, not what it contains — almost every sentence has です in it and almost none are about です. Particle and pattern ids in one flat list; the loader sorts them into the right buckets. |

**Every text in `ans` must be in the `lexicon`.** A missing one fails the build with the sentence named: `bakery 03 — "メロンパン" is not in the lexicon`.

`npm test` checks the rest: ids unique and `:`-free, tags that resolve, tiles well formed, notes not blank, and every alternate actually segmentable from the tiles in play. That last one is the failure worth guarding — an alternate the bank cannot spell would be accepted by the checker and impossible to build.

## Adding a situation

Append to `scenarios`. Only `id`, `name`, `blurb` and `items` are required:

```json
{
  "id": "cafe",
  "name": "Café",
  "blurb": "Ordering, sizes, sitting in or taking away.",
  "words": ["お冷や", "テイクアウト"],
  "items": []
}
```

`id` is lowercase, `:`-free, unique in the pack, and permanent for the same reason a sentence's is. It is only ever seen in a storage key, so it is free to differ from `name`.

**`words` is for extras only.** Distractors come from the pack's `grammar` plus the situation's vocabulary, and that vocabulary is *derived from the situation's own answers*. List only what no answer supplies — the spare counters and near-miss nouns that make a wrong tile plausible in the scene. A word already covered is dropped silently, so a new sentence never turns an existing entry into an error.

There is no `kicker` field. `Set 01`, `Set 02` … follow from list position, so reordering renumbers.

## Adding a particle or a conjugation pattern

Both are objects keyed by id. **An id is permanent once shipped** — progress is stored against `ja:particle:o` and `ja:conjugation:tai`.

```json
"particles":    { "ni":  { "tile": "に", "gloss": "marks a destination, a point in time, or where something is" } },
"conjugations": { "tai": { "name": "want to", "note": "Attach たい to the verb stem: 食べ + たい." } }
```

A particle's `tile` must also be in the `grammar` pool — the pool is what feeds distractors into the drill, so a particle missing from it is never offered as a wrong answer. Adding or reordering a pool entry reshuffles the generated banks, which is harmless: banks are generated per render and never stored.

Only add a pattern a sentence actually teaches. A pattern nothing is tagged with is a row that can never be scored, and it reads later as a gap in the learner's knowledge rather than a gap in the content.

## Adding a language

A language is one JSON file plus one line in the registry. Nothing in `lib/`, `state/` or `components/` changes — none of them knows what language is loaded.

1. **`src/data/<code>.json`** — the content, in the shape above.
2. **`src/data/languages.ts`** — `loadPack` it, add it to `LANGUAGES`, and point `LANGUAGE` at it to drill it.
3. **`tests/data/<code>.test.ts`** — whatever is true of that language alone, following `ja.test.ts`. The integrity checks in `languages.test.ts` pick the new pack up automatically.

Two fields are worth getting right, because they are what the rest of the app cannot work out for itself:

- **`joiner`** — `""` for a language written without spaces, `" "` for one written with them. It decides how tiles are joined into the sentence that gets judged, and how an `alts` string is segmented back into tiles. Wrong, and correct answers are marked wrong.
- **`fontStack`** — the face target-language text is drawn in, reaching `Tile` through the `--font-target` custom property. A latin-script language can use `var(--font-body)` and add no font at all; another script wants an `@font-face` in `src/styles/fonts.css` and its family named here.

**Situations belong to the language.** Start from whatever is worth drilling in it — there is no obligation to mirror Japanese's bakery and train station. `particles` and `conjugations` may start as `{}`; a language whose difficulty sits elsewhere is free to leave one empty and fill the other.

Grammar notes, prompts and every other piece of UI copy stay in English — the app teaches an English speaker, whatever the target language is.

## New Japanese glyphs

The vendored `fonts/noto-sans-jp-subset.woff2` covers only the characters currently in use. Adding vocabulary with new kanji means regenerating it, or those glyphs fall back to the OS Japanese font:

```
curl -sG -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' \
     --data-urlencode 'family=Noto Sans JP:wght@100..900' \
     --data-urlencode 'text=<every JP character in the app>' \
     'https://fonts.googleapis.com/css2'
```

then download the single `woff2` the returned CSS points at, over `fonts/noto-sans-jp-subset.woff2`. The browser User-Agent is required: without it Google Fonts serves TrueType across nine static weights instead of one variable woff2.
