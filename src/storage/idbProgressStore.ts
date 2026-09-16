/* The ProgressStore backed by IndexedDB.

   Every method is one transaction. recordAttempt is the only writer, and it
   spans both stores deliberately: appending the attempt and updating the row it
   rolls into must either both happen or neither, or the log and the cache drift
   apart and the log stops being able to rebuild the cache.

   Human review note: I'm not familiar with how this type of processing works*/

import type { NewAttempt, ScheduleRecord, StoredAttempt } from '../lib/progress';
import { hydrateAttempt, rollUp } from '../lib/progress';
import {
  fromRequest,
  fromTransaction,
  INDEX_ATTEMPTS_BY_KEY,
  INDEX_SCHEDULE_BY_DUE,
  STORE_ATTEMPTS,
  STORE_META,
  STORE_SCHEDULE,
} from './db';
import type { ProgressStore } from './types';

export function createIdbProgressStore(db: IDBDatabase): ProgressStore {
  return {
    async recordAttempt(attempt: NewAttempt): Promise<void> {
      const tx = db.transaction([STORE_ATTEMPTS, STORE_SCHEDULE], 'readwrite');
      const schedule = tx.objectStore(STORE_SCHEDULE);

      tx.objectStore(STORE_ATTEMPTS).add(attempt);

      const existing = await fromRequest<ScheduleRecord | undefined>(schedule.get(attempt.key));
      schedule.put(rollUp(existing, attempt));

      await fromTransaction(tx);
    },

    async getSchedule(key: string): Promise<ScheduleRecord | undefined> {
      const tx = db.transaction(STORE_SCHEDULE, 'readonly');
      return fromRequest<ScheduleRecord | undefined>(tx.objectStore(STORE_SCHEDULE).get(key));
    },

    async getSchedules(keys: readonly string[]): Promise<ReadonlyMap<string, ScheduleRecord>> {
      const tx = db.transaction(STORE_SCHEDULE, 'readonly');
      const store = tx.objectStore(STORE_SCHEDULE);
      const found = new Map<string, ScheduleRecord>();

      /* One transaction, one request per key. Issued together rather than
         awaited in turn so they queue on the same transaction instead of each
         one waiting for the last to resolve. */
      const rows = await Promise.all(
        keys.map((key) => fromRequest<ScheduleRecord | undefined>(store.get(key))),
      );
      for (const row of rows) if (row) found.set(row.key, row);

      return found;
    },

    async due(languageCode: string, at: number, limit: number): Promise<readonly ScheduleRecord[]> {
      if (limit <= 0) return [];

      const tx = db.transaction(STORE_SCHEDULE, 'readonly');
      const index = tx.objectStore(STORE_SCHEDULE).index(INDEX_SCHEDULE_BY_DUE);

      /* A one-element array sorts before every two-element array sharing its
         first element, so [code] is the lower bound for the whole language
         without needing a sentinel timestamp. */
      const range = IDBKeyRange.bound([languageCode], [languageCode, at]);

      return new Promise((resolve, reject) => {
        const rows: ScheduleRecord[] = [];
        const request = index.openCursor(range);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(rows);
            return;
          }
          rows.push(cursor.value as ScheduleRecord);
          if (rows.length >= limit) resolve(rows);
          else cursor.continue();
        };
        request.onerror = () => reject(request.error ?? new Error('due() failed'));
      });
    },

    async attemptsFor(key: string): Promise<readonly NewAttempt[]> {
      const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
      const index = tx.objectStore(STORE_ATTEMPTS).index(INDEX_ATTEMPTS_BY_KEY);
      const rows = await fromRequest<StoredAttempt[]>(index.getAll(IDBKeyRange.only(key)));
      /* getAll on an index returns primary-key order within the matched range,
         and the primary key is the autoincrementing id — so this is already
         insertion order, which for an append-only log is chronological.

         Hydrated on the way out, because this is the boundary where a row
         written by an older version of the app becomes one this version has
         promised its callers. */
      return rows.map(hydrateAttempt);
    },

    async clear(): Promise<void> {
      const tx = db.transaction([STORE_ATTEMPTS, STORE_SCHEDULE, STORE_META], 'readwrite');
      tx.objectStore(STORE_ATTEMPTS).clear();
      tx.objectStore(STORE_SCHEDULE).clear();
      tx.objectStore(STORE_META).clear();
      await fromTransaction(tx);
    },
  };
}
