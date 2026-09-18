/* Splitting a written-out sentence back into tiles.

   An item's `alts` are written as plain strings ("パンをお願いします") but the bank
   has to be able to build them, so each one is segmented against the vocabulary
   in play and any missing tile is seeded into the bank.

   Matching is longest-first: at each position every tile that prefixes the
   remaining text is considered and the longest wins. That matters because
   shorter tiles are prefixes of longer ones — お願いします would otherwise be
   consumed as お + 願いします, and 二枚 as 二 + 枚. It stays just as necessary in a
   space-separated language, where "a" prefixes "an". */

import type { Tile } from '../data/types';

export interface Segmentation {
  /** The tiles matched, in order, including repeats. */
  readonly tiles: readonly Tile[];
  /**
   * The text left over when no tile matched. Empty when the sentence segmented
   * completely — which is what a well-formed `alts` entry should always do.
   */
  readonly rest: string;
}

/**
 * Segment `text` into tiles drawn from `vocab`, longest match first.
 *
 * Stops at the first position nothing matches and reports the remainder in
 * `rest` rather than throwing, so callers can decide whether a partial
 * segmentation is a problem.
 *
 * @param joiner See LanguagePack.joiner. Empty for Japanese.
 */
export function segmentLongestFirst(
  text: string,
  vocab: readonly Tile[],
  joiner: string,
): Segmentation {
  const tiles: Tile[] = [];
  let rest = text;

  while (rest.length > 0) {
    let hit: Tile | null = null;
    for (const tile of vocab) {
      if (rest.startsWith(tile[0]) && (hit === null || tile[0].length > hit[0].length)) {
        hit = tile;
      }
    }
    if (hit === null) break;

    tiles.push(hit);
    rest = rest.slice(hit[0].length);

    /* Step over the separator so the next tile is matched from its own first
       character. Nothing to do when the joiner is empty. */
    if (joiner !== '' && rest.startsWith(joiner)) rest = rest.slice(joiner.length);
  }

  return { tiles, rest };
}
