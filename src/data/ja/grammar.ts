/* Japanese: the shared grammar pool. Every situation draws distractors from this
   list on top of its own vocabulary, so a wrong tile is always grammatically
   plausible: near-miss particles (を / が / に / で / へ / も) and wrong
   conjugations (ます / ました / ません / たい) sitting next to the right ones.

   Each language pack has a pool of its own; what belongs in one is whatever
   that language's near misses are. */

import type { Tile } from '../types';

export const JA_GRAMMAR: readonly Tile[] = [
  /* particles */
  ['は', 'wa'],
  ['が', 'ga'],
  ['を', 'o'],
  ['に', 'ni'],
  ['で', 'de'],
  ['も', 'mo'],
  ['の', 'no'],
  ['へ', 'e'],
  ['と', 'to'],
  ['か', 'ka'],
  ['まで', 'made'],
  ['から', 'kara'],

  /* endings and conjugations */
  ['です', 'desu'],
  ['ます', 'masu'],
  ['ました', 'mashita'],
  ['ません', 'masen'],
  ['たい', 'tai'],
  ['ている', 'teiru'],

  /* set phrases and question words */
  ['ください', 'kudasai'],
  ['お願いします', 'onegaishimasu'],
  ['あります', 'arimasu'],
  ['ありません', 'arimasen'],
  ['もらいます', 'moraimasu'],
  ['どこ', 'doko'],
  ['何', 'nani'],
];
