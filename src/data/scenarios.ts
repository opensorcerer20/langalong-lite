/* The situation list, in the order they appear on the home screen.

   To add a situation: write its items and words in a file beside this one and
   add an entry here. Nothing else needs to change — the bank generator, the
   drill rules and every component read the scenario through this list. */

import { BAKERY_ITEMS, BAKERY_WORDS } from './bakery';
import { STATION_ITEMS, STATION_WORDS } from './station';
import type { Scenario } from './types';

export const SCENARIOS: readonly Scenario[] = [
  {
    name: 'Bakery',
    kicker: 'Set 01',
    blurb: 'Asking for items, counting them, paying at the counter.',
    items: BAKERY_ITEMS,
    words: BAKERY_WORDS,
  },
  {
    name: 'Train station',
    kicker: 'Set 02',
    blurb: 'Buying tickets, platforms, departure times, gates.',
    items: STATION_ITEMS,
    words: STATION_WORDS,
  },
];
