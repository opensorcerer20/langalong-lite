# Flow

[← README](../README.md)

A full walkthrough of Set 01 — Bakery, naming the state field and the action behind everything on screen, so the flow can be traced without reading the code. Written to support deciding what a second language or a second drill mode would have to change; the last part collects the assumptions that are currently baked in.

Everything below is one scenario, one mode. Nowhere in the app is there a concept of "which mode am I in" — the translate drill is not a mode, it is the only thing the app does.

## The state behind every screen

All of it lives in one object in `src/state/appReducer.ts`, and the whole app is a function of it:

| Field | Type | What it means |
| --- | --- | --- |
| `screen` | `'home' \| 'drill'` | Which screen. The set-complete screen is not a third value — see `finished` |
| `scenario` | number | Index into the active pack's `scenarios`. Bakery is `0` |
| `item` | number | Index of the current sentence within that set, `0`–`9` for Bakery |
| `placed` | `number[]` | Positions in the tile bank the learner has tapped, in tap order |
| `misses` | number | Failed checks on the current sentence. Resets per sentence |
| `status` | `'idle' \| 'wrong' \| 'right' \| 'shown'` | How the last check went |
| `firstTry` | number | Sentences answered correctly with no prior miss. The score |
| `finished` | boolean | The set is over; show the set-complete screen instead of the drill |

`src/state/useTsumiki.ts` derives everything else from those eight fields — it never stores anything of its own:

| Derived | How | Used for |
| --- | --- | --- |
| `scenario`, `item` | Look up `LANGUAGE.scenarios[scenario].items[item]` | The content on screen |
| `bank` | `buildBank(item, index, pools, TILE_MULTIPLIER)`, memoised per sentence | The tiles to choose from |
| `done` | `status` is `right` or `shown` | Locks the answer line; flips the primary button's job |
| `isLastItem` | `item === total - 1` | "Finish set" instead of "Next sentence" |
| `showNote` | `misses >= NOTE_AFTER_MISSES \|\| done` | Whether the grammar note is on screen |
| `showReveal` | `misses >= REVEAL_AFTER_MISSES && !done` | Whether "Show me the answer" is offered |
| `progress` | `(finished ? total : item) / total` | The rule under the header |

## Screen 1 — Home

Reached at launch, and by "← All" or "Choose another situation" from anywhere.

The header reads `Japanese · beginner` — the name from the active language pack, the level a literal in `App.tsx` — with a `Day 12` streak, and shows no back link — `App.tsx` passes `onBack` only while `screen === 'drill'`. The progress rule is forced to empty here regardless of drill state.

Below that, a band reading "Choose a situation" over "Build sentences you will actually need.", then one full-width row per entry in the active pack's `scenarios`. The Bakery row is built entirely from that scenario's own fields: `kicker` → `Set 01`, `items.length` → `10 sentences`, `name` → `Bakery`, `blurb` → "Asking for items, counting them, paying at the counter." A foot note explains that only the translate level exists so far.

**The one action.** Tapping the row dispatches `openScenario(0)`. That is a *full reset*, not a resume: the reducer returns `initialState` with `screen: 'drill'` and `scenario: 0`, so `item`, `misses`, `placed` and `firstTry` all go back to zero. Leaving a set halfway and re-entering it starts it again from sentence 1 with a zero score. There is no saved position anywhere — see [MAINTENANCE.md](MAINTENANCE.md).

## Screen 2 — Drill

The header becomes `Bakery · 01` with a `← All` back link. The progress rule fills to `item / 10`, so it is empty on the first sentence, not one-tenth full.

**The prompt.** `Say this in Japanese — item 1 of 10`, the language named from the pack, over the English sentence — for item 0, "One bread, please." The counter is one-based on screen, zero-based in state.

