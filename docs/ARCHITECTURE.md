# Architecture

[← README](../README.md)

How the code is arranged, why the layers point the way they do, and the StyleX rules worth knowing before editing a stylesheet. For a trace of what actually happens on each screen, see [FLOW.md](FLOW.md).

## The one rule

**Dependencies point one way, and language data is never imported by logic.**

```
components/  ──►  state/useTsumiki  ──►  state/appReducer  ──►  lib/       (pure, data-free)
                        │
                        └────────────►  data/                              (inert, logic-free)
```

- **`src/data/`** is the language packs. Content and types, no functions. Nothing here imports anything but its own types.
- **`src/lib/`** is the processing: bank generation, segmentation, answer checking, reveal placement. Pure functions that take the content they need as arguments and never import `data/`.
- **`src/state/appReducer.ts`** is every drill rule, as one pure reducer. It does not import content either — the `check` action carries the item, the bank and the joiner in the action itself.
- **`src/state/useTsumiki.ts`** is the single seam where content, state and logic meet. It is the only file that reads the active language pack: it resolves the current scenario, item and tile bank and applies the config dials.
- **`src/components/`** are presentational: props in, callbacks out. Only `App` calls the hook. One file per component, with its styles in it.

## Language packs

The Japanese lives in `src/data/ja/` behind a `LanguagePack`, and `src/data/languages.ts` holds the registry and the one line that says which pack is active. Nothing outside `src/data/ja/` names Japanese.

A pack carries its own content — a grammar pool and a list of scenarios — plus the two things the rest of the app cannot infer about a language:

- **`joiner`** — what sits between tiles when they are joined into a sentence, and what is skipped when one is segmented back. Empty for Japanese, which is written without spaces; `' '` for a space-separated language. This is the only genuinely script-dependent rule in the app, which is why it is declared rather than assumed: `buildString`, `isCorrect`, `segmentLongestFirst` and `buildBank` all take it as a required argument, so no caller can inherit Japanese's assumption by accident.
- **`fontStack`** — the face target-language text is drawn in. StyleX values are static, so the family cannot be interpolated into a rule: the pack sets `--font-target` on the app root through `PhoneColumn`, and `Tile`'s rule reads the variable. `global.css` carries a fallback for a pack that omits one.

Scenarios belong to the pack, not to the app. Another language's situations may look nothing like Japanese's — see [AUTHORING.md](AUTHORING.md#adding-a-language).

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
| `src/data/types.ts` | `Tile`, `SentenceItem`, `Scenario`, `LanguagePack` — the shapes, shared by every pack |
| `src/data/languages.ts` | The pack registry, and which one the app is drilling |
| `src/data/ja/index.ts` | The Japanese pack. The only file outside `ja/` that names Japanese |
| `src/data/ja/grammar.ts` | Japanese's 25 shared particles, endings and question words distractors draw on |
| `src/data/ja/bakery.ts`, `src/data/ja/station.ts` | One situation's sentences and vocabulary each |
| `src/data/ja/scenarios.ts` | Japanese's situation list, in home-screen order |
| `src/config.ts` | The four difficulty and display dials |
| `src/lib/buildBank.ts` | The deterministic tile bank |
| `src/lib/segment.ts` | Splitting a written-out sentence back into tiles, longest match first |
| `src/lib/checkAnswer.ts` | Building the answer string and judging it |
| `src/lib/revealPlacement.ts` | Which bank positions spell the answer |
| `src/state/` | The reducer and the hook |
| `src/components/<Name>.tsx` | One component and its StyleX styles, in one file |
| `src/styles/shared.ts` | The two styles used by more than one component: `screen` and `kicker` |
| `src/styles/global.css` | The page ground — `html`, `body`, `button`. No element owns these, so they stay CSS |
| `src/styles/fonts.css` | The two `@font-face` rules |
| `tests/` | One file per component and per module, mirroring `src/` |
| `tests/fixtures/prototype-banks.json` | All 18 tile banks as the prototype generated them |
| `fonts/`, `icons/` | Vendored Archivo (latin) and Noto Sans JP, subset to the 102 kana and kanji in use. Both variable, wght 100–900, both OFL 1.1 with the license text alongside. Pulled in through the bundler, which is why there is no `public/` |
| `_ds/modernist-…/` | The Modernist design system. `styles.css` is imported unmodified and is the source of every color, space and radius token |
| `DESIGN.md` | The design document the app was built from |
| `prototype/` | The pre-React app, kept for reference — see [MAINTENANCE.md](MAINTENANCE.md) |

## Tests

```
npm test
```

287 tests. Most are ordinary unit tests, but three are worth knowing about:

- **`tests/lib/buildBank.test.ts`** checks the generated tile bank against `tests/fixtures/prototype-banks.json`, which holds all 18 banks exactly as the original `app.js` produced them. The bank is deterministic — no RNG, just arithmetic on the item's index — so any change to the draw stride or the shuffle shows up here as a diff rather than as a silently different app.
- **`tests/components/App.test.tsx`** plays real drills through the real content: the miss ladder, the reveal forfeiting first-try credit, finishing a set and reading the score.
- **`tests/data/languages.test.ts`** runs the content-integrity checks over every pack in `LANGUAGES`, so a language added later inherits the whole net without writing it again. What is true of one language only — Japanese's set names, its particles, its empty joiner — lives in `tests/data/ja.test.ts` instead.
