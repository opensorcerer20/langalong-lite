/* Working out which bank tiles spell out the answer, for "Show me the answer".

   The bank can hold the same text more than once — 二枚 appears both in the
   answer and in the station vocabulary — so each position is claimed as it is
   matched and a claimed position is not reused. Without that, a sentence
   needing the same tile twice would point at one position twice and the answer
   line would render short. */

import type { Tile } from '../data/types';

/**
 * Indices into `bank`, in order, that spell out `answer`.
 *
 * Takes the answer tiles rather than a whole sentence: the claiming rule below
 * is the same whether the answer is a ten-tile sentence, a single vocabulary
 * word or a two-tile conjugated form, and every exercise needs it to fill the
 * line when the learner gives up.
 *
 * A tile missing from the bank falls back to index 0. That should not happen —
 * buildBank and buildChoices both seed the answer's own tiles first — but the
 * drill must not break if content and bank ever drift apart.
 */
export function revealIndices(answer: readonly Tile[], bank: readonly Tile[]): number[] {
  const claimed = new Set<number>();

  return answer.map((tile) => {
    for (let index = 0; index < bank.length; index++) {
      if (bank[index]?.[0] === tile[0] && !claimed.has(index)) {
        claimed.add(index);
        return index;
      }
    }
    return 0;
  });
}
