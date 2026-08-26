# Authoring

[← README](../README.md)

Changing the difficulty, adding sentences and situations, and regenerating the Japanese font subset. Everything here is content and configuration — none of it requires touching the drill logic.

## Difficulty and display

`src/config.ts`:

```ts
export const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
export const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
export const REVEAL_AFTER_MISSES = 3;  /* misses before "Show me the answer" appears */
export const SHOW_ROMAJI = true;       /* romaji beneath the kana on every tile */
```

## Adding a sentence

Push an object onto the items array in `src/data/bakery.ts` or `src/data/station.ts`:

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

## Adding a situation

Write its items and words in a file beside `bakery.ts`, then add an entry to `SCENARIOS` in `src/data/scenarios.ts`. Nothing else changes. Distractors are drawn from `GRAMMAR` plus that situation's own `words`, so a wrong tile is always plausible within the scene.

## New Japanese glyphs

The vendored `fonts/noto-sans-jp-subset.woff2` covers only the characters currently in use. Adding vocabulary with new kanji means regenerating it, or those glyphs fall back to the OS Japanese font:

```
curl -sG -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' \
     --data-urlencode 'family=Noto Sans JP:wght@100..900' \
     --data-urlencode 'text=<every JP character in the app>' \
     'https://fonts.googleapis.com/css2'
```

then download the single `woff2` the returned CSS points at, over `fonts/noto-sans-jp-subset.woff2`. The browser User-Agent is required: without it Google Fonts serves TrueType across nine static weights instead of one variable woff2.
