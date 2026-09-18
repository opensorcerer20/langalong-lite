/* Which vocabulary a sentence uses: its answer tiles minus the shared grammar
   pool. Derived rather than authored, unlike `teaches`. loadPack uses it to
   build each situation's distractor words. */

import type { SentenceItem, Tile } from '../data/types';

/**
 * The vocabulary tiles in `item`'s canonical answer, in order and without
 * repeats, with shared grammar (provided by parameter) filtered out.
 *
 * @param sharedGrammar The pack's shared grammar pool — see LanguagePack.grammar.
 *                Used to filter out shared grammar from return value.
 */
export function getVocabIn(item: SentenceItem, sharedGrammar: readonly Tile[]): readonly Tile[] {
  const isGrammar = new Set(sharedGrammar.map((tile) => tile[0]));
  const seen = new Set<string>();
  const vocab: Tile[] = [];

  for (const tile of item.ans) {
    const [text] = tile;
    if (isGrammar.has(text) || seen.has(text)) continue;
    seen.add(text);
    vocab.push(tile);
  }

  return vocab;
}
