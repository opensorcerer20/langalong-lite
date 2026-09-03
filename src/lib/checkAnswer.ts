/* Judging what the learner built.

   Comparison is on the joined string, not on the tiles, which is what lets an
   alternate be accepted even though it is assembled from a different set of
   tiles than the canonical answer:

     built       [パン] [を] [お願いします]  ─join─►  'パンをお願いします'
     accepted    'パンをください'                    ← canonical
                 'パンをお願いします'                 ← alternate 0  ✓ match

   How the tiles join is the language's business, not this file's — see
   LanguagePack.joiner — so every function here takes it as an argument. */

import type { DrillItem, Tile } from '../data/drill';

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
    .map((index) => bank[index]?.newLanguageText)
    .filter((text) => text !== undefined)
    .join(joiner);
}

/** Every answer this item accepts: the canonical one first, then its alternates. */
export function acceptedAnswers(item: DrillItem, joiner: string): string[] {
  const sentence = (tiles: readonly Tile[]) =>
    tiles.map((tile) => tile.newLanguageText).join(joiner);
  return [sentence(item.answer), ...item.alternates.map(sentence)];
}

/** Whether `built` is one of the answers this item accepts. */
export function isCorrect(item: DrillItem, built: string, joiner: string): boolean {
  return acceptedAnswers(item, joiner).includes(built);
}
