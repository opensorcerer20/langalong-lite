/* Opening the database, and the promise wrappers the rest of storage/ uses.

   IndexedDB's API is events and implicit transactions, which is workable but
   noisy at every call site. Everything below turns one piece of it into a
   promise and nothing more — no caching, no query building, no schema
   knowledge beyond the migration ladder. */

export const DB_NAME = 'tsumiki';
export const DB_VERSION = 1;

export const STORE_ATTEMPTS = 'attempts';
export const STORE_SCHEDULE = 'schedule';
export const STORE_META = 'meta';

export const INDEX_ATTEMPTS_BY_KEY = 'by-key';
export const INDEX_ATTEMPTS_BY_AT = 'by-at';
export const INDEX_SCHEDULE_BY_DUE = 'by-due';
export const INDEX_SCHEDULE_BY_LANGUAGE_UNIT = 'by-language-unit';

/**
 * One function per version step: index 0 upgrades v0 to v1, index 1 v1 to v2.
 *
 * Written as a ladder while there is only one rung on purpose. Retrofitting a
 * migration system after a version has shipped means writing it while also
 * guessing what state real databases are already in; adding a rung to an
 * existing ladder is a one-line change.
 */
const MIGRATIONS: readonly ((db: IDBDatabase) => void)[] = [
  /* v0 → v1 */
  (db) => {
    const attempts = db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'id', autoIncrement: true });
    attempts.createIndex(INDEX_ATTEMPTS_BY_KEY, 'key');
    attempts.createIndex(INDEX_ATTEMPTS_BY_AT, 'at');

    const schedule = db.createObjectStore(STORE_SCHEDULE, { keyPath: 'key' });
    /* Compound, so "what is due in Japanese" is one range scan rather than a
       full-store read filtered in memory. */
    schedule.createIndex(INDEX_SCHEDULE_BY_DUE, ['languageCode', 'dueAt']);
    schedule.createIndex(INDEX_SCHEDULE_BY_LANGUAGE_UNIT, ['languageCode', 'unit']);

    db.createObjectStore(STORE_META, { keyPath: 'key' });
  },
];

/** Turn one IDBRequest into a promise. */
export function fromRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

/**
 * Resolve when a transaction commits.
 *
 * Worth awaiting rather than the last request in it: a request can succeed and
 * the transaction still abort afterwards, and a write that reports success but
 * did not commit is the worst failure mode available here.
 */
export function fromTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}

/**
 * Open the database, running whatever migrations the stored version is behind.
 *
 * Rejects rather than throwing synchronously when IndexedDB is missing, so the
 * caller has one failure path to handle instead of two.
 */
export function openDatabase(name = DB_NAME, version = DB_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(name, version);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      for (const migrate of MIGRATIONS.slice(event.oldVersion, version)) migrate(db);
    };

    /* Another tab is holding the previous version open, so the upgrade cannot
       run. Failing here sends the caller to the in-memory fallback, which is
       better than hanging on a dialog the app cannot dismiss. */
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));

    request.onsuccess = () => {
      const db = request.result;
      /* A newer tab upgrading underneath us invalidates this connection.
         Closing it means the next open sees the new version. */
      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}
