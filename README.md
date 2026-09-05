# Tsumiki

A Japanese sentence-building app for English-speaking learners. An English prompt is shown; you assemble the Japanese sentence from a bank of tiles. The tile bank is deliberately oversupplied — roughly 3x the tiles needed, minimum 12 — so a correct sentence cannot be brute-forced by elimination.

18 sentences across two situations: **Bakery** (10) and **Train station** (8).

> The repository is `langalong-lite`; the app inside it is **Tsumiki**. Same thing.

<!-- Badges deliberately omitted: React / TypeScript / Vite versions are still moving, and a stale badge is worse than none. Add once the stack is pinned. -->

<!-- Screenshots: three captures still to be taken — see docs/images/README.md. These links 404 until they exist. -->
<p align="center">
  <img src="docs/images/home.png" alt="Home — choose a situation" width="30%">
  <img src="docs/images/drill.png" alt="Drill — building a sentence" width="30%">
  <img src="docs/images/complete.png" alt="Set complete — first-try score" width="30%">
</p>

## How it plays

- Tap bank tiles to place them; tap a placed tile to send it back.
- **Check** validates the built string against the item's canonical answer plus its accepted alternates.
- **First miss** — silent retry: the answer line clears and a short status line appears, with no explanation.
- **Second miss** — the grammar note appears, explaining the particle or form at issue.
- **Third miss** — a "Show me the answer" button appears. Using it fills and locks the answer line, and forfeits the first-try credit.
- **Correct** — the status reads "Correct" and the same note is relabelled "Additional grammar tips".

The score on the set-complete screen is sentences built on the first try.

## Quick start

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

## Tech stack

| | |
| --- | --- |
| **React 19** + **TypeScript 5.7** | The app |
| **Vite 7** | Dev server and build |
| **StyleX 0.18** | Styles, colocated per component and compiled away at build time |
| **Vitest** + **Testing Library** | Unit, component and storage tests |

The app is organised so each piece can be read on its own: the language content is inert data that imports nothing, the drill rules are pure functions that import no content, and the components are presentational — one file each, styles included. The Japanese is authored in one JSON file, `src/data/ja.json`, and expanded into a `LanguagePack` at load — so a second language is a file plus a registry entry rather than a rewrite. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) has the dependency rule and the StyleX gotchas.

## Documentation

| Document | For |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Why the app works the way it does |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is arranged, and the StyleX rules |
| [docs/AUTHORING.md](docs/AUTHORING.md) | Adding sentences, situations, languages and glyphs |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What isn't built yet |
| [docs/MAINTENANCE.md](docs/MAINTENANCE.md) | Known debt, the prototype, troubleshooting |

## Project layout

| Path | What it is |
| --- | --- |
| `src/data/` | The language packs: `ja.json`, the shapes it takes, and the loader that expands it |
| `src/lib/` | Bank generation, segmentation, answer checking, storage keys, progress roll-up. Pure, and never imports `data/` |
| `src/storage/` | Progress in IndexedDB, behind interfaces. The only layer with side effects |
| `src/state/` | The reducer holding every drill rule, and the hook that joins it to content and storage |
| `src/components/` | One component and its StyleX styles per file |
| `src/config.ts` | The four difficulty and display dials |
| `tests/` | One file per component and per module, mirroring `src/` |
| `fonts/`, `icons/` | Vendored Archivo and Noto Sans JP subsets, and the app icons |
| `_ds/modernist-…/` | The Modernist design system — the source of every colour, space and radius token |
| `prototype/` | The pre-React app, kept for reference. Not part of the build |

## Tests

```
npm test
```

Across every component and module. Two are load-bearing: `tests/data/languages.test.ts` runs the content-integrity checks over every language pack, and `tests/components/App.test.tsx` plays real drills through the real content. Detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#tests).

## Adding content

All content is in `src/data/ja.json`. A sentence is the English prompt, the answer with tile boundaries marked, and three optional fields:

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

A short practice phrase is just `{ "id": "12", "en": "Two, please.", "ans": "二つ|ください" }`.

Readings live once in the file's `lexicon`, so a tile is named by its text everywhere else. `teaches` is what the sentence *teaches* rather than what it contains, which is why it is authored rather than inferred. A situation's distractor vocabulary is derived from its own answers — `words` lists only extras.

`npm test` verifies the tags resolve, the tiles are well formed, and every alternate is actually buildable from the bank. A new situation is another entry in `scenarios`; a new language is another JSON file plus an entry in `LANGUAGES`. Full guide, including the difficulty dials and regenerating the font subset: [docs/AUTHORING.md](docs/AUTHORING.md).

## Credits

The idea, the product decisions and the architecture are the author's. Two Claude tools were used to build it:

- **Claude Design** produced the Modernist design system, the original design document in [prototype/DESIGN.md](prototype/DESIGN.md), and the design component the app was ported from — the visual system, the screen structure and the drill rules as specified.
- **Claude Code** ported that component to the PWA now in `prototype/`, and then converted that prototype to the React and TypeScript app in `src/`.

### Fonts

Both typefaces are vendored as subsets in `fonts/` and are used under the SIL Open Font License 1.1. The full license text ships alongside them.

| Font | Copyright | License |
| --- | --- | --- |
| Archivo | Omnibus-Type — The Archivo Project Authors | [OFL 1.1](fonts/OFL-Archivo.txt) |
| Noto Sans JP | Adobe, with Reserved Font Name 'Source' | [OFL 1.1](fonts/OFL-NotoSansJP.txt) |
