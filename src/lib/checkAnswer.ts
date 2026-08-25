/* Judging what the learner built.

   Comparison is on the joined string, not on the tiles, which is what lets an
   alternate written as one string ("パンをお願いします") be accepted even though it
   is assembled from a different set of tiles than the canonical answer. */

import type { SentenceItem, Tile } from '../data/types';

/**
 * The sentence the learner has built, as one string.
 *
 * `placed` holds indices into `bank`; an index that does not resolve is skipped
 * rather than producing "undefined" in the middle of the sentence.
 */
export function buildString(bank: readonly Tile[], placed: readonly number[]): string {
  return placed
    .map((index) => bank[index]?.[0] ?? '')
    .join('');
}

/** Every answer this item accepts: the canonical one first, then its alternates. */
export function acceptedAnswers(item: SentenceItem): string[] {
  const canonical = item.ans.map((tile) => tile[0]).join('');
  return [canonical, ...(item.alts ?? [])];
}

/** Whether `built` is one of the answers this item accepts. */
export function isCorrect(item: SentenceItem, built: string): boolean {
  return acceptedAnswers(item).includes(built);
}
