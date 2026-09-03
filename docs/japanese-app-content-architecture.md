# Content Data Architecture

## The constraint that shapes this

Japanese has no spaces between words, so you can't reliably auto-split a sentence string into tiles without a morphological analyzer as a dependency. The architecture below avoids that entirely by never deriving tiles from text — tiles are always explicit, and any display text is derived *from* tiles, not the other way around.

## Core schema

```
Scenario: { id, name, library }   // library e.g. "en2ja" — which language the learner speaks vs. is learning, a course-level setting

Tile: {
  id,
  scenarioIds,   // array — a tile is authored once, reusable across scenarios
  newLanguageText,            // new language text, e.g. "パン"
  reading,       // romaji, e.g. "pan" — deliberate choice for the en2ja direction
  type           // "noun" | "verb" | "particle" | ... — required
}

Exercise: {
  id,
  scenarioId,
  promptText,             // native language text, e.g. "One bread, please." for English speakers — free text, not tile-based
  answerTileIds,          // ordered Tile ids — canonical answer
  alternateAnswerTileIds, // [[tileId,...], ...] — other valid tile sequences
  note,                   // optional teaching aside, shown on right/wrong
  tags                    // flat strings, e.g. ["particle:を", "conjugation:te-form"]
}
```

`Exercise` covers full-sentence Q/A. Whether shorter grammar-focused items ("phrase" exercises) get their own authored shape or get synthesized from this data later is still open — see the last section.

---

## Mapping your raw format to this schema (finalized)

Your revised raw shape:

```
// folder: en2ja/   (library — direction: English speaker learning Japanese)
// file:   bakery.json   (scenario label, also asserted inside the entry)
{
  "scenario": "bakery",
  "question": "One bread, please.",
  "answer": [["パン", "pan", "noun"], ["を", "o", "particle"], ["ください", "kudasai", "verb"]],
  "alts": [[["パン", "pan", "noun"], ["を", "o", "particle"], ["お願いします", "onegaishimasu", "verb"]]],
  "note": "を marks the direct object — the thing you are asking for. は would make it the topic, which sounds like you are commenting on bread, not requesting it.",
  "tags": { "particles": ["を"] }
}
```

This resolves essentially every open issue from the previous pass:

- `tags.particles` now uses `を`, matching the tile's `newLanguage` exactly — no more identifier mismatch. This also unlocks a genuinely useful validation step (see below).
- Every tuple, including inside `alts`, now consistently carries `[newLanguage, reading, type]` — no missing fields.
- `alts` is now an array of tuple-arrays, so a second alternate phrasing can be added later without changing shape.
- `scenario` is explicit on the entry rather than inferred purely from filename — the filename becomes a sanity check, not the source of truth.
- Reading is romaji, deliberately, for the en2ja direction.
- Vocab-review is out of scope, so the missing per-tile English gloss is no longer an issue.

**Import transform, finalized:**

1. **`question`** → `Exercise.promptText`, stored verbatim.
2. **`answer`** → for each `[newLanguage, reading, type]` tuple: look up an existing `Tile` matching `(newLanguage, type)`. Reuse if found (append this scenario to its `scenarioIds` if not already present); create if not. Collect resulting IDs, in order, as `answerTileIds`. `type` is now required — reject an entry missing it, rather than treating it as nullable.
3. **`alts`** → same resolution per tuple-array, producing one entry per alternate in `alternateAnswerTileIds`.
4. **`note`** → stored verbatim on `Exercise`.
5. **`tags`** → flatten `{ particles: [...], conjugations: [...] }` into prefixed strings (`["particle:を"]`). Because tag values now match tile `newLanguage` exactly, add a validation step: every tagged particle/conjugation value should appear among the `newLanguage` values of tiles in `answer` — catches typos or stale tags at import time instead of silently.
6. **`scenario`** → resolve to a `Scenario` row (create if new). The `scenario` field is the sole source of truth — files are no longer named after scenarios, so there's no filename to cross-check against.
7. **`library`** (from folder, e.g. `en2ja`) → stored on the `Scenario` record, not per-exercise, since direction is a course-level setting rather than a per-item fact.

**Dedup/reuse edge case, unchanged from before:** matching tiles on `(newLanguage, type)` will only merge two tiles if both fields agree exactly — worth a periodic lint (list tiles with identical `newLanguage` but different `type`) once you have enough content for accidental near-duplicates to matter. Not a concern at current scale.

---

## Status: ready to build against

With this shape, the data is ready to write the import script against. The remaining decisions are all inside the transform logic (steps 1-7 above), not the raw format itself. Recommended next step, if you want to keep moving: write the actual transform function against a small batch of real entries (bakery.json) and see whether the dedup/validation steps above hold up against real data quirks you haven't hit yet.

---

## Resolved: "phrase" and "sentence" share one shape

Both full sentences and short particle/conjugation phrases are authored with the exact same fields (`scenario`, `question`, `answer`, `alts`, `note`, `tags`) — a phrase entry is just one with a shorter `answer` array (e.g. two or three tiles instead of five). This means the import script never branches on exercise shape; it's the same transform regardless of length. There's no `kind` field needed on `Exercise` at all, since nothing in storage or import cares whether an entry "is" a sentence or a phrase — that distinction, if it matters anywhere, is just a property of how many tiles happen to be in `answerTileIds`, not a separate authored type.

This also simplifies the earlier open question about synthesizing phrase drills from sentence data — you no longer need to synthesize anything, since dedicated short-phrase entries can just be authored directly in the same file, same shape, alongside full sentences.
