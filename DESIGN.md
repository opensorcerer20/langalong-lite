# Tsumiki — Japanese sentence-building PWA

Design document for the first build. English-speaking learner, Japanese target language.

## Learner

An adult who is familiar with Japanese but cannot build sentences intuitively. The product is not vocabulary
acquisition; it is sentence assembly under constraint — particles, counters, verb stems, politeness.

## Product concept

Two levels of drill, sharing one tile-assembly mechanic:

1. **Translate level** (built) — an English prompt is shown; the learner assembles the Japanese sentence
   from a bank of tiles.
2. **Response level** (planned) — a Japanese line is spoken to the learner in a social situation (a
   shopkeeper asks what they want) and the learner assembles an appropriate reply. Correctness is
   pragmatic, not literal: several replies are valid and are ranked by politeness register.

The distinguishing decision against Duolingo-style tile drills: the tile bank is deliberately oversupplied,
so a correct sentence cannot be brute-forced by elimination.

## Decisions taken

| Question | Decision |
| --- | --- |
| Scope of first build | Translate level only, with a situation-select home screen |
| Distractor density | Brutal — roughly 3x the tiles needed, minimum 12 |
| Distractor character | Near-miss particles (を / が / に / で / へ / も) and wrong conjugations (ます / ました / ません / たい) |
| Tile granularity | Whole words, particles split out, conjugation endings as separate tiles (食べ + たい) |
| Script on tiles | Kana and kanji, with romaji beneath at small size |
| Wrong answer, 1st miss | Silent retry — answer line clears, short status line, no explanation |
| Wrong answer, 2nd miss | Grammar note appears, explaining the particle or form at issue |
| Wrong answer, 3rd miss | A secondary "Show me the answer" button appears; using it fills and locks the answer line and forfeits the first-try credit |
| Correct answer | "Correct" status first, then the same note relabelled "Additional grammar tips" |
| Session shape | Fixed set per situation with a progress rule; score is sentences built on the first try |
| Multiple valid answers | Accepted per item via an alternates list (e.g. パンをください / パンをお願いします) |
| PWA behaviours wanted | Install prompt, daily reminder / streak (streak shown as static chrome in this prototype) |

## Situations shipped

- **Set 01 — Bakery**, 10 sentences: asking for items, counters (一つ / 二つ), price questions,
  adjectives, 〜たい, paying by card.
- **Set 02 — Train station**, 8 sentences: ticket counters (枚), 〜行き, destination に, clock times,
  reserved seats, potential form (使えます), location questions.

Distractor tiles are drawn from a shared grammar pool plus the current situation's own vocabulary, so a
wrong tile is always plausible within the scene.

## Screens

1. **Home / situation select** — title, one full-width row per situation (set number, name, one-line
   description, sentence count), and a note that the response level unlocks per situation. Freely
   reachable from anywhere.
2. **Drill** — header with "← All", situation label and streak; progress rule; English prompt; answer
   line with placeholder rules for the remaining tiles; the tile bank; status line; grammar note; Check.
   Tapping a placed tile returns it to the bank.
3. **Set complete** — first-try score, a note about the response level, and two actions: practise again,
   or choose another situation.

## Visual system

The Modernist design system, unmodified: Archivo throughout, #f3f2f2 ground, single red accent #ec3013,
zero corner radius, 2px dividers between every major band, everything flush left. The app sits in a
460px column with ruled edges so it reads as a phone surface on desktop. Placed tiles invert to ink-on-ground;
bank tiles are surface with a 2px rule and take the accent on hover. Japanese glyphs render in Noto Sans JP.

## Implementation notes

One Design Component, `Sentence Builder.dc.html`. Content is two arrays of sentence objects
(`{ en, ans: [[kana, romaji], …], alts, note }`) plus a scenario list; the tile bank is generated
deterministically per item so it is stable across re-renders. State is a single object: screen, scenario
index, item index, placed tile indices, miss count, status, first-try count.

Exposed tweaks: distractor multiplier (1.5x–4.5x), misses before the grammar note appears, romaji on/off.

## Not built yet

- The response level, including politeness ranking of accepted replies.
- Real PWA plumbing: manifest, service worker, offline lesson cache, install prompt, notifications.
- Audio playback of prompts, and a kana keyboard fallback.
- Persistence — progress and streak are not stored between sessions.
