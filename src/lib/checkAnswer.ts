/* Judging what the learner built.

   Comparison is on the joined string, not on the tiles, which is what lets an
   alternate written as one string ("パンをお願いします") be accepted even though it
   is assembled from a different set of tiles than the canonical answer.

   How the tiles join is the language's business, not this file's — see
   LanguagePack.joiner — so every function here takes it as an argument. */

import type { SentenceItem, Tile } from '../data/types';

/**
 * The sentence the learner has built, as one string.
 *
 * `placed` holds indices into `bank`; an index that does not resolve is dropped
 * rather than producing "undefined" in the middle of the sentence. It has to be
 * dropped and not blanked, or a non-empty joiner would leave a doubled
 * separator where the missing tile was.
 */
export function buildString(
  bank: readonly Tile[],
  placed: readonly number[],
  joiner: string,
): string {
  return placed
    .map((index) => bank[index]?.[0])
    .filter((text) => text !== undefined)
    .join(joiner);
}

/** The item's own answer — the phrasing it is teaching. */
export function canonicalAnswer(item: SentenceItem, joiner: string): string {
  return item.ans.map((tile) => tile[0]).join(joiner);
}

/** Every answer this item accepts: the canonical one first, then its alternates. */
export function acceptedAnswers(item: SentenceItem, joiner: string): string[] {
  return [canonicalAnswer(item, joiner), ...(item.alts ?? [])];
}

/** Whether `built` is one of the answers this item accepts. */
export function isCorrect(item: SentenceItem, built: string, joiner: string): boolean {
  return acceptedAnswers(item, joiner).includes(built);
}

/** `alt` is accepted but not the phrasing being taught, so the drill can offer another go. */
export type Verdict = 'canonical' | 'alt' | 'wrong';

export function judge(item: SentenceItem, built: string, joiner: string): Verdict {
  if (built === canonicalAnswer(item, joiner)) return 'canonical';
  return (item.alts ?? []).includes(built) ? 'alt' : 'wrong';
}
