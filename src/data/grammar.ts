/* The shared grammar pool. Every situation draws distractors from this list on
   top of its own vocabulary, so a wrong tile is always grammatically plausible:
   near-miss particles (を / が / に / で / へ / も) and wrong conjugations
   (ます / ました / ません / たい) sitting next to the right ones. */

import type { Tile } from './types';

export const GRAMMAR: readonly Tile[] = [
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
