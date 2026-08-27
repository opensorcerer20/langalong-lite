/* What is recorded about a learner, and how one attempt folds into the record.

   The shapes and the arithmetic live here rather than in storage/ because none
   of it is about a database: rolling an attempt into a schedule row is a pure
   function of the row and the attempt, and it is the part most worth testing
   without opening one. storage/ supplies persistence around this, not instead
   of it.

   Nothing here schedules anything yet. The fields a scheduler will need are
   present and carried forward, which is the whole point — the observations
   cannot be recreated after the fact, so they are collected from the first
   session even though nothing reads them yet. */

import type { ReviewUnit } from './keys';

/**
 * How an attempt ended.
 *
 * `shown` is deliberately not folded into `wrong`. Revealing an answer and
 * guessing one wrong are different events, and a scheduler will want to tell
 * them apart — a reveal says "no recall at all", a wrong answer says "recall
 * was attempted and failed".
 */
export type Outcome = 'right' | 'wrong' | 'shown';

/** An attempt as the caller reports it. The store assigns `id`. */
export interface NewAttempt {
  /** Composed by src/lib/keys.ts. */
  readonly key: string;
  readonly languageCode: string;
  readonly unit: ReviewUnit;
  /** Epoch ms. */
  readonly at: number;
  readonly outcome: Outcome;
  /** Misses on this item before the attempt settled. Always 0 on a tile row. */
  readonly misses: number;
  /** Presentation to check, in ms. Response latency is an input to FSRS-style
      schedulers and is unrecoverable after the fact, which is why it is taken
      now rather than when a scheduler wants it. */
  readonly durationMs: number;
  /**
   * Set on a tile attempt: the item key it was inferred from.
   *
   * Its presence marks the row as *indirect evidence*. Building a sentence
   * correctly does not establish that the learner knows each tile in it, and a
   * scheduler should be free to weight these differently from a direct
   * vocabulary review — which it can only do if it can tell which they are.
   */
  readonly viaItem?: string;
}

/** An attempt as stored. Append-only: never updated, never deleted piecemeal. */
export interface Attempt extends NewAttempt {
  readonly id: number;
}

/**
 * The rolled-up record for one reviewable thing — a sentence or a tile.
 *
 * Derived entirely from that key's attempts, so it is a cache rather than a
 * source of truth. That is deliberate: a future scheduler can rebuild every row
 * from the attempt log, which is what makes changing scheduler possible at all.
 */
export interface ScheduleRecord {
  readonly key: string;
  readonly languageCode: string;
  readonly unit: ReviewUnit;

  /* Live now. */
  readonly firstSeenAt: number;
  readonly lastSeenAt: number;
  readonly lastResult: Outcome;
  readonly attempts: number;
  readonly correct: number;
  /** Consecutive successes since the last lapse. */
  readonly reps: number;
  /** Times a key that had been right came back wrong. */
  readonly lapses: number;

  /* Reserved for a scheduler. See SCHEDULER_VERSION. */
  readonly dueAt: number;
  readonly intervalDays: number;
  readonly ease: number;
  readonly stability: number | null;
  readonly difficulty: number | null;
  readonly schedulerVersion: number;
}

/**
 * Which scheduler last touched a row.
 *
 * `0` means none has. When a real scheduler ships as version 1 it can find
 * every row still at 0 and initialise it by replaying that key's attempts,
 * rather than starting the learner from nothing. This sentinel is what makes
 * the current step an interim one instead of a guess.
 */
export const SCHEDULER_VERSION = 0;

/** The SM-2 starting ease, stored so a scheduler inherits a sane value. */
const DEFAULT_EASE = 2.5;

/**
 * Fold one attempt into a key's record, creating it if this is the first.
 *
 * Pure, and total: any attempt against any prior state yields a valid record.
 */
export function rollUp(existing: ScheduleRecord | undefined, attempt: NewAttempt): ScheduleRecord {
  const right = attempt.outcome === 'right';

  /* A lapse is losing something already held, so it counts only on the
     transition out of `right`. Missing the same sentence twice running is one
     lapse, not two — otherwise a hard item inflates its own count and any
     scheduler reading it would over-punish. */
  const lapsed = existing !== undefined && existing.lastResult === 'right' && !right;

  const base = existing ?? {
    key: attempt.key,
    languageCode: attempt.languageCode,
    unit: attempt.unit,
    firstSeenAt: attempt.at,
    intervalDays: 0,
    ease: DEFAULT_EASE,
    stability: null,
    difficulty: null,
    schedulerVersion: SCHEDULER_VERSION,
    attempts: 0,
    correct: 0,
    reps: 0,
    lapses: 0,
  };

  return {
    key: base.key,
    languageCode: base.languageCode,
    unit: base.unit,
    firstSeenAt: base.firstSeenAt,
    intervalDays: base.intervalDays,
    ease: base.ease,
    stability: base.stability,
    difficulty: base.difficulty,
    schedulerVersion: base.schedulerVersion,

    lastSeenAt: attempt.at,
    lastResult: attempt.outcome,
    attempts: base.attempts + 1,
    correct: base.correct + (right ? 1 : 0),
    /* Anything short of a clean success breaks the run, a reveal included. */
    reps: right ? base.reps + 1 : 0,
    lapses: base.lapses + (lapsed ? 1 : 0),

    /* Until a scheduler runs, everything seen is due now. Writing the timestamp
       rather than leaving it null keeps the by-due index ordered and queryable
       from the first session. */
    dueAt: attempt.at,
  };
}
