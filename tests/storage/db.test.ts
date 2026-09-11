/* The schema and how it is arrived at.

   The upgrade path is the part of IndexedDB that cannot be fixed after the
   fact: once a version has shipped, real databases exist in that state and a
   mistake in the ladder is permanent. These tests exist so a later rung can be
   added with some confidence that the first one still works. */

import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

import {
  DB_NAME,
  DB_VERSION,
  INDEX_ATTEMPTS_BY_AT,
  INDEX_ATTEMPTS_BY_KEY,
  INDEX_SCHEDULE_BY_DUE,
  INDEX_SCHEDULE_BY_LANGUAGE_UNIT,
  openDatabase,
  STORE_ATTEMPTS,
  STORE_META,
  STORE_SCHEDULE,
} from '../../src/storage/db';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe('openDatabase', () => {
  it('creates the database at the current version, with all three stores', async () => {
    const db = await openDatabase();
    expect(db.name).toBe(DB_NAME);
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual(
      [STORE_ATTEMPTS, STORE_SCHEDULE, STORE_META].sort(),
    );
    db.close();
  });

  it('gives attempts an autoincrementing key, so the log can only be appended to', async () => {
    const db = await openDatabase();
    const store = db.transaction(STORE_ATTEMPTS, 'readonly').objectStore(STORE_ATTEMPTS);
    expect(store.keyPath).toBe('id');
    expect(store.autoIncrement).toBe(true);
    expect([...store.indexNames].sort()).toEqual(
      [INDEX_ATTEMPTS_BY_AT, INDEX_ATTEMPTS_BY_KEY].sort(),
    );
    db.close();
  });

  it('keys schedule on the composed key and indexes it for the two queries a scheduler needs', async () => {
    const db = await openDatabase();
    const store = db.transaction(STORE_SCHEDULE, 'readonly').objectStore(STORE_SCHEDULE);
    expect(store.keyPath).toBe('key');
    expect(store.autoIncrement).toBe(false);

    /* Compound rather than a plain dueAt index: without the language in the key
       a due query would have to read every pack's rows and filter. */
    expect(store.index(INDEX_SCHEDULE_BY_DUE).keyPath).toEqual(['languageCode', 'dueAt']);
    expect(store.index(INDEX_SCHEDULE_BY_LANGUAGE_UNIT).keyPath).toEqual(['languageCode', 'unit']);
    db.close();
  });

  it('runs no migration when the database is already current', async () => {
    const first = await openDatabase();
    first.close();

    /* Reopening must not throw — a second run of the v0→v1 migration would try
       to create stores that already exist. */
    const second = await openDatabase();
    expect(second.version).toBe(DB_VERSION);
    expect([...second.objectStoreNames]).toHaveLength(3);
    second.close();
  });

  it('keeps data written before a reopen', async () => {
    const first = await openDatabase();
    const tx = first.transaction(STORE_SCHEDULE, 'readwrite');
    tx.objectStore(STORE_SCHEDULE).put({ key: 'ja:item:bakery:01', languageCode: 'ja', dueAt: 1 });
    await new Promise((resolve) => (tx.oncomplete = resolve));
    first.close();

    const second = await openDatabase();
    const row = await new Promise((resolve) => {
      const request = second
        .transaction(STORE_SCHEDULE, 'readonly')
        .objectStore(STORE_SCHEDULE)
        .get('ja:item:bakery:01');
      request.onsuccess = () => resolve(request.result);
    });
    expect(row).toMatchObject({ key: 'ja:item:bakery:01' });
    second.close();
  });

  /* The path the in-memory fallback depends on. If this rejected differently —
     or threw synchronously — openRepository would have two failure modes to
     handle instead of one. */
  it('rejects rather than throwing when IndexedDB is missing entirely', async () => {
    const saved = globalThis.indexedDB;
    // @ts-expect-error — removing the global is the condition under test
    delete globalThis.indexedDB;
    await expect(openDatabase()).rejects.toThrow(/not available/i);
    globalThis.indexedDB = saved;
  });
});
