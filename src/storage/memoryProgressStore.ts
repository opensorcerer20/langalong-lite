/* The ProgressStore in two Maps.

   It has two jobs, and they are the same job. It is the test double, so the
   contract can be exercised without a database; and it is what the app falls
   back to when IndexedDB cannot be opened, so a learner in a private window
   still gets a working drill — one that forgets at the end of the session
   rather than one that breaks.

   Sharing the roll-up with the IndexedDB store is what keeps the two honest: a
   fallback that scored differently from the real thing would be worse than no
   fallback. The shared contract suite in tests/storage/ runs over both. */

import type { NewAttempt, ScheduleRecord } from '../lib/progress';
import { rollUp } from '../lib/progress';
import type { ProgressStore } from './types';

export function createMemoryProgressStore(): ProgressStore {
  const attempts: NewAttempt[] = [];
  const schedule = new Map<string, ScheduleRecord>();

  return {
    async recordAttempt(attempt: NewAttempt): Promise<void> {
      attempts.push(attempt);
      schedule.set(attempt.key, rollUp(schedule.get(attempt.key), attempt));
    },

    async getSchedule(key: string): Promise<ScheduleRecord | undefined> {
      return schedule.get(key);
    },

    async getSchedules(keys: readonly string[]): Promise<ReadonlyMap<string, ScheduleRecord>> {
      const found = new Map<string, ScheduleRecord>();
      for (const key of keys) {
        const row = schedule.get(key);
        if (row) found.set(key, row);
      }
      return found;
    },

    async due(languageCode: string, at: number, limit: number): Promise<readonly ScheduleRecord[]> {
      if (limit <= 0) return [];
      return [...schedule.values()]
        .filter((row) => row.languageCode === languageCode && row.dueAt <= at)
        /* Ties break on the key, matching how IndexedDB orders equal index
           entries by primary key. Without it the two stores would disagree
           about the order of rows seen in the same millisecond. */
        .sort((a, b) => a.dueAt - b.dueAt || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
        .slice(0, limit);
    },

    async attemptsFor(key: string): Promise<readonly NewAttempt[]> {
      return attempts.filter((attempt) => attempt.key === key);
    },

    async clear(): Promise<void> {
      attempts.length = 0;
      schedule.clear();
    },
  };
}
