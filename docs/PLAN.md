# Plan

[← README](../README.md)

The phases being built, in order, with what each depends on and what "done" means for it. Superseded phases are kept with the reason they were dropped, because the reason is usually worth more than the phase was.

This is the narrow, ordered document. Its neighbours:

| Document | Answers |
| --- | --- |
| **PLAN.md** (this file) | What is being built now, in what order, and why that order |
| [ROADMAP.md](ROADMAP.md) | What might get built, at two levels of certainty. Unordered |
| [ARCHITECTURE.md](ARCHITECTURE.md), [FLOW.md](FLOW.md) | How what already exists works |

An idea graduates from ROADMAP to here when it has an order and a done-condition. Nothing should be in both.

## The goal

**Instinctive Japanese sentence production** — not the ability to work out the right particle given time, but the ability to reach for it without working it out.

Two weak points, named in order:

1. **Particle usage.** The main one. This is what the remaining phases are built around.
2. **Verb conjugation.** Secondary, and scoped accordingly.

Every phase below is justified against that. Vocabulary is built and stays, but it is not the point; it is the thing that makes a particle question answerable, since a learner who does not know 切符 cannot demonstrate anything about を.

## Where things stand

| Phase | What | State |
| --- | --- | --- |
| 0 | Mode dimension, attempt tagging, grammar entities | **Merged** |
| 1 | Vocabulary cloze, and the shared question machinery | **Merged** |
| 1.5 | Particle-first pivot — content | **Blocked** on the open decision below |
| 2 | Particle practice | Depends on 1.5 |
| 3 | Verb conjugation | Depends on 2's machinery only |
| ~~4~~ | ~~Scenario flow — the vocab → conjugation → particles → sentence chain~~ | **Dropped** |
| 5 | Review mix and targeted remediation | Depends on 2 |

**Why Phase 4 was dropped.** It chained the four exercises into a fixed Duolingo-style cadence per situation, with a success screen between each. That design assumed the four exercises were equals. They are not — particles are the point and the others support them — and a fixed chain that visits particles once per situation works against the repetition that builds instinct. Jumping straight to a single exercise, which Phase 1 built, turns out to be the thing worth keeping. A lighter successor idea is in [ROADMAP.md](ROADMAP.md): mark a "next up" exercise on each situation row without forcing the order.

## Phase 1.5 — Particle-first pivot

**Blocked.** The decision below has to be made before this can start.

The pivot is a content problem, not a code problem. After Phase 1 the machinery to ask a particle question already exists — `Question`, `buildChoices`, `ExerciseScreen`, `useExercise` — and Phase 2 is one compiler on top of it. What does not exist is enough material to ask about.

Here is the whole of it, counted across the 18 shipped sentences:

| Particle | Sentences tagged | | Particle | Sentences tagged |
| --- | --- | --- | --- | --- |
| は | 7 | | の | 1 |
| を | 6 | | へ | 1 |
| に | 3 | | まで | 1 |
| **が** | **1** | | も | 0 |
| で | 1 | | から | 0 |

は/が is the hardest distinction in the language and the most likely place for "I know the rule but I don't reach for it" to bite. It has one sentence.

The shortage is structural rather than an oversight. Bakery and a train station are **transactional**, so their sentences are formulaic — Xをください, Xはどこですか — and a formulaic frame teaches the phrase, not the particle. が turns up rarely in a shop because you are mostly naming objects and requesting them. Writing more situations of the same kind would not fix the distribution; it would deepen it.

### The open decision

**Does particle practice get its own content kind, or stay scenario-bound?**

- **A deck, organised by contrast pair.** Short-form items — a gapped frame, the English that decides the answer, the right particle — grouped by the pair being taught (は/が, に/で, を/が). Reaches が-density immediately, and every item is one line rather than a full sentence with alternates and scene vocabulary, so it is quick to author. Suits the speed signal below, because the choice set is always two or three. Costs a second content organising principle, and puts two kinds of thing on the home screen.
- **Stay scenario-bound.** Particle questions keep coming from situation sentences via their tags, and the fix is authoring many more sentences across more situations. One content model, one kind of thing on the home screen, and slower to reach density against a distribution that structurally under-uses が.

Whichever wins, this phase is mostly Japanese content, drafted for review before merge — the tests can check that it is well-formed, never that it is right.

### Settled

- Particles are the spine. Conjugation is secondary. Vocabulary stays as built.
- The Phase 4 chain is gone.

## Phase 2 — Particle practice

The centrepiece. Depends on 1.5 for material; the code is small.

