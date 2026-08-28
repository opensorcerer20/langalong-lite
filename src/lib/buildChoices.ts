/* Generating the tiles offered for one single-answer question.

   The sibling of buildBank, and deliberately not the same function. buildBank
   fills a bank for a whole sentence — oversupplied so the answer cannot be
   found by elimination, sized from the answer's length, and drawing from two
   pools. A question with one right tile wants the opposite shape: a short,
   fixed number of options, all of them plausible enough that guessing is not
   better than knowing.

   The stronger reason to keep them apart is that buildBank must not change.
   tests/lib/buildBank.test.ts pins all 18 generated banks against the banks the
   original prototype produced, so a shared implementation would mean every
   change here reshuffling every sentence in the app.

   Deterministic like buildBank, and for the same reason: the same question
   always presents the same options in the same order, so a tile's position is
   stable across re-renders and the tests can pin it. */

import type { Tile } from '../data/types';

/**
 * The tiles to offer for a question whose answer is `answer`.
 *
 * Always contains the answer. Fills up to `count` with distractors from
 * `pool`, skipping anything sharing text with the answer or already drawn, and
 * returns fewer than `count` if the pool cannot supply enough — a short list is
 * a thin question, but an empty or duplicated option is a broken one.
 *
 * @param index Seeds the draw and the shuffle. The question's position in its
 *              set, so two questions do not draw the same distractors in the
 *              same order.
 */
export function buildChoices(
  answer: Tile,
  pool: readonly Tile[],
  count: number,
  index: number,
): Tile[] {
  const choices: Tile[] = [answer];
  const used = new Set<string>([answer[0]]);

  /* Drawing by index and removing as we go, so a tile is never drawn twice.
     The stride keeps consecutive draws from clustering in one part of the
     pool — the same arithmetic buildBank uses, for the same reason. */
  const remaining = pool.filter((tile) => !used.has(tile[0]));
  let draw = 0;
  while (choices.length < count && remaining.length > 0) {
    const [tile] = remaining.splice((index * 7 + draw * 13 + 3) % remaining.length, 1);
    if (tile && !used.has(tile[0])) {
      used.add(tile[0]);
      choices.push(tile);
    }
    draw++;
  }

  /* Fisher–Yates with a fixed sequence in place of a random one, so the answer
     does not sit first in every question. */
  for (let k = choices.length - 1; k > 0; k--) {
    const j = (k * 31 + index * 17 + 5) % (k + 1);
    const a = choices[k];
    const b = choices[j];
    if (a && b) {
      choices[k] = b;
      choices[j] = a;
    }
  }

  return choices;
}