**The tile bank.** Generated once per sentence and memoised, so it is stable while the learner works. For Bakery item 0 the answer is 3 tiles, `TILE_MULTIPLIER` is 3, and the floor is 12 — so `max(12, ceil(3 × 3))` gives 12 tiles:

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tile | お願いします | パン | ている | 二つ | あります | 現金 | ください | 袋 | を | で | は | の |

Four of those are load-bearing. `パン` (1), `を` (8) and `ください` (6) spell the canonical answer. `お願いします` (0) is there because the item lists `パンをお願いします` as an accepted alternate — the generator segments each alternate and seeds any tile the canonical answer does not already supply, so every accepted answer is always physically buildable. The remaining eight are distractors drawn from the shared grammar pool (`ている`, `あります`, `で`, `は`, `の`) and Bakery's own vocabulary (`二つ`, `現金`, `袋`), which is what keeps a wrong tile plausible inside the scene rather than obviously foreign to it.

The order is deterministic, not random — arithmetic on the sentence's index — so the same sentence always presents the same bank in the same order.

**Placing a tile.** Tapping bank index 1 dispatches `tap(1)`, which appends `1` to `placed` and sets `status` back to `idle`, clearing any "not quite" message. The tile stays in the bank but turns invisible — hidden, not removed, so the remaining tiles never reflow under the learner's finger. `tap` is ignored if the tile is already placed, or once `done`.

**Removing a tile.** Tapping a tile on the answer line dispatches `untap(position)` — the position on the line, not the bank index, because the same tile can legitimately appear twice in one sentence. Also ignored once `done`.

**The answer line** shows the placed tiles followed by one short rule per tile still missing, so `ans.length` is visible as a shape before anything is typed. With nothing placed, item 0 shows three empty rules.

**Checking.** The primary button reads `Check` and is disabled while `placed` is empty. Tapping it dispatches `check`, which joins the placed tiles into one string and compares it against the canonical answer plus every alternate. Comparison is on the joined string, not on tiles — which is exactly what lets `パンをお願いします` be accepted even though it is built from a different set of tiles than `パンをください`.

**The miss ladder**, walked concretely on item 0:

| Misses | What happens | Driven by |
| --- | --- | --- |
| 0 | Nothing on screen yet | `status: 'idle'` |
| 1 | Answer line clears. Status reads "Not quite. Try again." No explanation | `status: 'wrong'`, `misses: 1` |
| 2 | Status becomes "Not yet — read the note", and the grammar note appears below, labelled **Grammar**: "を marks the direct object — the thing you are asking for. は would make it the topic…" | `showNote` — `misses >= NOTE_AFTER_MISSES` |
| 3 | A secondary "Show me the answer" button appears above the primary | `showReveal` — `misses >= REVEAL_AFTER_MISSES` |

Every wrong check clears `placed` entirely. The learner rebuilds rather than edits — a deliberate choice, not a side effect.

**Revealing.** `reveal` fills the answer line with the bank positions that spell the canonical answer — `[1, 8, 6]` for item 0 — and sets `status: 'shown'`. The line locks, the reveal button disappears, the note relabels to **Additional grammar tips**, and the status reads "Answer shown". It does not count as a miss, and it earns no score: `firstTry` is only ever incremented inside `check`, and only when `misses === 0`.

**Answering correctly.** `status: 'right'`, the status line reads "Correct", the note appears (or stays) labelled **Additional grammar tips**, and the answer line locks. `firstTry` increments only if this was a clean first attempt.

**Advancing.** Once `done`, the same primary button changes job — it now reads `Next sentence` and dispatches `next` instead of `check`. `next` clears `placed`, `misses` and `status` and increments `item`. On the last sentence the label is `Finish set` instead, and `next` sets `finished: true` while leaving `item` where it is.

## Screen 3 — Set complete

Not a third `screen` value: it is `screen === 'drill'` with `finished === true`, which is why the header still reads `Bakery · 01` and the back link still works. The progress rule reads 100%, because `progress` substitutes `total` for `item` once `finished`.

