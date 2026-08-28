# Authoring

[← README](../README.md)

Changing the difficulty, adding sentences and situations, adding a language, and regenerating the Japanese font subset. Everything here is content and configuration — none of it requires touching the drill logic.

## Difficulty and display

`src/config.ts`:

```ts
export const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
export const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
export const REVEAL_AFTER_MISSES = 3;  /* misses before "Show me the answer" appears */
export const SHOW_READING = true;      /* the reading beneath the text on every tile */
```

## Adding a sentence

Push an object onto the items array in `src/data/ja/bakery.ts` or `src/data/ja/station.ts`:

```ts
{
  id: '09',
  en: 'Please give me a bag.',
  ans: [['袋', 'fukuro'], ['を', 'o'], ['ください', 'kudasai']],
  alts: ['袋をお願いします'],
  note: 'Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes.',
  tags: { particles: ['o'], conjugations: [] },
}
```

`id` only has to be unique within its situation — take the next number. **Once it has shipped, never change it.** A learner's history is stored against it, so editing one orphans everything recorded about that sentence. Rewording `en`, correcting `ans`, adding an `alt` are all free; renumbering is not. Ids may be non-contiguous, and a deleted sentence's id should be retired rather than reused.

`ans` is the canonical answer as `[text, reading]` tiles — particles split out, conjugation endings as their own tiles (食べ + たい). `alts` is optional and holds other accepted answers as plain strings; the bank generator segments each one and seeds any tile the canonical answer doesn't already supply, so every accepted answer is always buildable. `note` is required — it is what the learner sees after a second miss.

`tags` is required, and is what the sentence **teaches** rather than what it contains. Almost every sentence in the app has です in it and almost none are about です, so this cannot be inferred from the tiles — the `note` you just wrote is the best guide to what belongs here. Ids come from `src/data/ja/particles.ts` and `src/data/ja/conjugations.ts`; either list may be empty. Progress is recorded against these, so a sentence tagged `['o']` contributes to the learner's record for を, and remediation will eventually read them to say which grammar point someone keeps missing. A tag naming a particle the sentence neither answers with nor accepts as an alternate is rejected by the tests.

Vocabulary is *not* tagged — which words a sentence uses genuinely does follow from its tiles, so it is derived by `vocabIn` in `src/lib/tags.ts`. Listing them again would be transcription with an opportunity for drift attached.

One thing to watch when adding vocabulary: **a given tile text must read the same way everywhere it appears** in the pack. Tiles are keyed on their text, so 二つ spelled `futatsu` in one file and `hutatsu` in another would be one word to the drill and two to the learner's history.

`npm test` checks all of this: that every item has a note, a unique id and tags that resolve, that every tile is a well-formed pair, that a text is never read two ways, and that every alternate is actually segmentable from the vocabulary in play. An alternate the tiles cannot spell is the failure mode worth guarding against — it would be accepted by the checker but impossible to build.

## Adding a situation

Write its items and words in a file beside `bakery.ts`, then add an entry to `JA_SCENARIOS` in `src/data/ja/scenarios.ts`. Nothing else changes. Distractors are drawn from the pack's `grammar` plus that situation's own `words`, so a wrong tile is always plausible within the scene.

Give it an `id` — lowercase, no colon, unique in the pack, and permanent for the same reason a sentence's is. It is only ever seen in a storage key, so it is free to differ from `name`; `kicker` and `blurb` stay display copy.

## Adding a particle or a conjugation pattern

Both are lists of declared things, in `src/data/ja/particles.ts` and `src/data/ja/conjugations.ts`. A sentence's `tags` point at their ids, and progress is stored against them — `ja:particle:o`, `ja:conjugation:tai` — so **an id is permanent once shipped**, exactly like a sentence's.

A particle also has to appear in the pack's `grammar` pool, with the identical tile:

```ts
{
  id: 'ni',
  tile: ['に', 'ni'],
  gloss: 'marks a destination, a point in time, or where something is',
  confusedWith: ['de', 'e'],
}
```

Two rules the tests enforce, both worth understanding before you fight them:

- **Do not add the tile to `grammar.ts` to match.** The grammar pool feeds distractors into the sentence drill by index, and `tests/lib/buildBank.test.ts` pins all 18 generated banks against the banks the original prototype produced. Adding, removing or reordering one entry reshuffles every bank in the app. A particle whose tile is not already in the pool needs that fixture regenerated deliberately, not incidentally.
- **`confusedWith` must be symmetrical.** If は lists が, が lists は. An asymmetric pair means one particle offers the other as a distractor and never the reverse, which is not a rule anyone writes on purpose. An empty list is fine and means "nothing in this pack competes with it" — か is sentence-final, so nothing sits in its slot.

A conjugation pattern is simpler: an id, a display `name`, the `verbGroups` it applies to, and a `note` explaining how the form is built. Only add one a sentence actually teaches. A pattern nothing is tagged with is a row that can never be scored, and it would read later as a gap in the learner's knowledge rather than a gap in the content.

## Adding a language

A language is a folder beside `ja/` and one line in the registry. Nothing in `lib/`, `state/` or `components/` changes — none of them knows what language is loaded.

1. **`src/data/<code>/`** — the content: a grammar pool, a particle list, a conjugation-pattern list, one file per situation, and a scenario list, exactly as `ja/` is arranged.
2. **`src/data/<code>/index.ts`** — the pack:

```ts
export const ES: LanguagePack = {
  /* Also the first segment of every storage key this pack's progress is kept
     under, so it is fixed once shipped. */
  code: 'es',
  name: 'Spanish',
  joiner: ' ',
  fontStack: 'var(--font-body)',
  grammar: ES_GRAMMAR,
  particles: ES_PARTICLES,
  conjugations: ES_CONJUGATIONS,
  scenarios: ES_SCENARIOS,
};
```

3. **`src/data/languages.ts`** — add it to `LANGUAGES`, and point `LANGUAGE` at it to drill it.
4. **`tests/data/<code>.test.ts`** — whatever is true of that language alone, following `ja.test.ts`. The shape and integrity checks in `languages.test.ts` pick the new pack up automatically.

**Scenarios belong to the language.** Start from whatever situations are worth drilling in it — there is no obligation to mirror Japanese's bakery and train station, and a language spoken where nobody takes trains has no business with a train station set. The scenario list is a field on the pack precisely so each language can differ.

Two fields are worth getting right, because they are the things the rest of the app cannot work out for itself:

- **`joiner`** — `''` for a language written without spaces, `' '` for one written with them. It decides how tiles are joined into the sentence that gets judged, and how an `alts` string is segmented back into tiles. Wrong, and correct answers are marked wrong.
- **`fontStack`** — the face target-language text is drawn in, reaching `Tile` through the `--font-target` custom property. A language in latin script can use `var(--font-body)` and add no font at all; one in another script wants an `@font-face` in `src/styles/fonts.css` and its family named here.

`particles` and `conjugations` may start empty — a pack drills perfectly well with neither, since sentence tags are allowed to be empty lists. They are what the grammar exercises will read, so a language whose difficulty sits somewhere other than particles is free to leave one of them at `[]` and fill the other.

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