- `src/lib/questions/particle.ts` — one compiler, reusing `ExerciseScreen` and `useExercise` unchanged. Phase 1 exists so that this phase is a compiler and a chip.
- Distractors come from the particle's `confusedWith` set in `src/data/ja/particles.ts` and nowhere else. Contrastive by construction: offering は against まで teaches nothing, because nobody confuses them.
- Records `mode: 'particle'`, `unit: 'particle'`, key `ja:particle:<id>`. A particle deliberately does not share a row with the same particle as vocabulary — knowing the word を and knowing when を is right are different things. See [ARCHITECTURE.md](ARCHITECTURE.md#the-schema).
- **Sets are short and repeatable** rather than one 4-6 item section visited once. Reps are what build instinct, and a short set can be done again.

Also lands here, moved from the dropped Phase 4: **the reset button.** Red, deliberately off-palette rather than a design-system colour so it cannot be mistaken for shipped UI, wired to the `ProgressStore.clear()` that already exists and is called from nowhere. It moves forward to Phase 2 because this is where accumulated history first starts getting in the way of testing by hand.

**Done when:** a particle set runs from the home screen; distractors come only from `confusedWith`; per-particle rows accumulate; progress can be wiped without devtools.

## Phase 3 — Verb conjugation

The second weak point, scoped as the smaller phase. Depends only on the machinery Phase 1 built, so it could be done before or after Phase 2 — but not instead of it.

- `src/lib/questions/conjugation.ts` — given a verb and a target form, the answer is the multi-tile form; distractors are the same verb's *other* forms plus wrong endings.
- The only mode whose answer is several tiles, which `Question.answer` and `ClozeLine` already allow for.
- Needs verb content that does not exist: dictionary form, verb group, and the tiles each supported form is built from. Scenario-native verbs are thin, so a stock high-frequency pool supplements them, flagged in the data by an empty `scenarioIds` rather than in a separate config.

**Done when:** a conjugation set runs, mixing scenario verbs with the stock pool; per-pattern rows accumulate; the fallback rule is covered by tests.

## Phase 5 — Review mix and targeted remediation

**Promoted.** With the flow gone, this is what makes the app adaptive rather than a fixed set of drills — and adaptivity is what a stated weak point deserves. It is the phase that answers "*which* particles do I actually miss", rather than assuming.

- **Targeted remediation.** Per-tag error rate over recent attempts, distinguishing a consistent error from a sporadic one. Both the rolled-up `attempts`/`correct` on a `ScheduleRecord` and the raw log via `attemptsFor` already exist, so this needs no new storage API — it is a pure function in `src/lib/remediation.ts` over data already collected.
- Surfaced as a **dismissible suggestion**, never a gate and never mid-exercise.
- **Review mix** across situations, reusing the compilers from Phases 1-3. This is a data-selection change, not a new screen.

The review mix was gated on "2+ scenarios completed" — a notion that only existed because the flow defined what completing a scenario meant. With the flow gone the gate is redefined against the sentence set, or dropped.

**Done when:** remediation appears on threshold and dismisses; sporadic and consistent errors are distinguishable in the logged data even where only consistent ones surface.

## The instinct signal

Cutting across the phases, because the reasoning is not obvious from any one of them.

Getting the answer right eventually is not the goal. But "fast" is only evidence of instinct when there is nothing to search:

- **Speed counts where the choice set is small** — particle and vocabulary questions, two to four options. There, slow means working it out.
- **Speed means nothing on a sentence build.** Scanning a twelve-tile bank for 切符 measures how fast you find a tile, not how well you know the grammar. A slow sentence says nothing.
- **For sentence building the signal is first-try accuracy**, which `firstTry` and `misses` already capture.

`durationMs` is recorded on every attempt and nothing reads it yet, so the half that matters costs nothing to begin using.

## Open, not scheduled

Real, wanted, and deliberately not in a phase.

- **Lint and formatting tooling.** The repo has neither ESLint nor Prettier, and import style is inconsistent across files. Wanted — and it should be its own branch, because a repo-wide reformat landing inside feature work makes that work unreviewable.
- **Should the two exercise paths merge?** Phase 1 left `useTsumiki`/`DrillScreen` beside `useExercise`/`ExerciseScreen` rather than folding the sentence drill into the `Question` pipeline, because the drill was working and a new exercise should not have risked it. It leaves two hooks, two screens, and two copies of `tap`/`untap`/`next`/`restart`. The test to apply once particles and conjugation exist: **count how many fields a merged `Question` would carry that only one mode uses.** One or two, merge. A union with a discriminant, and the two paths were right all along.
- **Spaced repetition.** The groundwork is in — every row stamped `schedulerVersion: 0`, the attempt log kept precisely so a scheduler can be fitted against real history. Instinct is retrieval strength over time, which is what a scheduler models, so the pivot makes this more relevant than it was. Still not pulled in.

## How a phase runs

- **One phase per request.** Work stops at green tests and is handed over; review, commit and merge happen outside it. The next phase does not start on its own.
- **Branches are cut before work starts, and checked.** The first action of any phase is `git branch --show-current`, confirming `mode-expansion-0<phase>` — `mode-expansion-02` for Phase 2, and `mode-expansion-015` for Phase 1.5. Anything else, `main` included, and the work stops rather than starting on the wrong branch.
- Nothing is staged or committed from inside a phase; see [CLAUDE.md](../CLAUDE.md).

## Constraints that do not move

Easy to break by accident, expensive to undo.

- **Do not modify `buildBank`, or the contents or order of `src/data/ja/grammar.ts`.** The bank generator draws distractors by index from `[...grammar, ...words]`, and `tests/lib/buildBank.test.ts` pins all 18 generated banks against the banks the original prototype produced. Adding, removing or reordering one grammar tile silently reshuffles every sentence in the app. New exercises get new selection functions — which is why `buildChoices` exists separately.
- **Never change a shipped `id`** — scenario, sentence, particle or conjugation pattern. They are storage keys, and editing one orphans everything recorded against it.
- **`lib/`, `state/appReducer.ts` and `data/` never import `storage/`**, and `lib/` and `appReducer` never import content. See [ARCHITECTURE.md](ARCHITECTURE.md#the-one-rule).
- **Both `ProgressStore` implementations move together.** One contract suite runs over each, because the in-memory one is a real fallback and not only a test double.
- **A tile text carries exactly one reading per pack**, everywhere it appears.
