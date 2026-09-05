/* en2ja: the situations, in the order they appear on the home screen.

   `vocab` is the situation's distractor list — the words the bank draws wrong
   options from, on top of the shared grammar pool. It is not the same thing as
   the tiles the situation's exercises use: クロワッサン is in a bakery answer but
   was never offered as a distractor elsewhere, and it stays that way here.

   The order of `vocab` is load-bearing. buildBank draws distractors by stepping
   through [grammar, ...vocab] at a fixed stride, so reordering this list
   silently changes the contents of every bank in the set.

   TODO: that is fragile and should not survive long. It makes an ordinary
   authoring edit dangerous — inserting one word in the middle of this list
   quietly changes the distractors for every item in the set, with nothing to
   warn you and no test that fails. A comment telling the next person not to
   reorder it is a weak substitute for the property actually holding.

   The fix is not in this file: no arrangement of the data removes the
   dependence, because buildBank indexes into whatever order the array happens
   to have. It has to draw on tile identity instead of array position — hash
   (tile.id, item index), sort, take what it needs — which the `id` introduced
   in tiles.ts now makes possible. Deliberately not done as part of this
   migration: it changes every bank in the app, and the migration's whole safety
   argument is that output is identical before and after. Near-future work, once
   the content move has landed. */

import type { StoredScenario } from '../schema';

export const EN2JA_SCENARIOS: readonly StoredScenario[] = [
  {
    id: 'bakery',
    name: 'Bakery',
    library: 'en2ja',
    kicker: 'Set 01',
    blurb: 'Asking for items, counting them, paying at the counter.',
    vocab: [
      'counter:一つ',
      'counter:二つ',
      'counter:三つ',
      'demonstrative:これ',
      'demonstrative:それ',
      'demonstrative:この',
      'demonstrative:あの',
      'noun:パン',
      'noun:ケーキ',
      'noun:コーヒー',
      'noun:袋',
      'noun:カード',
      'noun:現金',
      'adjective:おいしい',
      'adjective:甘い',
      'adjective:温かい',
      'adjective:冷たい',
      'noun:もの',
      'verb:食べ',
      'verb:飲み',
      'verb:買い',
      'verb:払え',
      'question:いくら',
      'noun:おすすめ',
    ],
  },
  {
    id: 'station',
    name: 'Train station',
    library: 'en2ja',
    kicker: 'Set 02',
    blurb: 'Buying tickets, platforms, departure times, gates.',
    vocab: [
      'counter:一枚',
      'counter:二枚',
      'counter:三枚',
      'demonstrative:この',
      'noun:次',
      'noun:切符',
      'noun:電車',
      'noun:新幹線',
      'question:何番線',
      'question:何時',
      'noun:指定席',
      'noun:自由席',
      'noun:改札',
      'noun:出口',
      'noun:京都',
      'noun:大阪行き',
      'noun:奈良',
      'noun:渋谷',
      'noun:明日',
      'noun:今日',
      'verb:止まり',
      'verb:行き',
      'verb:出',
      'verb:使え',
      'verb:乗り',
      'verb:降り',
    ],
  },
  /* Imported from content/en2ja/cafe.json. Its exercises and its four new tiles
     are generated; this entry is not, because name/kicker/blurb/vocab have
     nowhere to live in the authored shape. */
  {
    id: 'cafe',
    name: 'Cafe',
    library: 'en2ja',
    kicker: 'Set 03',
    blurb: 'Ordering drinks, asking what is in them, finding the restroom.',
    vocab: [
      'noun:コーヒー',
      'noun:紅茶',
      'noun:ミルク',
      'noun:ケーキ',
      'noun:トイレ',
      'noun:カード',
      'noun:現金',
      'noun:おすすめ',
      'adjective:熱い',
      'adjective:冷たい',
      'adjective:甘い',
      'adjective:おいしい',
      'demonstrative:これ',
      'demonstrative:この',
      'counter:一つ',
      'counter:二つ',
      'verb:飲み',
      'verb:食べ',
      'question:いくら',
    ],
  },
];
