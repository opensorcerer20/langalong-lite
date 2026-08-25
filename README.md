# Tsumiki

A Japanese sentence-building PWA for English-speaking learners. An English prompt is shown; you assemble the Japanese sentence from a bank of tiles. The tile bank is deliberately oversupplied — roughly 3x the tiles needed, minimum 12 — so a correct sentence cannot be brute-forced by elimination.

18 sentences across two situations: **Bakery** (10) and **Train station** (8).

Installable and fully offline after the first visit. No build step, no dependencies, no framework.

## Running it

The app is static files, but it needs a real origin — a service worker will not register over `file://`, so opening `index.html` directly gives you the app without offline support or installability.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Any static host works for deployment; it must be HTTPS for the service worker to register anywhere other than localhost.

To install on a phone, load the deployed HTTPS URL and use the browser's install / "Add to Home Screen" action. It opens standalone, in portrait, with no browser chrome.

## How a drill works

- Tap bank tiles to place them; tap a placed tile to send it back.
- **Check** validates the built string against the item's canonical answer plus its accepted alternates.
- **First miss** — silent retry: the answer line clears and a short status line appears, with no explanation.
- **Second miss** — the grammar note appears, explaining the particle or form at issue.
- **Third miss** — a "Show me the answer" button appears. Using it fills and locks the answer line, and forfeits the first-try credit.
- **Correct** — the status reads "Correct" and the same note is relabelled "Additional grammar tips".

The score on the set-complete screen is sentences built on the first try.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | App shell — the 460px ruled column, header, and the three screens as static markup. App CSS lives in one `<style>` block. |
| `app.js` | Content, tile-bank generation, drill rules, and rendering. The whole application. |
| `fonts.css`, `fonts/` | Vendored Archivo (latin) and Noto Sans JP, subset to the 102 kana and kanji the sentence sets use. Both variable, wght 100–900. |
| `sw.js` | Cache-first service worker; precaches the shell so the app opens offline. |
| `manifest.webmanifest`, `icons/` | Install metadata and the app icon at 192, 512, maskable-512, plus 180 for iOS. |
| `_ds/modernist-…/` | The Modernist design system. `styles.css` is linked unmodified and is the source of every color, space and radius token. |
| `DESIGN.md` | The design document the app was built from. |
| `Sentence Builder.dc.html`, `support.js` | The original Claude Design handoff the app was ported from. Not part of the running app and not precached — kept for reference. |

## Changing things

**Difficulty and display** — three constants at the top of `app.js`:

```js
const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
const SHOW_ROMAJI = true;       /* romaji beneath the kana on every tile */
```

**Adding a sentence** — push an object onto `BAKERY` or `STATION` in `app.js`:

```js
{
  en: "Please give me a bag.",
  ans: [["袋","fukuro"],["を","o"],["ください","kudasai"]],
  alts: ["袋をお願いします"],
  note: "Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes."
}
```

`ans` is the canonical answer as `[kana, romaji]` tiles — particles split out, conjugation endings as their own tiles (食べ + たい). `alts` is optional and holds other accepted answers as plain strings; the bank generator segments each one and seeds any tile the canonical answer doesn't already supply, so every accepted answer is always buildable. `note` is required — it is what the learner sees after a second miss.

**Adding a situation** — add an entry to `SCENARIOS` with its own `items` array and a `words` pool. Distractors are drawn from `GRAMMAR` (25 shared particles, endings and question words) plus that situation's own `words`, so a wrong tile is always plausible within the scene.

**New Japanese glyphs** — the vendored `fonts/noto-sans-jp-subset.woff2` covers only the characters currently in use. Adding vocabulary with new kanji means regenerating it, or those glyphs fall back to the OS Japanese font:

```
curl -sG -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' \
     --data-urlencode 'family=Noto Sans JP:wght@100..900' \
     --data-urlencode 'text=<every JP character in the app>' \
     'https://fonts.googleapis.com/css2'
```

then download the single `woff2` the returned CSS points at, over `fonts/noto-sans-jp-subset.woff2`, and bump `CACHE` in `sw.js`. The browser User-Agent is required: without it Google Fonts serves TrueType across nine static weights instead of one variable woff2.

**After changing any precached file** — bump `CACHE` in `sw.js` (currently `tsumiki-v2`). The service worker is cache-first, so without a bump anyone who has already loaded the app keeps the old copy indefinitely. The activate handler deletes the previous cache.

## Not built yet

Carried over from `DESIGN.md`:

- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Persistence** — progress and the streak are not stored between sessions. The "Day 12" streak is static chrome.
- **Notifications** and the daily reminder.
- **Audio** playback of prompts, and a kana keyboard fallback.
