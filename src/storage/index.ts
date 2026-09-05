/* Assembling the repository, and deciding what to do when storage is missing.

   This is the only file the app outside storage/ imports. Everything it hands
   back is an interface, so a caller never learns whether its progress is going
   to IndexedDB or to a Map. */

import { openDatabase } from './db';
import { createIdbProgressStore } from './idbProgressStore';
import { createMemoryProgressStore } from './memoryProgressStore';
import { createModuleContentSource } from './moduleContentSource';
import type { ContentSource, ProgressStore } from './types';

export interface Repository {
  readonly content: ContentSource;
  readonly progress: ProgressStore;
  /**
   * False when progress is being kept in memory because IndexedDB could not be
   * opened. Exposed so the UI can say so plainly — silently pretending to save
   * is worse than a session that admits it will be forgotten.
   */
  readonly durable: boolean;
}

/**
 * Ask the browser not to evict this origin's storage.
 *
 * Best effort by design: browsers grant it on their own criteria and may not
 * prompt at all. Worth asking because IndexedDB is evictable under storage
 * pressure otherwise, and a learner's history is not something to lose to a
 * cache sweep. Never awaited by the caller — it must not delay first render.
 */
function requestPersistence(): void {
  void navigator.storage?.persist?.().catch(() => {
    /* Refused or unsupported. Nothing to do: the app works either way. */
  });
}

/**
 * Open storage, falling back to memory if IndexedDB is unavailable.
 *
 * It genuinely can be: some private-browsing modes, site data blocked by
 * policy, quota exhaustion, or an upgrade blocked by another tab holding the
 * old version open. None of those should stop someone drilling a sentence.
 */
export async function openRepository(): Promise<Repository> {
  const content = createModuleContentSource();

  try {
    const db = await openDatabase();
    requestPersistence();
    return { content, progress: createIdbProgressStore(db), durable: true };
  } catch (error) {
    console.warn('Tsumiki: progress will not be saved this session.', error);
    return { content, progress: createMemoryProgressStore(), durable: false };
  }
}

export type { ContentSource, ProgressStore } from './types';
