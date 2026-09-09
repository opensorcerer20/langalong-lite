/* What the app asks of storage.

   Two interfaces, kept separate because they have different futures. Progress
   is stored in IndexedDB today. Content is read from the compiled language
   packs today and may be stored in IndexedDB later; declaring it as an async
   interface now is what lets that swap happen without touching a caller.

   The record shapes themselves live in lib/progress.ts — they are domain
   shapes, not storage shapes, and the arithmetic over them is pure. */

import type { LanguagePack } from '../data/types';
import type { NewAttempt, ScheduleRecord } from '../lib/progress';

/**
 * Where the language packs come from.
 *
 * Async despite today's implementation being a synchronous module read. That is
 * the entire reason it exists: an IndexedDB-backed content source would be
 * async, and adding the `await` later would mean changing every caller.
 */
export interface ContentSource {
  /** Every pack available. */
  languages(): Promise<readonly LanguagePack[]>;
  /** The pack the app is drilling. */
  active(): Promise<LanguagePack>;
}

/** Where a learner's history is kept. */
export interface ProgressStore {
  /**
   * Append one attempt and fold it into that key's schedule row.
   *
   * Callers do not await this in the drill path — see the note in
   * storage/index.ts on why a tile tap never waits for a transaction.
   */
  recordAttempt(attempt: NewAttempt): Promise<void>;

  getSchedule(key: string): Promise<ScheduleRecord | undefined>;

  /** Bulk read, for a screen that needs many rows at once. */
  getSchedules(keys: readonly string[]): Promise<ReadonlyMap<string, ScheduleRecord>>;

  /**
   * Rows due at or before `at`, soonest first.
   *
   * Nothing calls this yet. It is here because it is the one query a scheduler
   * cannot be built without, and declaring it now is what forced the compound
   * by-due index into the schema rather than discovering it later.
   */
  due(languageCode: string, at: number, limit: number): Promise<readonly ScheduleRecord[]>;

  /** Every attempt ever recorded for a key, oldest first. What a future
      scheduler replays to initialise a row it has not seen. */
  attemptsFor(key: string): Promise<readonly NewAttempt[]>;

  /** Wipe everything. The user-facing reset. */
  clear(): Promise<void>;
}
