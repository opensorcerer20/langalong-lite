/* Working out which bank tiles spell out the answer, for "Show me the answer".

   The same tile can be needed more than once in one sentence, so each bank
   position is claimed as it is matched and a claimed position is not reused:

     answer   [この] [パン] [は] [この] …
     bank      0:は  1:この  2:パン  3:この  …
     result   [1]   [2]    [0]   [3]        ← not [1] [2] [0] [1]

   Without the claim, the second この would match position 1 again and the
   answer line would render short. */

import type { DrillItem, Tile } from '../data/drill';

/**
 * Indices into `bank`, in order, that spell out the item's canonical answer.
 *
 * A tile missing from the bank falls back to index 0. That should not happen —
 * buildBank seeds the answer's own tiles first — but the drill must not break
 * if content and bank ever drift apart.
 */
export function revealIndices(item: DrillItem, bank: readonly Tile[]): number[] {
  const claimed = new Set<number>();

  return item.answer.map((tile) => {
    for (let index = 0; index < bank.length; index++) {
      if (bank[index]?.id === tile.id && !claimed.has(index)) {
        claimed.add(index);
        return index;
      }
    }
    return 0;
  });
}
