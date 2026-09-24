/* Which tiles on the answer line do not belong. See docs/ARCHITECTURE.md. */

import type { SentenceItem, Tile } from '../data/types';

/**
 * Line positions whose tile is not part of the canonical answer.
 *
 * Positions are indices into `placed`. A position whose bank index does not
 * resolve counts as wrong — dropping it the way `buildString` does would shift
 * every later position and misalign the marks.
 */
export function wrongPositions(
  item: SentenceItem,
  bank: readonly Tile[],
  placed: readonly number[],
): readonly number[] {
  if (placed.length === 0) return [];

  /* Never against an alternate: marks that switched target between attempts
     would contradict each other. */
  const line = placed.map((index) => bank[index]?.[0]);
  const want = item.ans.map((tile) => tile[0]);
  return unmatched(line, want);
}

/** Positions of `line` left out of its longest common subsequence with `want`. */
function unmatched(line: readonly (string | undefined)[], want: readonly string[]): number[] {
  const rows = line.length;
  const cols = want.length;

  /* lengths[i][j] flattened: the LCS length of line[i..] and want[j..], with a
     zero final row and column so the walk needs no bounds checks. */
  const stride = cols + 1;
  const lengths = new Array<number>((rows + 1) * stride).fill(0);
  const lcs = (i: number, j: number) => lengths[i * stride + j] ?? 0;

  for (let i = rows - 1; i >= 0; i--) {
    for (let j = cols - 1; j >= 0; j--) {
      lengths[i * stride + j] =
        line[i] !== undefined && line[i] === want[j]
          ? lcs(i + 1, j + 1) + 1
          : Math.max(lcs(i + 1, j), lcs(i, j + 1));
    }
  }

  const wrong: number[] = [];
  let i = 0;
  let j = 0;
  while (i < rows) {
    if (j < cols && line[i] !== undefined && line[i] === want[j]) {
      i++;
      j++;
    } else if (j < cols && lcs(i + 1, j) < lcs(i, j + 1)) {
      /* The answer wants a tile the line does not have. A missing tile is not a
         wrong one, so nothing is marked. */
      j++;
    } else {
      wrong.push(i);
      i++;
    }
  }

  return wrong;
}