The screen shows `7 / 10` in large accent type over "built first try" — `firstTry` out of `items.length`. The wording matters: it is not sentences answered. A sentence missed once and then solved, or revealed, counts for nothing here.

Two actions. **Practise this set again** dispatches `restart`, which returns to `item: 0` and zeroes `firstTry` and `finished` while staying in the same scenario. **Choose another situation** dispatches `goHome`, which only changes `screen` — the drill state is left intact, though it never matters, because `openScenario` resets everything on the way back in.

## Every action in one table

| Action | Dispatched from | Effect | Ignored when |
| --- | --- | --- | --- |
| `openScenario(n)` | Home — scenario row | Full reset into scenario `n`, sentence 1, score 0 | never |
| `goHome()` | Header "← All"; done screen | `screen: 'home'`. Drill state untouched | never |
| `tap(bankIndex)` | Drill — bank tile | Appends to `placed`; clears `wrong` status | `done`, or already placed |
| `untap(position)` | Drill — placed tile | Removes that position from `placed` | `done` |
| `check()` | Drill — primary button | Right: `status: 'right'`, `firstTry++` if `misses === 0`. Wrong: `misses++`, `placed` cleared | `done`, or `placed` empty |
| `reveal()` | Drill — "Show me the answer" | Fills and locks the line, `status: 'shown'`. No score, no miss | `done` |
| `next()` | Drill — primary button once `done` | Clears the per-sentence fields; `item++`, or `finished: true` on the last | never |
| `restart()` | Done — "Practise this set again" | Back to sentence 1, score 0, same scenario | never |

## What this flow assumes

The parts that are Japanese-specific or single-mode, and would need attention before adding a language or a drill type. Roughly in order of how much would have to move.

**There is no mode dimension at all.** No field in `AppState`, no field on `Scenario`, no branch in `App.tsx`. Adding vocabulary recall or verb conjugation means introducing that concept from scratch — most naturally as a property of a scenario or of an item, with `DrillScreen` choosing a body from it. What is reusable regardless: `appReducer`'s miss ladder, scoring and advancing are about *attempts*, not about sentences, so a different drill body could sit on the same rules unchanged.

**The language dimension exists but has one entry.** The content sits behind a `LanguagePack` in `src/data/ja/`, `useTsumiki` is the only file that reads it, and the joiner and font stack are declared rather than assumed — so a second pack drills without touching `lib/`, `state/` or `components/`. What is still missing is everything around a *choice* of language: `LANGUAGE` is a constant in `src/data/languages.ts` with no picker, and progress and the streak are global rather than per-language.

**A tile is a fixed 2-tuple**, `[text, reading]` in `src/data/types.ts`. The names no longer say "kana", but the shape still hardcodes "written form plus one latin-script reading". A language needing no transliteration wastes the second field; one wanting gender, article or stress marks has nowhere to put it.

**Distractors come from exactly two pools** — the shared grammar list and the scenario's own words. That is the right shape for particle-and-conjugation confusion. A vocabulary drill would more likely want distractors that are semantically near the answer, which is a different selection rule inside `buildBank` rather than a different pool.

**A note is one prose string**, shown at a fixed point in the ladder. A conjugation drill probably wants structured data — stem, ending, rule — rather than a paragraph.

**Scoring is binary and per-set.** `firstTry` counts clean answers; nothing records which particle a learner keeps getting wrong, so nothing can adapt. The starred-progress and review ideas in [ROADMAP.md](ROADMAP.md) all need per-item history, which does not exist yet.

**Progress is linear.** `item` is an index that only moves forward through a fixed array. Jumping around, or a set that adapts its order, both need `item` to stop being a position in a list.

**The font subset is per-language and hand-maintained.** `Tile.tsx` no longer names a family — the pack's `fontStack` reaches it through `--font-target` — but the vendored `noto-sans-jp-subset.woff2` still covers only the 102 glyphs the two current sets use, and is regenerated by hand when vocabulary is added. A second non-latin language means a second subset and the same manual step again.
