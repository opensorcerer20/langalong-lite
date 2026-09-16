/* Which vocabulary a sentence uses.

   The one tag that is derived rather than authored. A sentence's particles and
   conjugation patterns are what it was written to *teach*, which its tiles do
   not reveal — every bakery sentence contains です and almost none are about
   です. Its vocabulary is the opposite: the content words in the answer simply
   are the words it uses, and asking an author to list them again would be
   transcription with an opportunity for drift attached.

   "Content word" here means "not in the shared grammar pool", which is exactly
   the split the pool already encodes: particles, endings and set phrases on one
   side, the things a scene is about on the other.

   Pure, and free of content imports like everything else in lib/. */

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
